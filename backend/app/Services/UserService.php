<?php

namespace App\Services;

use App\Entities\UserEntity;
use App\Repositories\UserRepository;

/**
 * UserService - 使用者服務
 */
class UserService
{
    private UserRepository $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    /**
     * 取得使用者列表
     */
    public function getUsers(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $result = $this->userRepository->findPaginated($filters, $page, $limit);

        return [
            'users' => array_map(fn(UserEntity $u) => $u->toArray(), $result['users']),
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ];
    }

    /**
     * 取得單一使用者
     */
    public function getUser(string $id): ?UserEntity
    {
        return $this->userRepository->find($id);
    }

    /**
     * 建立使用者
     */
    public function createUser(array $data): array
    {
        // 驗證必要欄位
        $required = ['username', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return [
                    'success' => false,
                    'error' => 'VALIDATION_ERROR',
                    'message' => "缺少必要欄位: {$field}",
                ];
            }
        }

        // 檢查 email 是否重複
        if ($this->userRepository->emailExists($data['email'])) {
            return [
                'success' => false,
                'error' => 'CONFLICT',
                'message' => '此電子郵件已被使用',
            ];
        }

        $user = $this->userRepository->create($data);

        return [
            'success' => true,
            'user' => $user->toArray(),
        ];
    }

    /**
     * 更新使用者
     */
    public function updateUser(string $id, array $data): array
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '使用者不存在',
            ];
        }

        $updateData = [];
        if (isset($data['username'])) $updateData['username'] = $data['username'];
        if (isset($data['display_name'])) $updateData['display_name'] = $data['display_name'];
        if (isset($data['role'])) $updateData['role'] = $data['role'];
        if (isset($data['status'])) $updateData['status'] = $data['status'];
        if (isset($data['avatar'])) $updateData['avatar'] = $data['avatar'];

        $updatedUser = $this->userRepository->update($id, $updateData);

        return [
            'success' => true,
            'user' => $updatedUser->toArray(),
        ];
    }

    /**
     * 刪除使用者
     */
    public function deleteUser(string $id, ?string $currentUserId = null): array
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '使用者不存在',
            ];
        }

        if ($currentUserId && $currentUserId === $id) {
            return [
                'success' => false,
                'error' => 'FORBIDDEN',
                'message' => '不能刪除自己的帳號',
            ];
        }

        $this->userRepository->delete($id);

        return [
            'success' => true,
            'message' => '使用者已刪除',
        ];
    }

    /**
     * 更新使用者狀態
     */
    public function updateStatus(string $id, string $status): array
    {
        if (!in_array($status, ['active', 'inactive'])) {
            return [
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => '狀態必須是 active 或 inactive',
            ];
        }

        $user = $this->userRepository->find($id);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '使用者不存在',
            ];
        }

        $this->userRepository->update($id, ['status' => $status]);

        return [
            'success' => true,
            'data' => ['id' => $id, 'status' => $status],
        ];
    }

    /**
     * 重設密碼
     */
    public function resetPassword(string $id, string $newPassword): array
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'NOT_FOUND',
                'message' => '使用者不存在',
            ];
        }

        $this->userRepository->updatePassword($id, $newPassword);

        return [
            'success' => true,
            'message' => '密碼已重設',
        ];
    }
}
