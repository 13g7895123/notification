<?php

namespace App\Services;

use App\Entities\ChannelEntity;
use App\Repositories\ChannelRepository;

/**
 * ChannelService - 通知渠道服務
 */
class ChannelService
{
    private ChannelRepository $channelRepository;

    public function __construct()
    {
        $this->channelRepository = new ChannelRepository();
    }

    /**
     * 取得使用者的所有渠道
     */
    public function getChannelsByUserId(int $userId): array
    {
        $channels = $this->channelRepository->findByUserId($userId);
        return array_map(fn(ChannelEntity $c) => $c->toArray(), $channels);
    }

    /**
     * 取得所有渠道（全域，供管理員使用）
     */
    public function getChannels(): array
    {
        $channels = $this->channelRepository->findAll();
        return array_map(fn(ChannelEntity $c) => $c->toArray(), $channels);
    }

    /**
     * 取得單一渠道
     */
    public function getChannel(int $id, ?int $userId = null): ?ChannelEntity
    {
        return $this->channelRepository->find($id, $userId);
    }

    /**
     * 建立渠道
     */
    public function createChannel(array $data, int $userId): array
    {
        // 驗證必要欄位
        if (empty($data['type']) || empty($data['name']) || empty($data['config'])) {
            return [
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => '缺少必要欄位',
            ];
        }

        // 驗證渠道類型
        if (!in_array($data['type'], ['line', 'telegram'])) {
            return [
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => '不支援的渠道類型',
            ];
        }

        $data['userId'] = $userId;
        $channel = $this->channelRepository->create($data);

        return [
            'success' => true,
            'channel' => $channel->toArray(),
        ];
    }

    /**
     * 更新渠道
     */
    public function updateChannel(int $id, array $data, int $userId): array
    {
        $channel = $this->channelRepository->find($id, $userId);

        if (!$channel) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '渠道不存在',
            ];
        }

        $updatedChannel = $this->channelRepository->update($id, $data, $userId);

        return [
            'success' => true,
            'channel' => $updatedChannel->toArray(),
        ];
    }

    /**
     * 刪除渠道
     */
    public function deleteChannel(int $id, int $userId): array
    {
        $channel = $this->channelRepository->find($id, $userId);

        if (!$channel) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '渠道不存在',
            ];
        }

        $this->channelRepository->deleteByUserId($id, $userId);

        return [
            'success' => true,
            'message' => '渠道已刪除',
        ];
    }

    /**
     * 切換渠道啟用狀態
     */
    public function toggleChannel(int $id, int $userId): array
    {
        $channel = $this->channelRepository->toggle($id, $userId);

        if (!$channel) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '渠道不存在',
            ];
        }

        return [
            'success' => true,
            'data' => ['id' => $id, 'enabled' => $channel->enabled],
        ];
    }

    /**
     * 測試渠道
     */
    public function testChannel(int $id, int $userId): array
    {
        $channel = $this->channelRepository->find($id, $userId);

        if (!$channel) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '渠道不存在',
            ];
        }

        try {
            if ($channel->isLine()) {
                $result = $this->testLineChannel($channel);
            } elseif ($channel->isTelegram()) {
                $result = $this->testTelegramChannel($channel);
            } else {
                return [
                    'success' => false,
                    'error' => 'CHANNEL_TEST_FAILED',
                    'message' => '不支援的渠道類型',
                ];
            }

            if ($result['success']) {
                return ['success' => true, 'message' => '測試訊息發送成功'];
            } else {
                return [
                    'success' => false,
                    'error' => 'CHANNEL_TEST_FAILED',
                    'message' => $result['error'],
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'CHANNEL_TEST_FAILED',
                'message' => '無法連接到渠道: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * 測試 LINE 渠道
     */
    private function testLineChannel(ChannelEntity $channel): array
    {
        try {
            $httpClient = new \LINE\Clients\MessagingApi\Api\MessagingApiApi(
                new \GuzzleHttp\Client(),
                \LINE\Clients\MessagingApi\Configuration::getDefaultConfiguration()
                    ->setAccessToken($channel->getConfigValue('channelAccessToken'))
            );

            $message = new \LINE\Clients\MessagingApi\Model\TextMessage([
                'type' => 'text',
                'text' => '🔔 NotifyHub 測試訊息 - 連線成功！'
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
     * 測試 Telegram 渠道
     */
    private function testTelegramChannel(ChannelEntity $channel): array
    {
        try {
            $botToken = $channel->getConfigValue('botToken');
            $chatId = $channel->getConfigValue('chatId');
            $parseMode = $channel->getConfigValue('parseMode', 'HTML');

            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $client = \Config\Services::curlrequest();
            $response = $client->post($url, [
                'form_params' => [
                    'chat_id' => $chatId,
                    'text' => '🔔 NotifyHub 測試訊息 - 連線成功！',
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
     * 取得使用者的渠道統計
     */
    public function getStatsByUserId(int $userId): array
    {
        return $this->channelRepository->getStatsByUserId($userId);
    }

    /**
     * 取得渠道統計（全域）
     */
    public function getStats(): array
    {
        return $this->channelRepository->getStats();
    }
}
