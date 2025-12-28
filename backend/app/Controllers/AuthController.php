<?php

namespace App\Controllers;

use App\Services\AuthService;

/**
 * AuthController - 認證系統 API
 */
class AuthController extends BaseController
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    /**
     * POST /api/auth/login
     */
    public function login()
    {
        $json = $this->request->getJSON(true);

        $username = $json['username'] ?? $json['email'] ?? '';
        $password = $json['password'] ?? '';

        if (empty($username) || empty($password)) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供使用者名稱和密碼', 400);
        }

        $result = $this->authService->login($username, $password);

        if (!$result['success']) {
            $httpCode = $result['error'] === 'ACCOUNT_DISABLED' ? 403 : 401;
            return $this->errorResponse($result['error'], $result['message'], $httpCode);
        }

        return $this->successResponse([
            'user' => $result['user'],
            'token' => $result['token'],
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout()
    {
        return $this->successResponse(null, '已成功登出');
    }

    /**
     * GET /api/auth/me
     */
    public function me()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '未登入或登入已過期', 401);
        }

        return $this->successResponse([
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'displayName' => $user['displayName'] ?? $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $user['avatar'] ?? null,
        ]);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '未登入或登入已過期', 401);
        }

        $json = $this->request->getJSON(true);
        $result = $this->authService->updateProfile($user['id'], $json);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 400);
        }

        return $this->successResponse($result['user']);
    }

    /**
     * PUT /api/auth/password
     */
    public function changePassword()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '未登入或登入已過期', 401);
        }

        $json = $this->request->getJSON(true);

        $currentPassword = $json['currentPassword'] ?? '';
        $newPassword = $json['newPassword'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供當前密碼和新密碼', 400);
        }

        $result = $this->authService->changePassword($user['id'], $currentPassword, $newPassword);

        if (!$result['success']) {
            return $this->errorResponse($result['error'], $result['message'], 401);
        }

        return $this->successResponse(null, $result['message']);
    }
}
