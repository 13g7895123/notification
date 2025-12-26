<?php

namespace App\Entities;

/**
 * MessageEntity - 通知訊息實體
 */
class MessageEntity
{
    public string $id;
    public string $title;
    public string $content;
    public string $status;
    public array $channelIds;
    public ?string $scheduledAt;
    public ?string $sentAt;
    public string $createdAt;
    public string $userId;
    public array $results = [];

    public const STATUS_PENDING = 'pending';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_SENDING = 'sending';
    public const STATUS_SENT = 'sent';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_FAILED = 'failed';

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? '';
        $this->title = $data['title'] ?? '';
        $this->content = $data['content'] ?? '';
        $this->status = $data['status'] ?? self::STATUS_PENDING;
        $this->channelIds = is_string($data['channel_ids'] ?? null)
            ? json_decode($data['channel_ids'], true)
            : ($data['channelIds'] ?? $data['channel_ids'] ?? []);
        $this->scheduledAt = $data['scheduled_at'] ?? null;
        $this->sentAt = $data['sent_at'] ?? null;
        $this->createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->userId = $data['user_id'] ?? '';
    }

    /**
     * 轉換為陣列
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status,
            'channelIds' => $this->channelIds,
            'scheduledAt' => $this->scheduledAt,
            'sentAt' => $this->sentAt,
            'createdAt' => $this->createdAt,
            'results' => $this->results,
        ];
    }

    /**
     * 添加發送結果
     */
    public function addResult(array $result): void
    {
        $this->results[] = $result;
    }

    /**
     * 判斷最終狀態
     */
    public function determineStatus(): string
    {
        if (empty($this->results)) {
            return self::STATUS_FAILED;
        }

        $successCount = count(array_filter($this->results, fn($r) => $r['success']));
        $totalCount = count($this->results);

        if ($successCount === $totalCount) {
            return self::STATUS_SENT;
        } elseif ($successCount > 0) {
            return self::STATUS_PARTIAL;
        }
        return self::STATUS_FAILED;
    }
}
