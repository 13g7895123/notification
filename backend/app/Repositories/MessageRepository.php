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
    public function find(string $id): ?MessageEntity
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
        $id = $this->generateUuid();
        $now = date('Y-m-d H:i:s');

        $messageData = [
            'id' => $id,
            'title' => $data['title'],
            'content' => $data['content'],
            'status' => $data['status'] ?? MessageEntity::STATUS_PENDING,
            'channel_ids' => json_encode($data['channelIds']),
            'scheduled_at' => $data['scheduledAt'] ?? null,
            'created_at' => $now,
            'user_id' => $data['userId'],
        ];

        $this->db->table($this->table)->insert($messageData);

        return new MessageEntity($messageData);
    }

    /**
     * 更新訊息狀態
     */
    public function updateStatus(string $id, string $status, ?string $sentAt = null): bool
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
    public function addResult(string $messageId, string $channelId, bool $success, ?string $error = null): void
    {
        $this->db->table('message_results')->insert([
            'id' => $this->generateUuid(),
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
    public function getResults(string $messageId): array
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
     * 刪除訊息及其結果
     */
    public function delete(string $id): bool
    {
        $this->db->table('message_results')->where('message_id', $id)->delete();
        return parent::delete($id);
    }
}
