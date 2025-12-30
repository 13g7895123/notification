<?php

namespace App\Controllers;

use App\Repositories\ChannelRepository;
use CodeIgniter\API\ResponseTrait;

class WebhookController extends BaseController
{
    use ResponseTrait;

    private ChannelRepository $channelRepository;

    public function __construct()
    {
        $this->channelRepository = new ChannelRepository();
    }

    /**
     * POST /api/webhook/line?key=xxx
     */
    public function line()
    {
        // ========== 開始記錄 ==========
        log_message('info', '========================================');
        log_message('info', '[LINE Webhook] 收到請求');
        log_message('info', '[LINE Webhook] 時間: ' . date('Y-m-d H:i:s'));

        $key = $this->request->getGet('key');
        $ip = $this->request->getIPAddress();
        $method = $this->request->getMethod();

        log_message('info', "[LINE Webhook] 方法: {$method}");
        log_message('info', "[LINE Webhook] 來源 IP: {$ip}");
        log_message('info', "[LINE Webhook] Key 參數: " . ($key ? substr($key, 0, 8) . '...' : '(無)'));

        // 取得請求資訊
        $headers = [];
        foreach ($this->request->getHeaders() as $name => $header) {
            $headers[$name] = $header->getValueLine();
        }
        $rawBody = $this->request->getBody();

        log_message('debug', "[LINE Webhook] Headers: " . json_encode($headers));
        log_message('debug', "[LINE Webhook] Body 長度: " . strlen($rawBody) . " bytes");
        log_message('debug', "[LINE Webhook] Body 內容: " . (strlen($rawBody) > 500 ? substr($rawBody, 0, 500) . '...' : $rawBody));

        // 準備記錄到資料庫
        $webhookLogRepo = new \App\Repositories\WebhookLogRepository();

        // ========== 驗證 Key ==========
        if (!$key) {
            log_message('warning', '[LINE Webhook] 失敗: 缺少 key 參數');
            $webhookLogRepo->log(null, 'POST', 'line', $headers, $rawBody, 400, json_encode(['error' => 'Missing key']), $ip);
            return $this->fail('Missing key', 400);
        }

        // ========== 查詢渠道 ==========
        log_message('info', "[LINE Webhook] 正在查詢渠道 (key: {$key})...");
        $channel = $this->channelRepository->findByWebhookKey($key);

        if (!$channel) {
            log_message('warning', "[LINE Webhook] 失敗: 找不到對應的渠道 (key: {$key})");
            $webhookLogRepo->log(null, 'POST', 'line', $headers, $rawBody, 404, json_encode(['error' => 'Channel not found']), $ip);
            return $this->failNotFound('Channel not found');
        }

        log_message('info', "[LINE Webhook] 找到渠道: ID={$channel->id}, 名稱={$channel->name}");

        // ========== 檢查渠道狀態 ==========
        if (!$channel->enabled) {
            log_message('warning', "[LINE Webhook] 失敗: 渠道已停用 (ID: {$channel->id})");
            $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 403, json_encode(['error' => 'Channel disabled']), $ip);
            return $this->failForbidden('Channel disabled');
        }

        log_message('info', "[LINE Webhook] 渠道狀態: 已啟用");

        // ========== 解析事件 ==========
        $events = json_decode($rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            log_message('error', "[LINE Webhook] JSON 解析錯誤: " . json_last_error_msg());
        }

        if (!isset($events['events']) || !is_array($events['events'])) {
            log_message('info', "[LINE Webhook] 無事件需處理 (可能是 LINE 的驗證請求)");
            $response = ['status' => 'ok'];
            $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 200, json_encode($response), $ip);
            return $this->respond($response);
        }

        $eventCount = count($events['events']);
        log_message('info', "[LINE Webhook] 收到 {$eventCount} 個事件");

        // ========== 處理事件 ==========
        $channelUserRepo = new \App\Repositories\ChannelUserRepository();
        $accessToken = $channel->getConfigValue('channelAccessToken');
        $processedUsers = 0;

        foreach ($events['events'] as $index => $event) {
            $eventType = $event['type'] ?? 'unknown';
            log_message('debug', "[LINE Webhook] 事件 #{$index}: 類型={$eventType}");

            // 只處理來自使用者的事件
            if (!isset($event['source']['userId'])) {
                log_message('debug', "[LINE Webhook] 事件 #{$index}: 跳過 (無 userId)");
                continue;
            }

            $userId = $event['source']['userId'];
            log_message('info', "[LINE Webhook] 事件 #{$index}: 處理使用者 {$userId}");

            $displayName = null;
            $pictureUrl = null;

            // 嘗試取得使用者資料
            if ($accessToken) {
                try {
                    log_message('debug', "[LINE Webhook] 正在取得使用者 {$userId} 的 Profile...");
                    $httpClient = new \GuzzleHttp\Client();
                    $response = $httpClient->get("https://api.line.me/v2/bot/profile/{$userId}", [
                        'headers' => [
                            'Authorization' => "Bearer {$accessToken}"
                        ],
                        'timeout' => 10
                    ]);
                    $profile = json_decode($response->getBody(), true);
                    $displayName = $profile['displayName'] ?? null;
                    $pictureUrl = $profile['pictureUrl'] ?? null;
                    log_message('info', "[LINE Webhook] 使用者 {$userId} Profile: {$displayName}");
                } catch (\Exception $e) {
                    log_message('error', "[LINE Webhook] 無法取得使用者 Profile: " . $e->getMessage());
                }
            } else {
                log_message('warning', "[LINE Webhook] 無法取得 Profile (缺少 accessToken)");
            }

            // 更新或建立使用者
            try {
                $channelUserRepo->saveUser($channel->id, $userId, $displayName, $pictureUrl);
                $processedUsers++;
                log_message('info', "[LINE Webhook] 使用者 {$userId} 已儲存/更新");
            } catch (\Exception $e) {
                log_message('error', "[LINE Webhook] 儲存使用者失敗: " . $e->getMessage());
            }
        }

        // ========== 完成 ==========
        log_message('info', "[LINE Webhook] 處理完成: {$processedUsers} 個使用者已處理");
        log_message('info', '========================================');

        $response = ['status' => 'ok'];
        $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 200, json_encode($response), $ip);

        return $this->respond($response);
    }
}
