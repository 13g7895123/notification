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
    /**
     * POST /api/webhook/line?key=xxx
     */
    public function line()
    {
        $key = $this->request->getGet('key');

        $requestTime = date('Y-m-d H:i:s');
        $headers = [];
        foreach ($this->request->getHeaders() as $name => $header) {
            $headers[$name] = $header->getValueLine();
        }
        $rawBody = $this->request->getBody();
        $ip = $this->request->getIPAddress();

        // Prepare to log
        $webhookLogRepo = new \App\Repositories\WebhookLogRepository();

        if (!$key) {
            $webhookLogRepo->log(null, 'POST', 'line', $headers, $rawBody, 400, json_encode(['error' => 'Missing key']), $ip);
            return $this->fail('Missing key', 400);
        }

        $channel = $this->channelRepository->findByWebhookKey($key);
        if (!$channel) {
            $webhookLogRepo->log(null, 'POST', 'line', $headers, $rawBody, 404, json_encode(['error' => 'Channel not found']), $ip);
            return $this->failNotFound('Channel not found');
        }

        if (!$channel->enabled) {
            $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 403, json_encode(['error' => 'Channel disabled']), $ip);
            return $this->failForbidden('Channel disabled');
        }

        // 驗證 LINE 簽章 (TBD: 需要 Secret)
        // $signature = $this->request->getHeaderLine('x-line-signature');

        $events = json_decode($rawBody, true);

        if (!isset($events['events']) || !is_array($events['events'])) {
            $response = ['status' => 'ok'];
            $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 200, json_encode($response), $ip);
            return $this->respond($response);
        }

        $channelUserRepo = new \App\Repositories\ChannelUserRepository();
        $accessToken = $channel->getConfigValue('channelAccessToken');

        foreach ($events['events'] as $event) {
            // 只處理來自使用者的事件
            if (!isset($event['source']['userId'])) {
                continue;
            }

            $userId = $event['source']['userId'];
            $displayName = null;
            $pictureUrl = null;

            // 嘗試取得使用者資料
            if ($accessToken) {
                try {
                    $httpClient = new \GuzzleHttp\Client();
                    $response = $httpClient->get("https://api.line.me/v2/bot/profile/{$userId}", [
                        'headers' => [
                            'Authorization' => "Bearer {$accessToken}"
                        ]
                    ]);
                    $profile = json_decode($response->getBody(), true);
                    $displayName = $profile['displayName'] ?? null;
                    $pictureUrl = $profile['pictureUrl'] ?? null;
                } catch (\Exception $e) {
                    // Log error but continue
                    log_message('error', 'Failed to fetch LINE profile: ' . $e->getMessage());
                }
            }

            // 更新或建立使用者
            $channelUserRepo->saveUser($channel->id, $userId, $displayName, $pictureUrl);
        }

        $response = ['status' => 'ok'];
        $webhookLogRepo->log($channel->id, 'POST', 'line', $headers, $rawBody, 200, json_encode($response), $ip);

        return $this->respond($response);
    }
}
