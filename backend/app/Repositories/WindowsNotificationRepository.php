<?php

namespace App\Repositories;

/**
 * WindowsNotificationRepository - Windows 通知 Repository
 */
class WindowsNotificationRepository extends BaseRepository
{
    protected string $table = 'windows_notifications';

    /**
     * 建立通知
     */
    public function create(array $data): int
    {
        $now = date('Y-m-d H:i:s');
        $data['created_at'] = $now;
        $data['updated_at'] = $now;

        // 處理 metadata JSON
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = json_encode($data['metadata']);
        }

        $this->db->table($this->table)->insert($data);
        return $this->getInsertId();
    }

    /**
     * 更新通知
     */
    public function update(int $id, array $data): bool
    {
        $data['updated_at'] = date('Y-m-d H:i:s');

        // 處理 metadata JSON
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = json_encode($data['metadata']);
        }

        return $this->db->table($this->table)
            ->where('id', $id)
            ->update($data);
    }

    /**
     * 根據狀態取得通知
     */
    public function findByStatus(string $status, int $limit = 50): array
    {
        $results = $this->db->table($this->table)
            ->where('status', $status)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get()
            ->getResultArray();

        return array_map([$this, 'formatNotification'], $results);
    }

    /**
     * 取得待處理的通知 (pending + expired 超過時間的)
     */
    public function findPending(int $limit = 50): array
    {
        $results = $this->db->table($this->table)
            ->where('status', 'pending')
            ->orderBy('created_at', 'ASC')
            ->limit($limit)
            ->get()
            ->getResultArray();

        return array_map([$this, 'formatNotification'], $results);
    }

    /**
     * 分頁查詢
     */
    public function findPaginated(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $builder = $this->db->table($this->table);

        // 篩選狀態
        if (!empty($filters['status'])) {
            $builder->where('status', $filters['status']);
        }

        // 篩選類型
        if (!empty($filters['type'])) {
            $builder->where('type', $filters['type']);
        }

        // 篩選 repo
        if (!empty($filters['repo'])) {
            $builder->like('repo', $filters['repo']);
        }

        // 搜尋
        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('title', $filters['search'])
                ->orLike('message', $filters['search'])
                ->orLike('repo', $filters['search'])
                ->groupEnd();
        }

        // 總數
        $total = $builder->countAllResults(false);

        // 分頁
        $offset = ($page - 1) * $limit;
        $results = $builder
            ->orderBy('created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        return [
            'notifications' => array_map([$this, 'formatNotification'], $results),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 更新狀態
     */
    public function updateStatus(int $id, string $status): bool
    {
        $data = [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        // 根據狀態設定時間戳記
        if ($status === 'delivered') {
            $data['delivered_at'] = date('Y-m-d H:i:s');
        } elseif ($status === 'read') {
            $data['read_at'] = date('Y-m-d H:i:s');
        }

        return $this->db->table($this->table)
            ->where('id', $id)
            ->update($data);
    }

    /**
     * 將過期的 pending 通知標記為 expired
     */
    public function markExpired(int $hoursOld = 24): int
    {
        $expireTime = date('Y-m-d H:i:s', strtotime("-{$hoursOld} hours"));

        // 先計算符合條件的數量
        $count = $this->db->table($this->table)
            ->where('status', 'pending')
            ->where('created_at <', $expireTime)
            ->countAllResults(false);

        // 執行更新
        $this->db->table($this->table)
            ->where('status', 'pending')
            ->where('created_at <', $expireTime)
            ->update([
                'status' => 'expired',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $count;
    }

    /**
     * 取得統計資料
     */
    public function getStats(): array
    {
        $total = $this->count();
        $pending = $this->count(['status' => 'pending']);
        $delivered = $this->count(['status' => 'delivered']);
        $read = $this->count(['status' => 'read']);
        $dismissed = $this->count(['status' => 'dismissed']);
        $expired = $this->count(['status' => 'expired']);

        // 今日統計
        $today = date('Y-m-d');
        $todayCount = $this->db->table($this->table)
            ->where('DATE(created_at)', $today)
            ->countAllResults();

        // 最近 7 天趨勢
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $count = $this->db->table($this->table)
                ->where('DATE(created_at)', $date)
                ->countAllResults();
            $trends[] = [
                'date' => $date,
                'count' => $count,
            ];
        }

        return [
            'total' => $total,
            'pending' => $pending,
            'delivered' => $delivered,
            'read' => $read,
            'dismissed' => $dismissed,
            'expired' => $expired,
            'today' => $todayCount,
            'trends' => $trends,
        ];
    }

    /**
     * 格式化通知資料
     */
    private function formatNotification(array $notification): array
    {
        // 解析 metadata JSON
        if (isset($notification['metadata'])) {
            $notification['metadata'] = json_decode($notification['metadata'], true);
        }

        return $notification;
    }
}
