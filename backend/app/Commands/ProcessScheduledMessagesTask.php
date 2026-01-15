<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Repositories\MessageRepository;
use App\Repositories\ChannelRepository;
use App\Repositories\ChannelUserRepository;
use App\Entities\MessageEntity;
use App\Models\SystemSettingModel;

class ProcessScheduledMessagesTask extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'tasks:process-messages';
    protected $description = '處理已到期的排程訊息';

    private string $logFile;
    private MessageRepository $messageRepository;
    private ChannelRepository $channelRepository;
    private ChannelUserRepository $channelUserRepository;
    private SystemSettingModel $settingModel;

    public function run(array $params)
    {
        $this->logFile = WRITEPATH . 'logs/scheduler.log';
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelUserRepository = new ChannelUserRepository();
        $this->settingModel = new SystemSettingModel();

        // 檢查排程器是否啟用
        if (!$this->settingModel->get('scheduler.enabled', true)) {
            $this->log('排程器已停用，跳過執行');
            return;
        }

        try {
            $scheduledMessages = $this->messageRepository->getScheduledMessagesReady();

            if (empty($scheduledMessages)) {
                $this->log('沒有待處理的排程訊息');
                return;
            }

            $count = count($scheduledMessages);
            $this->log("找到 {$count} 筆待處理的排程訊息");

            foreach ($scheduledMessages as $message) {
                $this->processMessage($message);
            }

            $this->log('排程訊息處理完成');
        } catch (\Exception $e) {
            $this->log('處理排程訊息時發生錯誤: ' . $e->getMessage(), 'error');
        }
    }

    private function processMessage(MessageEntity $message): void
    {
        $this->log("處理訊息 ID: {$message->id} - {$message->title}");

        $this->messageRepository->updateStatus($message->id, MessageEntity::STATUS_SENDING);
        $channelOptions = $this->messageRepository->getChannelOptions($message->id);
        $results = [];

        foreach ($message->channelIds as $channelId) {
            $channel = $this->channelRepository->find($channelId, $message->userId);

            if (!$channel || !$channel->enabled) {
                $this->messageRepository->addResult($message->id, $channelId, false, '渠道不存在或已停用');
                $results[] = ['success' => false];
                continue;
            }

            $targetUsers = [];
            $options = $channelOptions[$channelId] ?? ['type' => 'all'];

            if (($options['type'] ?? 'all') === 'selected' && !empty($options['users'])) {
                $targetUsers = $options['users'];
            } else {
                $users = $this->channelUserRepository->findByChannelId($channelId);
                $targetUsers = array_map(
                    fn($u) => $u->providerId,
                    array_filter($users, fn($u) => $u->status === 'active')
                );
            }

            if (empty($targetUsers) && $channel->getConfigValue('targetId')) {
                $targetUsers = [$channel->getConfigValue('targetId')];
            }

            if (empty($targetUsers)) {
                $this->messageRepository->addResult($message->id, $channelId, false, '無發送對象');
                $results[] = ['success' => false];
                continue;
            }

            $sendResult = $this->sendToChannel($channel, $message->title, $message->content, $targetUsers);

            $this->messageRepository->addResult(
                $message->id,
                $channelId,
                $sendResult['success'],
                $sendResult['error'] ?? null
            );

            $results[] = $sendResult;

            if ($sendResult['success']) {
                $this->log("  渠道 {$channel->name}: 成功");
            } else {
                $this->log("  渠道 {$channel->name}: 失敗 - " . ($sendResult['error'] ?? '未知錯誤'));
            }
        }

        $successCount = count(array_filter($results, fn($r) => $r['success']));
        $totalCount = count($results);

        if ($totalCount === 0) {
            $finalStatus = MessageEntity::STATUS_FAILED;
        } elseif ($successCount === $totalCount) {
            $finalStatus = MessageEntity::STATUS_SENT;
        } elseif ($successCount > 0) {
            $finalStatus = MessageEntity::STATUS_PARTIAL;
        } else {
            $finalStatus = MessageEntity::STATUS_FAILED;
        }

        $this->messageRepository->updateStatus($message->id, $finalStatus, date('Y-m-d H:i:s'));
    }

    private function sendToChannel($channel, string $title, string $content, array $targetUsers): array
    {
        try {
            if ($channel->isLine()) {
                return $this->sendToLine($channel, $title, $content, $targetUsers);
            } elseif ($channel->isTelegram()) {
                $successCount = 0;
                $errors = [];
                foreach ($targetUsers as $chatId) {
                    $res = $this->sendToTelegram($channel, $title, $content, $chatId);
                    if ($res['success']) {
                        $successCount++;
                    } else {
                        $errors[] = $res['error'] ?? 'Unknown error';
                    }
                }

                if ($successCount > 0) {
                    return ['success' => true];
                }
                return ['success' => false, 'error' => implode(', ', $errors)];
            }
            return ['success' => false, 'error' => '不支援的渠道類型'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendToLine($channel, string $title, string $content, array $targetIds): array
    {
        try {
            $httpClient = new \LINE\Clients\MessagingApi\Api\MessagingApiApi(
                new \GuzzleHttp\Client(),
                \LINE\Clients\MessagingApi\Configuration::getDefaultConfiguration()
                    ->setAccessToken($channel->getConfigValue('channelAccessToken'))
            );

            $text = "📢 {$title}\n\n{$content}";

            $message = new \LINE\Clients\MessagingApi\Model\TextMessage([
                'type' => 'text',
                'text' => $text
            ]);

            $chunks = array_chunk($targetIds, 500);

            foreach ($chunks as $chunk) {
                $multicastRequest = new \LINE\Clients\MessagingApi\Model\MulticastRequest([
                    'to' => $chunk,
                    'messages' => [$message]
                ]);
                $httpClient->multicast($multicastRequest);
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendToTelegram($channel, string $title, string $content, string $chatId): array
    {
        try {
            $botToken = $channel->getConfigValue('botToken');
            $parseMode = $channel->getConfigValue('parseMode', 'HTML');

            $text = "📢 <b>{$title}</b>\n\n{$content}";
            if ($parseMode === 'Markdown') {
                $text = "📢 *{$title}*\n\n{$content}";
            }

            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $client = \Config\Services::curlrequest();
            $response = $client->post($url, [
                'form_params' => [
                    'chat_id' => $chatId,
                    'text' => $text,
                    'parse_mode' => $parseMode,
                ],
            ]);

            $result = json_decode($response->getBody(), true);

            if ($result['ok']) {
                return ['success' => true];
            } else {
                return ['success' => false, 'error' => $result['description'] ?? '未知錯誤'];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function log(string $message, string $level = 'info'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logLine = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;

        file_put_contents($this->logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}
