<?php

namespace App\Controllers;

/**
 * MessageController - 通知訊息 API
 */
class MessageController extends BaseController
{
    /**
     * GET /api/messages
     * 取得訊息列表
     */
    public function index()
    {
        $search = $this->request->getGet('search');
        $status = $this->request->getGet('status');
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);
        $offset = ($page - 1) * $limit;

        $builder = $this->db->table('messages m');

        // 搜尋
        if ($search) {
            $builder->groupStart()
                ->like('m.title', $search)
                ->orLike('m.content', $search)
                ->groupEnd();
        }

        // 篩選狀態
        if ($status) {
            $builder->where('m.status', $status);
        }

        // 總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $messages = $builder
            ->select('m.*')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        // 格式化並取得結果
        $formattedMessages = [];
        foreach ($messages as $message) {
            $results = $this->db->table('message_results mr')
                ->select('mr.*, c.name as channel_name, c.type as channel_type')
                ->join('channels c', 'c.id = mr.channel_id', 'left')
                ->where('mr.message_id', $message['id'])
                ->get()
                ->getResultArray();

            $formattedResults = array_map(function ($r) {
                return [
                    'channelId' => $r['channel_id'],
                    'channelName' => $r['channel_name'],
                    'channelType' => $r['channel_type'],
                    'success' => (bool) $r['success'],
                    'sentAt' => $r['sent_at'],
                    'error' => $r['error'],
                ];
            }, $results);

            $formattedMessages[] = [
                'id' => $message['id'],
                'title' => $message['title'],
                'content' => $message['content'],
                'status' => $message['status'],
                'channelIds' => json_decode($message['channel_ids'], true),
                'scheduledAt' => $message['scheduled_at'],
                'sentAt' => $message['sent_at'],
                'createdAt' => $message['created_at'],
                'results' => $formattedResults,
            ];
        }

        return $this->successResponse([
            'messages' => $formattedMessages,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    /**
     * POST /api/messages/send
     * 發送通知訊息
     */
    public function send()
    {
        $json = $this->request->getJSON(true);

        // 驗證必要欄位
        if (empty($json['title']) || empty($json['content']) || empty($json['channelIds'])) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少必要欄位 (title, content, channelIds)', 400);
        }

        $user = $this->getCurrentUser();
        $messageId = $this->generateUuid();
        $now = date('Y-m-d H:i:s');

        // 建立訊息記錄
        $messageData = [
            'id' => $messageId,
            'title' => $json['title'],
            'content' => $json['content'],
            'status' => 'sending',
            'channel_ids' => json_encode($json['channelIds']),
            'scheduled_at' => $json['scheduledAt'] ?? null,
            'created_at' => $now,
            'user_id' => $user ? $user['id'] : '550e8400-e29b-41d4-a716-446655440001',
        ];

        $this->db->table('messages')->insert($messageData);

        // 發送到各渠道
        $results = [];
        $allSuccess = true;
        $hasSuccess = false;

        foreach ($json['channelIds'] as $channelId) {
            $channel = $this->db->table('channels')
                ->where('id', $channelId)
                ->where('enabled', 1)
                ->get()
                ->getRowArray();

            if (!$channel) {
                $results[] = [
                    'channelId' => $channelId,
                    'channelName' => 'Unknown',
                    'success' => false,
                    'error' => '渠道不存在或已停用',
                ];
                $allSuccess = false;
                continue;
            }

            $config = json_decode($channel['config'], true);
            $sendResult = $this->sendToChannel($channel['type'], $config, $json['title'], $json['content']);

            // 記錄結果
            $resultId = $this->generateUuid();
            $this->db->table('message_results')->insert([
                'id' => $resultId,
                'message_id' => $messageId,
                'channel_id' => $channelId,
                'success' => $sendResult['success'] ? 1 : 0,
                'error' => $sendResult['error'] ?? null,
                'sent_at' => $now,
            ]);

            $results[] = [
                'channelId' => $channelId,
                'channelName' => $channel['name'],
                'success' => $sendResult['success'],
                'sentAt' => $now,
                'error' => $sendResult['error'] ?? null,
            ];

            if ($sendResult['success']) {
                $hasSuccess = true;
            } else {
                $allSuccess = false;
            }
        }

        // 更新訊息狀態
        $finalStatus = 'failed';
        if ($allSuccess) {
            $finalStatus = 'sent';
        } elseif ($hasSuccess) {
            $finalStatus = 'partial';
        }

        $this->db->table('messages')
            ->where('id', $messageId)
            ->update([
                'status' => $finalStatus,
                'sent_at' => $now,
            ]);

        return $this->successResponse([
            'messageId' => $messageId,
            'status' => $finalStatus,
            'results' => $results,
        ]);
    }

    /**
     * DELETE /api/messages/:id
     * 刪除訊息
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少訊息 ID', 400);
        }

        $message = $this->db->table('messages')->where('id', $id)->get()->getRow();

        if (!$message) {
            return $this->errorResponse('NOT_FOUND', '訊息不存在', 404);
        }

        // 刪除相關結果
        $this->db->table('message_results')->where('message_id', $id)->delete();
        // 刪除訊息
        $this->db->table('messages')->where('id', $id)->delete();

        return $this->successResponse(null, '訊息已刪除');
    }

    /**
     * 發送到渠道
     */
    private function sendToChannel(string $type, array $config, string $title, string $content): array
    {
        try {
            if ($type === 'line') {
                return $this->sendToLine($config, $title, $content);
            } elseif ($type === 'telegram') {
                return $this->sendToTelegram($config, $title, $content);
            }
            return ['success' => false, 'error' => '不支援的渠道類型'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 發送到 LINE
     */
    private function sendToLine(array $config, string $title, string $content): array
    {
        try {
            $httpClient = new \LINE\Clients\MessagingApi\Api\MessagingApiApi(
                new \GuzzleHttp\Client(),
                \LINE\Clients\MessagingApi\Configuration::getDefaultConfiguration()
                    ->setAccessToken($config['channelAccessToken'])
            );

            $text = "📢 {$title}\n\n{$content}";

            $message = new \LINE\Clients\MessagingApi\Model\TextMessage([
                'type' => 'text',
                'text' => $text
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
     * 發送到 Telegram
     */
    private function sendToTelegram(array $config, string $title, string $content): array
    {
        try {
            $botToken = $config['botToken'];
            $chatId = $config['chatId'];
            $parseMode = $config['parseMode'] ?? 'HTML';

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
