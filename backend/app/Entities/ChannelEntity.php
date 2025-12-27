<?php

namespace App\Entities;

/**
 * ChannelEntity - 通知渠道實體
 */
class ChannelEntity
{
    public int $id;
    public int $userId;
    public string $type;
    public string $name;
    public bool $enabled;
    public array $config;
    public string $createdAt;
    public string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->userId = (int) ($data['user_id'] ?? $data['userId'] ?? 0);
        $this->type = $data['type'] ?? '';
        $this->name = $data['name'] ?? '';
        $this->enabled = (bool) ($data['enabled'] ?? true);
        $this->config = is_string($data['config'] ?? null)
            ? json_decode($data['config'], true)
            : ($data['config'] ?? []);
        $this->createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->updatedAt = $data['updated_at'] ?? date('Y-m-d H:i:s');
    }

    /**
     * 轉換為陣列
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'type' => $this->type,
            'name' => $this->name,
            'enabled' => $this->enabled,
            'config' => $this->config,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }

    /**
     * 是否為 LINE 渠道
     */
    public function isLine(): bool
    {
        return $this->type === 'line';
    }

    /**
     * 是否為 Telegram 渠道
     */
    public function isTelegram(): bool
    {
        return $this->type === 'telegram';
    }

    /**
     * 取得設定值
     */
    public function getConfigValue(string $key, $default = null)
    {
        return $this->config[$key] ?? $default;
    }
}
