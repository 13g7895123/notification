<?php

namespace App\Services;

use App\Entities\UserEntity;
use App\Repositories\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * AuthService - 認證服務
 */
class AuthService
{
    private UserRepository $userRepository;
    private string $jwtSecret;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->jwtSecret = getenv('JWT_SECRET') ?: 'default-secret-key';
    }

    /**
     * 登入
     */
    public function login(string $username, string $password): array
    {
        $user = $this->userRepository->findByUsername($username);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
                'message' => '使用者名稱或密碼錯誤',
            ];
        }

        if (!$user->verifyPassword($password)) {
            return [
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
                'message' => '使用者名稱或密碼錯誤',
            ];
        }

        if (!$user->isActive()) {
            return [
                'success' => false,
                'error' => 'ACCOUNT_DISABLED',
                'message' => '帳號已被停用',
            ];
        }

        // 更新最後登入時間
        $this->userRepository->updateLastLogin($user->id);

        // 生成 JWT Token
        $token = $this->generateToken($user);

        return [
            'success' => true,
            'user' => $user->toPublic(),
            'token' => $token,
        ];
    }

    /**
     * 生成 JWT Token
     */
    public function generateToken(UserEntity $user): string
    {
        $issuedAt = time();
        $expiresAt = $issuedAt + (60 * 60 * 24); // 24 小時

        $payload = [
            'iss' => 'notifyhub',
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'sub' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * 驗證 Token
     */
    public function verifyToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return (array) $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * 變更密碼
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): array
    {
        $user = $this->userRepository->find($userId);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '使用者不存在',
            ];
        }

        if (!$user->verifyPassword($currentPassword)) {
            return [
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
                'message' => '當前密碼錯誤',
            ];
        }

        $this->userRepository->updatePassword($userId, $newPassword);

        return [
            'success' => true,
            'message' => '密碼已變更',
        ];
    }

    /**
     * 更新個人資料
     */
    public function updateProfile(int $userId, array $data): array
    {
        $updateData = [];

        if (isset($data['username'])) {
            $updateData['username'] = $data['username'];
        }
        if (isset($data['display_name'])) {
            $updateData['display_name'] = $data['display_name'];
        }
        if (isset($data['avatar'])) {
            $updateData['avatar'] = $data['avatar'];
        }

        if (empty($updateData)) {
            return [
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => '沒有提供更新資料',
            ];
        }

        $user = $this->userRepository->update($userId, $updateData);

        return [
            'success' => true,
            'user' => $user->toPublic(),
        ];
    }
}
