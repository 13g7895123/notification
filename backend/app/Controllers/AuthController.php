<?php

namespace App\Controllers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * AuthController - 認證系統 API
 */
class AuthController extends BaseController
{
    /**
     * POST /api/auth/login
     * 使用者登入
     */
    public function login()
    {
        $json = $this->request->getJSON(true);

        $email = $json['email'] ?? '';
        $password = $json['password'] ?? '';

        if (empty($email) || empty($password)) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供電子郵件和密碼', 400);
        }

        // 查找使用者
        $user = $this->db->table('users')
            ->where('email', $email)
            ->get()
            ->getRowArray();

        if (!$user) {
            return $this->errorResponse('INVALID_CREDENTIALS', '電子郵件或密碼錯誤', 401);
        }

        // 驗證密碼
        if (!password_verify($password, $user['password'])) {
            return $this->errorResponse('INVALID_CREDENTIALS', '電子郵件或密碼錯誤', 401);
        }

        // 檢查狀態
        if ($user['status'] !== 'active') {
            return $this->errorResponse('ACCOUNT_DISABLED', '帳號已被停用', 403);
        }

        // 更新最後登入時間
        $this->db->table('users')
            ->where('id', $user['id'])
            ->update(['last_login_at' => date('Y-m-d H:i:s')]);

        // 生成 JWT Token
        $jwtSecret = getenv('JWT_SECRET') ?: 'default-secret-key';
        $issuedAt = time();
        $expiresAt = $issuedAt + (60 * 60 * 24); // 24 小時

        $payload = [
            'iss' => 'notifyhub',
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];

        $token = JWT::encode($payload, $jwtSecret, 'HS256');

        return $this->successResponse([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar' => $user['avatar'],
            ],
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     * 使用者登出
     */
    public function logout()
    {
        // JWT 是無狀態的，前端只需清除 token
        return $this->successResponse(null, '已成功登出');
    }

    /**
     * GET /api/auth/me
     * 取得當前登入使用者資訊
     */
    public function me()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '未登入或登入已過期', 401);
        }

        return $this->successResponse([
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $user['avatar'],
        ]);
    }

    /**
     * PUT /api/auth/profile
     * 更新當前使用者個人資料
     */
    public function updateProfile()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '未登入或登入已過期', 401);
        }

        $json = $this->request->getJSON(true);

        $updateData = [];

        if (isset($json['username'])) {
            $updateData['username'] = $json['username'];
        }

        if (isset($json['avatar'])) {
            $updateData['avatar'] = $json['avatar'];
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');

            $this->db->table('users')
                ->where('id', $user['id'])
                ->update($updateData);
        }

        // 取得更新後的使用者資料
        $updatedUser = $this->db->table('users')
            ->where('id', $user['id'])
            ->get()
            ->getRowArray();

        return $this->successResponse([
            'id' => $updatedUser['id'],
            'username' => $updatedUser['username'],
            'email' => $updatedUser['email'],
            'role' => $updatedUser['role'],
            'avatar' => $updatedUser['avatar'],
        ]);
    }

    /**
     * PUT /api/auth/password
     * 變更當前使用者密碼
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

        // 驗證當前密碼
        $dbUser = $this->db->table('users')
            ->where('id', $user['id'])
            ->get()
            ->getRowArray();

        if (!password_verify($currentPassword, $dbUser['password'])) {
            return $this->errorResponse('INVALID_CREDENTIALS', '當前密碼錯誤', 401);
        }

        // 更新密碼
        $this->db->table('users')
            ->where('id', $user['id'])
            ->update([
                'password' => password_hash($newPassword, PASSWORD_BCRYPT),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse(null, '密碼已變更');
    }
}
