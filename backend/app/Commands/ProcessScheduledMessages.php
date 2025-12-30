<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Services\MessageService;
use App\Repositories\MessageRepository;
use App\Repositories\ChannelRepository;
use App\Repositories\ChannelUserRepository;
use App\Entities\MessageEntity;

/**
 * 處理已到期的排程訊息
 * 
 * 使用方式: php spark schedule:process
 * 建議每分鐘執行一次 (cron job)
 */
class ProcessScheduledMessages extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'schedule:process';
    protected $description = '處理已到期的排程訊息';
    protected $usage       = 'schedule:process';

    private MessageRepository $messageRepository;
    private ChannelRepository $channelRepository;
    private ChannelUserRepository $channelUserRepository;

    public function run(array $params)
    {
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelUserRepository = new ChannelUserRepository();

        CLI::write('開始處理排程訊息...', 'yellow');

        // 取得所有已到期的排程訊息
        $scheduledMessages = $this->messageRepository->getScheduledMessagesReady();

        if (empty($scheduledMessages)) {
            CLI::write('沒有需要處理的排程訊息', 'green');
            return;
        }

        CLI::write('找到 ' . count($scheduledMessages) . ' 筆待處理的排程訊息', 'cyan');

        foreach ($scheduledMessages as $message) {
            $this->processMessage($message);
        }

        CLI::write('排程訊息處理完成', 'green');
    }

    private function processMessage(MessageEntity $message): void
    {
        CLI::write("處理訊息 ID: {$message->id} - {$message->title}", 'light_gray');

        // 更新狀態為發送中
        $this->messageRepository->updateStatus($message->id, MessageEntity::STATUS_SENDING);

        // 取得 channel options
        $channelOptions = $this->messageRepository->getChannelOptions($message->id);

        $results = [];

        foreach ($message->channelIds as $channelId) {
            $channel = $this->channelRepository->find($channelId, $message->userId);

            if (!$channel || !$channel->enabled) {
                $this->messageRepository->addResult($message->id, $channelId, false, '渠道不存在或已停用');
                $results[] = ['success' => false];
                CLI::write("  - 渠道 {$channelId}: 失敗 (渠道不存在或已停用)", 'red');
                continue;
            }

            // 決定發送對象
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

            // 向後兼容
            if (empty($targetUsers) && $channel->getConfigValue('targetId')) {
                $targetUsers = [$channel->getConfigValue('targetId')];
            }

            if (empty($targetUsers)) {
                $this->messageRepository->addResult($message->id, $channelId, false, '無發送對象');
                $results[] = ['success' => false];
                CLI::write("  - 渠道 {$channel->name}: 失敗 (無發送對象)", 'red');
                continue;
            }

            // 執行發送
            $sendResult = $this->sendToChannel($channel, $message->title, $message->content, $targetUsers);

            $this->messageRepository->addResult(
                $message->id,
                $channelId,
                $sendResult['success'],
                $sendResult['error'] ?? null
            );

            $results[] = $sendResult;

            if ($sendResult['success']) {
                CLI::write("  - 渠道 {$channel->name}: 成功", 'green');
            } else {
                CLI::write("  - 渠道 {$channel->name}: 失敗 ({$sendResult['error']})", 'red');
            }
        }

        // 判斷最終狀態
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
}
