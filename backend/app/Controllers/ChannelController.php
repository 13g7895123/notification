<?php

namespace App\Controllers;

/**
 * ChannelController - 通知渠道 API
 */
class ChannelController extends BaseController
{
    /**
     * GET /api/channels
     * 取得通知渠道列表
     */
    public function index()
    {
        $channels = $this->db->table('channels')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        $formattedChannels = array_map(function ($channel) {
            return [
                'id' => $channel['id'],
                'type' => $channel['type'],
                'name' => $channel['name'],
                'enabled' => (bool) $channel['enabled'],
                'config' => json_decode($channel['config'], true),
                'createdAt' => $channel['created_at'],
                'updatedAt' => $channel['updated_at'],
            ];
        }, $channels);

        return $this->successResponse($formattedChannels);
    }

    /**
     * POST /api/channels
     * 建立新渠道
     */
    public function create()
    {
        $json = $this->request->getJSON(true);

        // 驗證必要欄位
        if (empty($json['type']) || empty($json['name']) || empty($json['config'])) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少必要欄位', 400);
        }

        // 驗證渠道類型
        if (!in_array($json['type'], ['line', 'telegram'])) {
            return $this->errorResponse('VALIDATION_ERROR', '不支援的渠道類型', 400);
        }

        $channelId = $this->generateUuid();
        $now = date('Y-m-d H:i:s');

        $channelData = [
            'id' => $channelId,
            'type' => $json['type'],
            'name' => $json['name'],
            'enabled' => $json['enabled'] ?? true,
            'config' => json_encode($json['config']),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table('channels')->insert($channelData);

        return $this->successResponse([
            'id' => $channelId,
            'type' => $channelData['type'],
            'name' => $channelData['name'],
            'enabled' => (bool) $channelData['enabled'],
            'config' => $json['config'],
            'createdAt' => $now,
        ], null, 201);
    }

    /**
     * PUT /api/channels/:id
     * 更新渠道
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $channel = $this->db->table('channels')->where('id', $id)->get()->getRow();

        if (!$channel) {
            return $this->errorResponse('NOT_FOUND', '渠道不存在', 404);
        }

        $json = $this->request->getJSON(true);

        $updateData = [];

        if (isset($json['name'])) {
            $updateData['name'] = $json['name'];
        }
        if (isset($json['enabled'])) {
            $updateData['enabled'] = $json['enabled'] ? 1 : 0;
        }
        if (isset($json['config'])) {
            $updateData['config'] = json_encode($json['config']);
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('channels')->where('id', $id)->update($updateData);
        }

        $updatedChannel = $this->db->table('channels')
            ->where('id', $id)
            ->get()
            ->getRowArray();

        return $this->successResponse([
            'id' => $updatedChannel['id'],
            'type' => $updatedChannel['type'],
            'name' => $updatedChannel['name'],
            'enabled' => (bool) $updatedChannel['enabled'],
            'config' => json_decode($updatedChannel['config'], true),
            'updatedAt' => $updatedChannel['updated_at'],
        ]);
    }

    /**
     * DELETE /api/channels/:id
     * 刪除渠道
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $channel = $this->db->table('channels')->where('id', $id)->get()->getRow();

        if (!$channel) {
            return $this->errorResponse('NOT_FOUND', '渠道不存在', 404);
        }

        $this->db->table('channels')->where('id', $id)->delete();

        return $this->successResponse(null, '渠道已刪除');
    }

    /**
     * PUT /api/channels/:id/toggle
     * 切換渠道啟用狀態
     */
    public function toggle($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $channel = $this->db->table('channels')->where('id', $id)->get()->getRowArray();

        if (!$channel) {
            return $this->errorResponse('NOT_FOUND', '渠道不存在', 404);
        }

        $newEnabled = !$channel['enabled'];

        $this->db->table('channels')
            ->where('id', $id)
            ->update([
                'enabled' => $newEnabled ? 1 : 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse([
            'id' => $id,
            'enabled' => $newEnabled,
        ]);
    }

    /**
     * POST /api/channels/:id/test
     * 測試渠道連線
     */
    public function test($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $channel = $this->db->table('channels')->where('id', $id)->get()->getRowArray();

        if (!$channel) {
            return $this->errorResponse('NOT_FOUND', '渠道不存在', 404);
        }

        $config = json_decode($channel['config'], true);
        $type = $channel['type'];

        try {
            if ($type === 'line') {
                $result = $this->testLineChannel($config);
            } elseif ($type === 'telegram') {
                $result = $this->testTelegramChannel($config);
            } else {
                return $this->errorResponse('CHANNEL_TEST_FAILED', '不支援的渠道類型', 400);
            }

            if ($result['success']) {
                return $this->successResponse(null, '測試訊息發送成功');
            } else {
                return $this->errorResponse('CHANNEL_TEST_FAILED', $result['error'], 400);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('CHANNEL_TEST_FAILED', '無法連接到渠道: ' . $e->getMessage(), 400);
        }
    }

    /**
     * 測試 LINE 渠道
     */
    private function testLineChannel(array $config): array
    {
        try {
            $httpClient = new \LINE\Clients\MessagingApi\Api\MessagingApiApi(
                new \GuzzleHttp\Client(),
                \LINE\Clients\MessagingApi\Configuration::getDefaultConfiguration()
                    ->setAccessToken($config['channelAccessToken'])
            );

            $message = new \LINE\Clients\MessagingApi\Model\TextMessage([
                'type' => 'text',
                'text' => '🔔 NotifyHub 測試訊息 - 連線成功！'
            ]);

            $pushMessage = new \LINE\Clients\MessagingApi\Model\PushMessageRequest([
                'to' => $config['targetId'],
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
    private function testTelegramChannel(array $config): array
    {
        try {
            $botToken = $config['botToken'];
            $chatId = $config['chatId'];
            $parseMode = $config['parseMode'] ?? 'HTML';

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
}
