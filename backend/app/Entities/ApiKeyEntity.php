<?php

namespace App\Entities;

/**
 * ApiKeyEntity - API 金鑰實體
 */
class ApiKeyEntity
{
    public int $id;
    public int $userId;
    public string $name;
    public string $key;
    public string $prefix;
    public array $permissions;
    public int $rateLimit;
    public int $usageCount;
    public bool $enabled;
    public ?string $expiresAt;
    public ?string $lastUsedAt;
    public string $createdAt;
    public string $updatedAt;

    public const PERMISSION_SEND = 'send';
    public const PERMISSION_READ_CHANNELS = 'read_channels';
    public const PERMISSION_READ_LOGS = 'read_logs';
    public const PERMISSION_READ_STATS = 'read_stats';

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->userId = (int) ($data['user_id'] ?? 0);
        $this->name = $data['name'] ?? '';
        $this->key = $data['key'] ?? '';
        $this->prefix = $data['prefix'] ?? '';
        $this->permissions = is_string($data['permissions'] ?? null)
            ? json_decode($data['permissions'], true)
            : ($data['permissions'] ?? []);
        $this->rateLimit = (int) ($data['rate_limit'] ?? 60);
        $this->usageCount = (int) ($data['usage_count'] ?? 0);
        $this->enabled = (bool) ($data['enabled'] ?? true);
        $this->expiresAt = $data['expires_at'] ?? null;
        $this->lastUsedAt = $data['last_used_at'] ?? null;
        $this->createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->updatedAt = $data['updated_at'] ?? date('Y-m-d H:i:s');
    }

    /**
     * 轉換為陣列（不含完整金鑰）
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'key' => $this->prefix,
            'prefix' => $this->prefix,
            'permissions' => $this->permissions,
            'rateLimit' => $this->rateLimit,
            'usageCount' => $this->usageCount,
            'enabled' => $this->enabled,
            'expiresAt' => $this->expiresAt,
            'lastUsedAt' => $this->lastUsedAt,
            'createdAt' => $this->createdAt,
        ];
    }

    /**
     * 檢查是否有權限
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions);
    }

    /**
     * 是否已過期
     */
    public function isExpired(): bool
    {
        if (!$this->expiresAt) {
            return false;
        }
        return strtotime($this->expiresAt) < time();
    }

    /**
     * 是否可用
     */
    public function isUsable(): bool
    {
        return $this->enabled && !$this->isExpired();
    }

    /**
     * 生成新金鑰
     */
    public static function generateKey(): array
    {
        $fullKey = 'nk_live_' . bin2hex(random_bytes(24));
        $prefix = substr($fullKey, 0, 12) . '...' . substr($fullKey, -4);

        return [
            'key' => $fullKey,
            'hash' => hash('sha256', $fullKey),
            'prefix' => $prefix,
        ];
    }
}
