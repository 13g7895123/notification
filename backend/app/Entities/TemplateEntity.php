<?php

namespace App\Entities;

/**
 * TemplateEntity - 訊息模板實體
 */
class TemplateEntity
{
    public int $id;
    public int $userId;
    public string $name;
    public string $title;
    public string $content;
    public array $channelTypes;
    public array $variables;
    public string $createdAt;
    public string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->userId = (int) ($data['user_id'] ?? 0);
        $this->name = $data['name'] ?? '';
        $this->title = $data['title'] ?? '';
        $this->content = $data['content'] ?? '';
        $this->channelTypes = is_string($data['channel_types'] ?? null)
            ? json_decode($data['channel_types'], true)
            : ($data['channelTypes'] ?? $data['channel_types'] ?? []);
        $this->variables = is_string($data['variables'] ?? null)
            ? json_decode($data['variables'], true)
            : ($data['variables'] ?? []);
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
            'name' => $this->name,
            'title' => $this->title,
            'content' => $this->content,
            'channelTypes' => $this->channelTypes,
            'variables' => $this->variables,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }

    /**
     * 渲染模板（替換變數）
     */
    public function render(array $values): array
    {
        $title = $this->title;
        $content = $this->content;

        foreach ($values as $key => $value) {
            $title = str_replace("{{" . $key . "}}", $value, $title);
            $content = str_replace("{{" . $key . "}}", $value, $content);
        }

        return [
            'title' => $title,
            'content' => $content,
        ];
    }
}
