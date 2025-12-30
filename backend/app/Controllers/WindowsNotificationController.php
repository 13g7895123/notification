<?php

namespace App\Controllers;

use App\Repositories\WindowsNotificationRepository;
use App\Repositories\ApiKeyRepository;

/**
 * WindowsNotificationController - Windows 通知 API
 */
class WindowsNotificationController extends BaseController
{
    private WindowsNotificationRepository $notificationRepo;
    private ApiKeyRepository $apiKeyRepo;

    public function __construct()
    {
        $this->notificationRepo = new WindowsNotificationRepository();
        $this->apiKeyRepo = new ApiKeyRepository();
    }

    /**
     * GET /api/notifications/windows
     * 取得通知列表（需要認證或 API Key）
     */
    public function index()
    {
        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $status = $this->request->getGet('status');
        $type = $this->request->getGet('type');
        $repo = $this->request->getGet('repo');
        $search = $this->request->getGet('search');
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);

        $filters = array_filter([
            'status' => $status,
            'type' => $type,
            'repo' => $repo,
            'search' => $search,
        ]);

        $result = $this->notificationRepo->findPaginated($filters, $page, $limit);
        return $this->successResponse($result);
    }

    /**
     * GET /api/notifications/windows/pending
     * 取得待處理的通知（給 Windows Client 用）
     */
    public function pending()
    {
        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $limit = (int) ($this->request->getGet('limit') ?? 50);
        $notifications = $this->notificationRepo->findPending($limit);

        return $this->successResponse([
            'notifications' => $notifications,
            'count' => count($notifications),
        ]);
    }

    /**
     * GET /api/notifications/windows/stats
     * 取得統計資料
     */
    public function stats()
    {
        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $stats = $this->notificationRepo->getStats();
        return $this->successResponse($stats);
    }

    /**
     * POST /api/notifications/windows
     * 建立新通知（CI/CD 呼叫用）
     */
    public function create()
    {
        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $json = $this->request->getJSON(true);

        // 驗證必填欄位
        $required = ['title', 'message', 'repo'];
        foreach ($required as $field) {
            if (empty($json[$field])) {
                return $this->errorResponse('VALIDATION_ERROR', "缺少必填欄位: {$field}", 400);
            }
        }

        // 準備資料
        $data = [
            'type' => $json['type'] ?? 'cicd',
            'title' => $json['title'],
            'message' => $json['message'],
            'repo' => $json['repo'],
            'branch' => $json['branch'] ?? null,
            'commit_sha' => $json['commitSha'] ?? $json['commit_sha'] ?? null,
            'status' => 'pending',
            'priority' => $json['priority'] ?? 'normal',
            'icon' => $json['icon'] ?? null,
            'action_url' => $json['actionUrl'] ?? $json['action_url'] ?? null,
            'metadata' => $json['metadata'] ?? null,
        ];

        $id = $this->notificationRepo->create($data);
        $notification = $this->notificationRepo->findById($id);

        return $this->successResponse($notification, '通知已建立', 201);
    }

    /**
     * GET /api/notifications/windows/:id
     * 取得單一通知
     */
    public function show($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少通知 ID', 400);
        }

        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $notification = $this->notificationRepo->findById((int) $id);

        if (!$notification) {
            return $this->errorResponse('NOT_FOUND', '找不到指定的通知', 404);
        }

        return $this->successResponse($notification);
    }

    /**
     * PATCH /api/notifications/windows/:id/status
     * 更新通知狀態（Windows Client 呼叫用）
     */
    public function updateStatus($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少通知 ID', 400);
        }

        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $json = $this->request->getJSON(true);

        if (empty($json['status'])) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少 status 欄位', 400);
        }

        $allowedStatuses = ['pending', 'delivered', 'read', 'dismissed'];
        if (!in_array($json['status'], $allowedStatuses)) {
            return $this->errorResponse('VALIDATION_ERROR', '無效的狀態值', 400);
        }

        $notification = $this->notificationRepo->findById((int) $id);
        if (!$notification) {
            return $this->errorResponse('NOT_FOUND', '找不到指定的通知', 404);
        }

        $this->notificationRepo->updateStatus((int) $id, $json['status']);

        $updated = $this->notificationRepo->findById((int) $id);
        return $this->successResponse($updated, '狀態已更新');
    }

    /**
     * DELETE /api/notifications/windows/:id
     * 刪除通知
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少通知 ID', 400);
        }

        // 驗證認證（只有登入用戶可以刪除）
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $notification = $this->notificationRepo->findById((int) $id);
        if (!$notification) {
            return $this->errorResponse('NOT_FOUND', '找不到指定的通知', 404);
        }

        $this->notificationRepo->delete((int) $id);
        return $this->successResponse(null, '通知已刪除');
    }

    /**
     * POST /api/notifications/windows/expire
     * 將過期的通知標記為 expired（可以用 cron job 呼叫）
     */
    public function expire()
    {
        // 驗證認證
        if (!$this->checkAuth()) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入或提供有效的 API Key', 401);
        }

        $hours = (int) ($this->request->getGet('hours') ?? 24);
        $count = $this->notificationRepo->markExpired($hours);

        return $this->successResponse([
            'expired_count' => $count,
        ], "{$count} 筆通知已標記為過期");
    }

    /**
     * 檢查認證（支援 JWT 或 API Key）
     */
    private function checkAuth(): bool
    {
        // 優先檢查 JWT
        $user = $this->getCurrentUser();
        if ($user) {
            return true;
        }

        // 檢查 API Key
        $apiKey = $this->request->getHeaderLine('X-API-Key');
        if (empty($apiKey)) {
            return false;
        }

        $key = $this->apiKeyRepo->findByKey($apiKey);
        if (!$key || !$key['enabled']) {
            return false;
        }

        // 檢查權限（需要有 send 權限）
        $permissions = json_decode($key['permissions'], true);
        if (!in_array('send', $permissions) && !in_array('read_stats', $permissions)) {
            return false;
        }

        // 更新最後使用時間
        $this->apiKeyRepo->updateLastUsed((int) $key['id']);

        // 將 API Key ID 存入 request 以供 Log 使用
        $this->request->apiKeyId = (int) $key['id'];

        return true;
    }
}
