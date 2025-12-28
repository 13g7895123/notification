<?php

namespace App\Repositories;

use App\Entities\ChannelUserEntity;

class ChannelUserRepository extends BaseRepository
{
    protected string $table = 'channel_users';

    public function findByChannelId(int $channelId): array
    {
        $data = $this->db->table($this->table)
            ->where('channel_id', $channelId)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new ChannelUserEntity($row), $data);
    }

    public function findByProviderId(int $channelId, string $providerId): ?ChannelUserEntity
    {
        $data = $this->db->table($this->table)
            ->where('channel_id', $channelId)
            ->where('provider_id', $providerId)
            ->get()
            ->getRowArray();

        return $data ? new ChannelUserEntity($data) : null;
    }

    public function saveUser(int $channelId, string $providerId, ?string $displayName = null, ?string $pictureUrl = null): ChannelUserEntity
    {
        $existing = $this->findByProviderId($channelId, $providerId);

        $now = date('Y-m-d H:i:s');
        $data = [
            'channel_id' => $channelId,
            'provider_id' => $providerId,
            'updated_at' => $now,
            'status' => 'active' // Ensure active on interaction
        ];

        if ($displayName !== null) $data['display_name'] = $displayName;
        if ($pictureUrl !== null) $data['picture_url'] = $pictureUrl;

        if ($existing) {
            $this->db->table($this->table)
                ->where('id', $existing->id)
                ->update($data);
            return $this->find($existing->id);
        } else {
            $data['created_at'] = $now;
            $this->db->table($this->table)->insert($data);
            return $this->find($this->getInsertId());
        }
    }

    public function find(int $id): ?ChannelUserEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new ChannelUserEntity($data) : null;
    }
}
