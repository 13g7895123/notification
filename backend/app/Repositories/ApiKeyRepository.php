<?php

namespace App\Repositories;

use App\Entities\ApiKeyEntity;

/**
 * ApiKeyRepository - API 金鑰 Repository
 */
class ApiKeyRepository extends BaseRepository
{
    protected string $table = 'api_keys';

    /**
     * 根據 ID 查找金鑰
     */
    public function find(int $id): ?ApiKeyEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new ApiKeyEntity($data) : null;
    }

    /**
     * 根據金鑰 Hash 查找
     */
    public function findByKeyHash(string $keyHash): ?ApiKeyEntity
    {
        $data = $this->db->table($this->table)
            ->where('key', $keyHash)
            ->get()
            ->getRowArray();

        return $data ? new ApiKeyEntity($data) : null;
    }

    /**
     * 根據原始金鑰查找（API Key 認證用）
     */
    public function findByKey(string $rawKey): ?array
    {
        // 計算 hash 值比對
        $hash = hash('sha256', $rawKey);
        $data = $this->db->table($this->table)
            ->where('key', $hash)
            ->get()
            ->getRowArray();

        return $data;
    }

    /**
     * 更新最後使用時間
     */
    public function updateLastUsed(int $id): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->update([
                'last_used_at' => date('Y-m-d H:i:s'),
            ]);
    }

    /**
     * 取得使用者的金鑰列表
     */
    public function findByUserId(int $userId): array
    {
        $data = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ApiKeyEntity($row), $data);
    }

    /**
     * 取得所有金鑰
     */
    public function findAll(): array
    {
        $data = $this->db->table($this->table)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ApiKeyEntity($row), $data);
    }

    /**
     * 建立金鑰
     */
    public function create(array $data): array
    {
        $now = date('Y-m-d H:i:s');
        $keyData = ApiKeyEntity::generateKey();

        $apiKeyData = [
            'user_id' => $data['userId'],
            'name' => $data['name'],
            'key' => $keyData['hash'],
            'prefix' => $keyData['prefix'],
            'permissions' => json_encode($data['permissions'] ?? ['send']),
            'rate_limit' => $data['rateLimit'] ?? 60,
            'usage_count' => 0,
            'enabled' => 1,
            'expires_at' => $data['expiresAt'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table($this->table)->insert($apiKeyData);
        $apiKeyData['id'] = $this->getInsertId();

        return [
            'entity' => new ApiKeyEntity($apiKeyData),
            'fullKey' => $keyData['key'], // 只在建立時回傳
        ];
    }

    /**
     * 更新金鑰
     */
    public function update(int $id, array $data): ?ApiKeyEntity
    {
        $updateData = ['updated_at' => date('Y-m-d H:i:s')];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['permissions'])) {
            $updateData['permissions'] = json_encode($data['permissions']);
        }
        if (isset($data['rateLimit'])) {
            $updateData['rate_limit'] = $data['rateLimit'];
        }
        if (isset($data['enabled'])) {
            $updateData['enabled'] = $data['enabled'] ? 1 : 0;
        }
        if (isset($data['expiresAt'])) {
            $updateData['expires_at'] = $data['expiresAt'];
        }

        $this->db->table($this->table)
            ->where('id', $id)
            ->update($updateData);

        return $this->find($id);
    }

    /**
     * 切換啟用狀態
     */
    public function toggle(int $id): ?ApiKeyEntity
    {
        $apiKey = $this->find($id);
        if (!$apiKey) {
            return null;
        }

        $this->db->table($this->table)
            ->where('id', $id)
            ->update([
                'enabled' => !$apiKey->enabled ? 1 : 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->find($id);
    }

    /**
     * 重新產生金鑰
     */
    public function regenerate(int $id): ?array
    {
        $keyData = ApiKeyEntity::generateKey();

        $this->db->table($this->table)
            ->where('id', $id)
            ->update([
                'key' => $keyData['hash'],
                'prefix' => $keyData['prefix'],
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return [
            'fullKey' => $keyData['key'],
        ];
    }

    /**
     * 更新使用次數
     */
    public function incrementUsage(int $id): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->set('usage_count', 'usage_count + 1', false)
            ->set('last_used_at', date('Y-m-d H:i:s'))
            ->update();
    }

    /**
     * 刪除金鑰及其使用紀錄
     */
    public function delete(int $id): bool
    {
        $this->db->table('api_usage_logs')->where('api_key_id', $id)->delete();
        return parent::delete($id);
    }
}
