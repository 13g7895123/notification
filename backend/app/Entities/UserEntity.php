<?php

namespace App\Entities;

/**
 * UserEntity - 使用者實體
 */
class UserEntity
{
    public int $id;
    public string $username;
    public ?string $displayName;
    public string $email;
    public string $password;
    public string $role;
    public string $status;
    public ?string $avatar;
    public string $createdAt;
    public string $updatedAt;
    public ?string $lastLoginAt;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->username = $data['username'] ?? '';
        $this->displayName = $data['display_name'] ?? null;
        $this->email = $data['email'] ?? '';
        $this->password = $data['password'] ?? '';
        $this->role = $data['role'] ?? 'user';
        $this->status = $data['status'] ?? 'active';
        $this->avatar = $data['avatar'] ?? null;
        $this->createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->updatedAt = $data['updated_at'] ?? date('Y-m-d H:i:s');
        $this->lastLoginAt = $data['last_login_at'] ?? null;
    }

    /**
     * 轉換為陣列（不含密碼）
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'avatar' => $this->avatar,
            'createdAt' => $this->createdAt,
            'lastLoginAt' => $this->lastLoginAt,
        ];
    }

    /**
     * 轉換為公開資訊（用於 API 回應）
     */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'displayName' => $this->displayName,
            'email' => $this->email,
            'role' => $this->role,
            'avatar' => $this->avatar,
        ];
    }

    /**
     * 驗證密碼
     */
    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    /**
     * 是否為管理員
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * 是否啟用
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
