<?php

namespace App\Controllers;

use App\Services\UserService;

/**
 * UserController - 使用者管理 API
 */
class UserController extends BaseController
{
    private UserService $userService;

    public function __construct()
    {
        $this->userService = new UserService();
    }

    /**
     * GET /api/users
     */
    public function index()
    {
        $filters = [
            'search' => $this->request->getGet('search'),
            'role' => $this->request->getGet('role'),
            'status' => $this->request->getGet('status'),
        ];
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);

        $result = $this->userService->getUsers($filters, $page, $limit);

        return $this->successResponse($result);
    }

    /**
     * POST /api/users
     */
    public function create()
    {
        $json = $this->request->getJSON(true);
        $result = $this->userService->createUser($json);

        if (!$result['success']) {
            $httpCode = $result['error'] === 'CONFLICT' ? 409 : 400;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse($result['user'], null, 201);
    }

    /**
     * PUT /api/users/:id
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $json = $this->request->getJSON(true);
        $result = $this->userService->updateUser($id, $json);

        if (!$result['success']) {
            $httpCode = $result['error'] === 'NOT_FOUND' ? 404 : 400;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse($result['user']);
    }

    /**
     * DELETE /api/users/:id
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $currentUser = $this->getCurrentUser();
        $result = $this->userService->deleteUser($id, $currentUser['id'] ?? null);

        if (!$result['success']) {
            $httpCode = match ($result['error']) {
                'NOT_FOUND' => 404,
                'FORBIDDEN' => 403,
                default => 400,
            };
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse(null, $result['message']);
    }

    /**
     * PUT /api/users/:id/status
     */
    public function updateStatus($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $json = $this->request->getJSON(true);
        $result = $this->userService->updateStatus($id, $json['status'] ?? '');

        if (!$result['success']) {
            $httpCode = $result['error'] === 'NOT_FOUND' ? 404 : 400;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse($result['data']);
    }

    /**
     * PUT /api/users/:id/password
     */
    public function resetPassword($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $json = $this->request->getJSON(true);
        $newPassword = $json['newPassword'] ?? '';

        if (empty($newPassword)) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供新密碼', 400);
        }

        $result = $this->userService->resetPassword($id, $newPassword);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 404);
        }

        return $this->successResponse(null, $result['message']);
    }
}
