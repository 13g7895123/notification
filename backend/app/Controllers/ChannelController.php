<?php

namespace App\Controllers;

use App\Services\ChannelService;

/**
 * ChannelController - 通知渠道 API
 */
class ChannelController extends BaseController
{
    private ChannelService $channelService;

    public function __construct()
    {
        $this->channelService = new ChannelService();
    }

    /**
     * GET /api/channels
     * 取得當前使用者的所有渠道
     */
    public function index()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $channels = $this->channelService->getChannelsByUserId((int) $user['id']);
        return $this->successResponse($channels);
    }

    /**
     * POST /api/channels
     * 建立渠道
     */
    public function create()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $json = $this->request->getJSON(true);
        $result = $this->channelService->createChannel($json, (int) $user['id']);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 400);
        }

        return $this->successResponse($result['channel'], null, 201);
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

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $json = $this->request->getJSON(true);
        $result = $this->channelService->updateChannel((int) $id, $json, (int) $user['id']);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse($result['channel']);
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

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $result = $this->channelService->deleteChannel((int) $id, (int) $user['id']);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse(null, $result['message']);
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

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $result = $this->channelService->toggleChannel((int) $id, (int) $user['id']);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse($result['data']);
    }

    /**
     * POST /api/channels/:id/test
     * 測試渠道
     */
    public function test($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $result = $this->channelService->testChannel((int) $id, (int) $user['id']);

        if (!$result['success']) {
            $httpCode = $result['error'] === 'NOT_FOUND' ? 404 : 400;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse(null, $result['message']);
    }
}
