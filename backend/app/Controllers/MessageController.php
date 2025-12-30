<?php

namespace App\Controllers;

use App\Services\MessageService;

/**
 * MessageController - 通知訊息 API
 */
class MessageController extends BaseController
{
    private MessageService $messageService;

    public function __construct()
    {
        $this->messageService = new MessageService();
    }

    /**
     * GET /api/messages
     */
    public function index()
    {
        $filters = [
            'search' => $this->request->getGet('search'),
            'status' => $this->request->getGet('status'),
        ];
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);

        $result = $this->messageService->getMessages($filters, $page, $limit);

        return $this->successResponse($result);
    }

    /**
     * POST /api/messages/send
     */
    public function send()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $json = $this->request->getJSON(true);
        $result = $this->messageService->sendMessage($json, (int) $user['id']);

        if (!$result['success']) {
            return $this->errorResponse($result['error'] ?? 'ERROR', $result['message'] ?? '發送失敗', 400);
        }

        $responseData = [
            'messageId' => $result['messageId'],
            'status' => $result['status'],
        ];

        if (isset($result['results'])) {
            $responseData['results'] = $result['results'];
        }

        return $this->successResponse($responseData, $result['message'] ?? '操作成功');
    }

    /**
     * DELETE /api/messages/:id
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少訊息 ID', 400);
        }

        $result = $this->messageService->deleteMessage($id);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse(null, $result['message']);
    }
}
