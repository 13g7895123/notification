<?php

namespace App\Repositories;

use App\Entities\MessageEntity;

/**
 * MessageRepository - 通知訊息 Repository
 */
class MessageRepository extends BaseRepository
{
    protected string $table = 'messages';

    /**
     * 根據 ID 查找訊息
     */
    public function find(int $id): ?MessageEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new MessageEntity($data) : null;
    }

    /**
     * 分頁查詢訊息
     */
    public function findPaginated(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $builder = $this->db->table($this->table);

        // 搜尋
        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('title', $filters['search'])
                ->orLike('content', $filters['search'])
                ->groupEnd();
        }

        // 篩選狀態
        if (!empty($filters['status'])) {
            $builder->where('status', $filters['status']);
        }

        // 計算總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $data = $builder
            ->orderBy('created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        $messages = array_map(fn($row) => new MessageEntity($row), $data);

        return [
            'messages' => $messages,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 建立訊息
     */
    public function create(array $data): MessageEntity
    {
        $now = date('Y-m-d H:i:s');

        // 格式化 scheduledAt
        $scheduledAt = $data['scheduledAt'] ?? null;
        if ($scheduledAt && !is_string($scheduledAt)) {
            // 如果是 DateTime 物件或時間戳，轉換為字串
            if ($scheduledAt instanceof \DateTimeInterface) {
                $scheduledAt = $scheduledAt->format('Y-m-d H:i:s');
            }
        } elseif ($scheduledAt && strtotime($scheduledAt)) {
            // 確保格式正確
            $scheduledAt = date('Y-m-d H:i:s', strtotime($scheduledAt));
        }

        $messageData = [
            'title' => $data['title'],
            'content' => $data['content'],
            'status' => $data['status'] ?? MessageEntity::STATUS_PENDING,
            'channel_ids' => json_encode($data['channelIds']),
            'channel_options' => json_encode($data['channelOptions'] ?? []),
            'scheduled_at' => $scheduledAt,
            'created_at' => $now,
            'user_id' => $data['userId'],
        ];

        $this->db->table($this->table)->insert($messageData);
        $messageData['id'] = $this->getInsertId();

        return new MessageEntity($messageData);
    }

    /**
     * 更新訊息狀態
     */
    public function updateStatus(int $id, string $status, ?string $sentAt = null): bool
    {
        $data = ['status' => $status];
        if ($sentAt) {
            $data['sent_at'] = $sentAt;
        }

        return $this->db->table($this->table)
            ->where('id', $id)
            ->update($data);
    }

    /**
     * 新增發送結果
     */
    public function addResult(int $messageId, int $channelId, bool $success, ?string $error = null): void
    {
        $this->db->table('message_results')->insert([
            'message_id' => $messageId,
            'channel_id' => $channelId,
            'success' => $success ? 1 : 0,
            'error' => $error,
            'sent_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * 取得訊息結果
     */
    public function getResults(int $messageId): array
    {
        return $this->db->table('message_results mr')
            ->select('mr.*, c.name as channel_name, c.type as channel_type')
            ->join('channels c', 'c.id = mr.channel_id', 'left')
            ->where('mr.message_id', $messageId)
            ->get()
            ->getResultArray();
    }

    /**
     * 取得最近訊息
     */
    public function getRecent(int $limit = 5): array
    {
        $data = $this->db->table($this->table)
            ->select('id, title, status, created_at')
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new MessageEntity($row), $data);
    }

    /**
     * 取得已到期的排程訊息
     */
    public function getScheduledMessagesReady(): array
    {
        $now = date('Y-m-d H:i:s');

        $data = $this->db->table($this->table)
            ->where('status', MessageEntity::STATUS_SCHEDULED)
            ->where('scheduled_at <=', $now)
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new MessageEntity($row), $data);
    }

    /**
     * 取得訊息的 channel_options
     */
    public function getChannelOptions(int $messageId): array
    {
        $row = $this->db->table($this->table)
            ->select('channel_options')
            ->where('id', $messageId)
            ->get()
            ->getRowArray();

        if ($row && !empty($row['channel_options'])) {
            return json_decode($row['channel_options'], true) ?? [];
        }
        return [];
    }

    /**
     * 刪除訊息及其結果
     */
    public function delete(int $id): bool
    {
        $this->db->table('message_results')->where('message_id', $id)->delete();
        return parent::delete($id);
    }
}
