<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * ApiLogFilter - 記錄 API 使用日誌
 */
class ApiLogFilter implements FilterInterface
{
    /**
     * @var \CodeIgniter\Database\BaseConnection
     */
    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function before(RequestInterface $request, $arguments = null)
    {
        // 記錄開始時間
        $request->startTime = microtime(true);
        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 只記錄從 WindowsNotificationController 標記過需要記錄的請求
        if (!isset($request->apiKeyId)) {
            return;
        }

        $statusCode = $response->getStatusCode();
        $apiKeyId = $request->apiKeyId;

        $duration = 0;
        if (isset($request->startTime)) {
            $duration = (int) ((microtime(true) - $request->startTime) * 1000); // ms
        }

        $success = ($statusCode >= 200 && $statusCode < 300);

        // 取得 Request Body (如果是 POST/PUT)
        $body = null;
        if ($request->getMethod() !== 'get') {
            $body = $request->getBody();
            // 如果 body 太長可能需要截斷或過濾敏感資訊，目前先簡化
        }

        // 取得錯誤訊息（從 Response JSON 中嘗試解析）
        $errorMessage = null;
        if (!$success) {
            $responseBody = $response->getBody();
            $json = json_decode($responseBody, true);
            if (isset($json['error']['message'])) {
                $errorMessage = $json['error']['message'];
            }
        }

        // 寫入日誌
        $this->db->table('api_usage_logs')->insert([
            'api_key_id' => $apiKeyId,
            'endpoint' => $request->getUri()->getPath(),
            'method' => $request->getMethod(),
            'status_code' => $statusCode,
            'success' => $success ? 1 : 0,
            'response_time' => $duration,
            'ip' => $request->getIPAddress(),
            'user_agent' => $request->getUserAgent() ? (string)$request->getUserAgent() : null,
            'request_body' => $body,
            'error_message' => $errorMessage,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        // 增加使用次數
        $this->db->table('api_keys')
            ->where('id', $apiKeyId)
            ->increment('usage_count');
    }
}
