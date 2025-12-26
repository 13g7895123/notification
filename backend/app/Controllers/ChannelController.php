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
     */
    public function index()
    {
        $channels = $this->channelService->getChannels();
        return $this->successResponse($channels);
    }

    /**
     * POST /api/channels
     */
    public function create()
    {
        $json = $this->request->getJSON(true);
        $result = $this->channelService->createChannel($json);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 400);
        }

        return $this->successResponse($result['channel'], null, 201);
    }

    /**
     * PUT /api/channels/:id
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $json = $this->request->getJSON(true);
        $result = $this->channelService->updateChannel($id, $json);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse($result['channel']);
    }

    /**
     * DELETE /api/channels/:id
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $result = $this->channelService->deleteChannel($id);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse(null, $result['message']);
    }

    /**
     * PUT /api/channels/:id/toggle
     */
    public function toggle($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $result = $this->channelService->toggleChannel($id);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse($result['data']);
    }

    /**
     * POST /api/channels/:id/test
     */
    public function test($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少渠道 ID', 400);
        }

        $result = $this->channelService->testChannel($id);

        if (!$result['success']) {
            $httpCode = $result['error'] === 'NOT_FOUND' ? 404 : 400;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse(null, $result['message']);
    }
}
