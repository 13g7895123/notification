<?php

namespace App\Repositories;

use App\Entities\ChannelEntity;

/**
 * ChannelRepository - 通知渠道 Repository
 */
class ChannelRepository extends BaseRepository
{
    protected string $table = 'channels';

    /**
     * 根據 ID 和使用者 ID 查找渠道
     */
    public function find(int $id, ?int $userId = null): ?ChannelEntity
    {
        $builder = $this->db->table($this->table)->where('id', $id);

        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }

        $data = $builder->get()->getRowArray();
        return $data ? new ChannelEntity($data) : null;
    }

    /**
     * 根據使用者 ID 取得所有渠道
     */
    public function findByUserId(int $userId): array
    {
        $data = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 取得所有渠道
     */
    public function findAll(): array
    {
        $data = $this->db->table($this->table)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 根據使用者 ID 取得啟用的渠道
     */
    public function findEnabledByUserId(int $userId): array
    {
        $data = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 取得啟用的渠道
     */
    public function findEnabled(): array
    {
        $data = $this->db->table($this->table)
            ->where('enabled', 1)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 根據 ID 列表和使用者 ID 查找渠道
     */
    public function findByIdsAndUserId(array $ids, int $userId): array
    {
        if (empty($ids)) {
            return [];
        }

        $data = $this->db->table($this->table)
            ->whereIn('id', $ids)
            ->where('user_id', $userId)
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 根據 ID 列表查找渠道
     */
    public function findByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        $data = $this->db->table($this->table)
            ->whereIn('id', $ids)
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelEntity($row), $data);
    }

    /**
     * 建立渠道
     */
    public function create(array $data): ChannelEntity
    {
        $now = date('Y-m-d H:i:s');

        $channelData = [
            'user_id' => $data['userId'],
            'type' => $data['type'],
            'name' => $data['name'],
            'enabled' => $data['enabled'] ?? true ? 1 : 0,
            'config' => json_encode($data['config']),
            'webhook_key' => bin2hex(random_bytes(16)), // 生成 32 字元的隨機金鑰
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table($this->table)->insert($channelData);
        $channelData['id'] = $this->getInsertId();

        return new ChannelEntity($channelData);
    }

    /**
     * 更新渠道
     */
    public function update(int $id, array $data, ?int $userId = null): ?ChannelEntity
    {
        $updateData = ['updated_at' => date('Y-m-d H:i:s')];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['enabled'])) {
            $updateData['enabled'] = $data['enabled'] ? 1 : 0;
        }
        if (isset($data['config'])) {
            $updateData['config'] = json_encode($data['config']);
        }

        $builder = $this->db->table($this->table)->where('id', $id);

        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }

        $builder->update($updateData);

        return $this->find($id, $userId);
    }

    /**
     * 切換啟用狀態
     */
    public function toggle(int $id, ?int $userId = null): ?ChannelEntity
    {
        $channel = $this->find($id, $userId);
        if (!$channel) {
            return null;
        }

        $builder = $this->db->table($this->table)->where('id', $id);

        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }

        $builder->update([
            'enabled' => !$channel->enabled ? 1 : 0,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->find($id, $userId);
    }

    /**
     * 刪除渠道
     */
    public function deleteByUserId(int $id, int $userId): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->where('user_id', $userId)
            ->delete();
    }

    /**
     * 根據使用者 ID 取得統計
     */
    public function getStatsByUserId(int $userId): array
    {
        $total = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->countAllResults();
        $active = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->countAllResults();

        return [
            'total' => $total,
            'active' => $active,
        ];
    }

    /**
     * 統計渠道數量（全域）
     */
    public function getStats(): array
    {
        $total = $this->db->table($this->table)->countAllResults();
        $active = $this->db->table($this->table)->where('enabled', 1)->countAllResults();

        return [
            'total' => $total,
            'active' => $active,
        ];
    }
}
