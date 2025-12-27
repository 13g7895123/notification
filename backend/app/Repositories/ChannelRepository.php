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
     * 根據 ID 查找渠道
     */
    public function find(int $id): ?ChannelEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new ChannelEntity($data) : null;
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
            'type' => $data['type'],
            'name' => $data['name'],
            'enabled' => $data['enabled'] ?? true ? 1 : 0,
            'config' => json_encode($data['config']),
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
    public function update(int $id, array $data): ?ChannelEntity
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

        $this->db->table($this->table)
            ->where('id', $id)
            ->update($updateData);

        return $this->find($id);
    }

    /**
     * 切換啟用狀態
     */
    public function toggle(int $id): ?ChannelEntity
    {
        $channel = $this->find($id);
        if (!$channel) {
            return null;
        }

        $this->db->table($this->table)
            ->where('id', $id)
            ->update([
                'enabled' => !$channel->enabled ? 1 : 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->find($id);
    }

    /**
     * 統計渠道數量
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
