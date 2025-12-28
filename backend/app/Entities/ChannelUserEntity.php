<?php

namespace App\Entities;

class ChannelUserEntity
{
    public int $id;
    public int $channelId;
    public string $providerId;
    public ?string $displayName;
    public ?string $pictureUrl;
    public string $status;
    public string $createdAt;
    public string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->channelId = (int) ($data['channel_id'] ?? $data['channelId'] ?? 0);
        $this->providerId = $data['provider_id'] ?? $data['providerId'] ?? '';
        $this->displayName = $data['display_name'] ?? $data['displayName'] ?? null;
        $this->pictureUrl = $data['picture_url'] ?? $data['pictureUrl'] ?? null;
        $this->status = $data['status'] ?? 'active';
        $this->createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->updatedAt = $data['updated_at'] ?? date('Y-m-d H:i:s');
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'channelId' => $this->channelId,
            'providerId' => $this->providerId,
            'displayName' => $this->displayName,
            'pictureUrl' => $this->pictureUrl,
            'status' => $this->status,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }
}
