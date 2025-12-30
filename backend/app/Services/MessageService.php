<?php

namespace App\Services;

use App\Entities\ChannelEntity;
use App\Entities\MessageEntity;
use App\Repositories\ChannelRepository;
use App\Repositories\MessageRepository;

/**
 * MessageService - 通知訊息服務
 */
class MessageService
{
    private MessageRepository $messageRepository;
    private ChannelRepository $channelRepository;
    private \App\Repositories\ChannelUserRepository $channelUserRepository;

    public function __construct()
    {
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelUserRepository = new \App\Repositories\ChannelUserRepository();
    }

    /**
     * 取得訊息列表
     */
    public function getMessages(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $result = $this->messageRepository->findPaginated($filters, $page, $limit);

        $messages = array_map(function (MessageEntity $msg) {
            $msgArray = $msg->toArray();
            $msgArray['results'] = $this->formatResults($this->messageRepository->getResults($msg->id));
            return $msgArray;
        }, $result['messages']);

        return [
            'messages' => $messages,
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ];
    }

    /**
     * 發送訊息
     */
    public function sendMessage(array $data, int $userId): array
    {
        // 驗證必要欄位
        if (empty($data['title']) || empty($data['content']) || empty($data['channelIds'])) {
            return [
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => '缺少必要欄位 (title, content, channelIds)',
            ];
        }

        // 驗證使用者擁有這些渠道
        $validChannels = $this->channelRepository->findByIdsAndUserId($data['channelIds'], $userId);
        $validChannelIds = array_map(fn($c) => $c->id, $validChannels);

        // 判斷是否為排程發送
        $isScheduled = false;
        $scheduledAt = $data['scheduledAt'] ?? null;
        
        if ($scheduledAt) {
            $scheduledTime = strtotime($scheduledAt);
            $now = time();
            // 若排程時間在未來（允許 1 分鐘的誤差），則標記為排程
            if ($scheduledTime && $scheduledTime > ($now + 60)) {
                $isScheduled = true;
            }
        }

        // 建立訊息記錄
        $message = $this->messageRepository->create([
            'title' => $data['title'],
            'content' => $data['content'],
            'channelIds' => $validChannelIds,
            'scheduledAt' => $scheduledAt,
            'channelOptions' => $data['channelOptions'] ?? [],
            'userId' => $userId,
            'status' => $isScheduled ? MessageEntity::STATUS_SCHEDULED : MessageEntity::STATUS_SENDING,
        ]);

        // 如果是排程發送，立即返回，不執行實際發送
        if ($isScheduled) {
            return [
                'success' => true,
                'messageId' => $message->id,
                'status' => MessageEntity::STATUS_SCHEDULED,
                'scheduledAt' => $scheduledAt,
                'message' => '訊息已排程，將於指定時間發送',
            ];
        }

        // 發送到各渠道
        $results = [];
        $channelOptions = $data['channelOptions'] ?? [];

        foreach ($data['channelIds'] as $channelId) {
            $channel = $this->channelRepository->find($channelId, $userId);

            if (!$channel || !$channel->enabled) {
                $this->messageRepository->addResult($message->id, $channelId, false, '渠道不存在或已停用');
                $results[] = [
                    'channelId' => $channelId,
                    'channelName' => $channel ? $channel->name : 'Unknown',
                    'success' => false,
                    'error' => '渠道不存在或已停用',
                ];
                continue;
            }

            // 決定發送對象
            $targetUsers = [];
            $options = $channelOptions[$channelId] ?? ['type' => 'all'];

            if ($options['type'] === 'selected' && !empty($options['users'])) {
                $targetUsers = $options['users']; // Expecting provider IDs
            } else {
                // Send to all active users
                $users = $this->channelUserRepository->findByChannelId($channelId);
                $targetUsers = array_map(fn($u) => $u->providerId, array_filter($users, fn($u) => $u->status === 'active'));
            }

            // Backward compatibility: If no users helper found, try old config targetId
            if (empty($targetUsers) && $channel->getConfigValue('targetId')) {
                $targetUsers = [$channel->getConfigValue('targetId')];
            }

            if (empty($targetUsers)) {
                $this->messageRepository->addResult($message->id, $channelId, false, '無發送對象');
                $results[] = [
                    'channelId' => $channelId,
                    'channelName' => $channel->name,
                    'success' => false,
                    'error' => '無發送對象',
                ];
                continue;
            }

            $sendResult = $this->sendToChannel($channel, $data['title'], $data['content'], $targetUsers);

            $this->messageRepository->addResult(
                $message->id,
                $channelId,
                $sendResult['success'],
                $sendResult['error'] ?? null
            );

            $results[] = [
                'channelId' => $channelId,
                'channelName' => $channel->name,
                'success' => $sendResult['success'],
                'sentAt' => date('Y-m-d H:i:s'),
                'error' => $sendResult['error'] ?? null,
            ];
        }

        // 判斷最終狀態
        $message->results = $results;
        $finalStatus = $message->determineStatus();
        $this->messageRepository->updateStatus($message->id, $finalStatus, date('Y-m-d H:i:s'));

        return [
            'success' => true,
            'messageId' => $message->id,
            'status' => $finalStatus,
            'results' => $results,
        ];
    }

    /**
     * 刪除訊息
     */
    public function deleteMessage(string $id): array
    {
        $message = $this->messageRepository->find($id);

        if (!$message) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '訊息不存在',
            ];
        }

        $this->messageRepository->delete($id);

        return [
            'success' => true,
            'message' => '訊息已刪除',
        ];
    }

    /**
     * 發送到渠道
     */
    private function sendToChannel(ChannelEntity $channel, string $title, string $content, array $targetUsers): array
    {
        try {
            if ($channel->isLine()) {
                return $this->sendToLine($channel, $title, $content, $targetUsers);
            } elseif ($channel->isTelegram()) {
                // Telegram might need broadcast implementation or individual sends
                $successCount = 0;
                $errors = [];
                foreach ($targetUsers as $chatId) {
                    $res = $this->sendToTelegram($channel, $title, $content, $chatId);
                    if ($res['success']) $successCount++;
                    else $errors[] = $res['error'] ?? 'Unknown error';
                }

                if ($successCount > 0) return ['success' => true];
                return ['success' => false, 'error' => implode(', ', $errors)];
            }
            return ['success' => false, 'error' => '不支援的渠道類型'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 發送到 LINE
     */
    private function sendToLine(ChannelEntity $channel, string $title, string $content, array $targetIds): array
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

            // Multicast handles up to 500 users. If more, need to chunk.
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

    /**
     * 發送到 Telegram (Single)
     */
    private function sendToTelegram(ChannelEntity $channel, string $title, string $content, string $chatId): array
    {
        try {
            $botToken = $channel->getConfigValue('botToken');
            // $chatId passed as argument now
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

    /**
     * 格式化結果
     */
    private function formatResults(array $results): array
    {
        return array_map(function ($r) {
            return [
                'channelId' => $r['channel_id'],
                'channelName' => $r['channel_name'],
                'channelType' => $r['channel_type'],
                'success' => (bool) $r['success'],
                'sentAt' => $r['sent_at'],
                'error' => $r['error'],
            ];
        }, $results);
    }

    /**
     * 取得最近訊息
     */
    public function getRecentMessages(int $limit = 5): array
    {
        $messages = $this->messageRepository->getRecent($limit);
        return array_map(function (MessageEntity $msg) {
            return [
                'id' => $msg->id,
                'title' => $msg->title,
                'status' => $msg->status,
                'createdAt' => $msg->createdAt,
            ];
        }, $messages);
    }
}
