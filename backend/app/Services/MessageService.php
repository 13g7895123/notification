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

    public function __construct()
    {
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
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

        // 建立訊息記錄
        $message = $this->messageRepository->create([
            'title' => $data['title'],
            'content' => $data['content'],
            'channelIds' => $validChannelIds,
            'scheduledAt' => $data['scheduledAt'] ?? null,
            'userId' => $userId,
            'status' => MessageEntity::STATUS_SENDING,
        ]);

        // 發送到各渠道
        $results = [];
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

            $sendResult = $this->sendToChannel($channel, $data['title'], $data['content']);

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
    private function sendToChannel(ChannelEntity $channel, string $title, string $content): array
    {
        try {
            if ($channel->isLine()) {
                return $this->sendToLine($channel, $title, $content);
            } elseif ($channel->isTelegram()) {
                return $this->sendToTelegram($channel, $title, $content);
            }
            return ['success' => false, 'error' => '不支援的渠道類型'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 發送到 LINE
     */
    private function sendToLine(ChannelEntity $channel, string $title, string $content): array
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

            $pushMessage = new \LINE\Clients\MessagingApi\Model\PushMessageRequest([
                'to' => $channel->getConfigValue('targetId'),
                'messages' => [$message]
            ]);

            $httpClient->pushMessage($pushMessage);

            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 發送到 Telegram
     */
    private function sendToTelegram(ChannelEntity $channel, string $title, string $content): array
    {
        try {
            $botToken = $channel->getConfigValue('botToken');
            $chatId = $channel->getConfigValue('chatId');
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
