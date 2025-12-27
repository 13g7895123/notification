<?php

namespace App\Controllers;

/**
 * StatsController - 統計數據 API
 */
class StatsController extends BaseController
{
    /**
     * GET /api/stats/dashboard
     * 取得儀表板統計數據（使用者隔離）
     */
    public function dashboard()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $userId = (int) $user['id'];

        // 訊息統計（只統計使用者自己的訊息）
        $messageStats = $this->db->table('message_results mr')
            ->select('COUNT(*) as total, SUM(mr.success) as success_count')
            ->join('messages m', 'm.id = mr.message_id')
            ->where('m.user_id', $userId)
            ->get()
            ->getRowArray();

        $totalSent = (int) ($messageStats['total'] ?? 0);
        $totalSuccess = (int) ($messageStats['success_count'] ?? 0);
        $totalFailed = $totalSent - $totalSuccess;
        $successRate = $totalSent > 0 ? round(($totalSuccess / $totalSent) * 100, 1) : 0;

        // 渠道統計（只統計使用者自己的渠道）
        $channelStats = $this->db->table('channels')
            ->select('COUNT(*) as total, SUM(enabled) as active')
            ->where('user_id', $userId)
            ->get()
            ->getRowArray();

        $totalChannels = (int) ($channelStats['total'] ?? 0);
        $activeChannels = (int) ($channelStats['active'] ?? 0);

        // 最近訊息（只顯示使用者自己的訊息）
        $recentMessages = $this->db->table('messages')
            ->select('id, title, status, created_at')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();

        $formattedMessages = array_map(function ($msg) {
            return [
                'id' => $msg['id'],
                'title' => $msg['title'],
                'status' => $msg['status'],
                'createdAt' => $msg['created_at'],
            ];
        }, $recentMessages);

        // 最近發送紀錄（只顯示使用者自己的訊息結果）
        $recentLogs = $this->db->table('message_results mr')
            ->select('mr.id, c.name as channel_name, m.title, mr.success, mr.sent_at')
            ->join('channels c', 'c.id = mr.channel_id', 'left')
            ->join('messages m', 'm.id = mr.message_id', 'left')
            ->where('m.user_id', $userId)
            ->orderBy('mr.sent_at', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $formattedLogs = array_map(function ($log) {
            return [
                'id' => $log['id'],
                'channelName' => $log['channel_name'],
                'title' => $log['title'],
                'status' => $log['success'] ? 'success' : 'failed',
                'sentAt' => $log['sent_at'],
            ];
        }, $recentLogs);

        // 趨勢數據（過去 7 天，只顯示使用者自己的數據）
        $trendData = $this->db->table('message_results mr')
            ->select("DATE(mr.sent_at) as date, COUNT(*) as sent, SUM(mr.success) as success, SUM(CASE WHEN mr.success = 0 THEN 1 ELSE 0 END) as failed")
            ->join('messages m', 'm.id = mr.message_id')
            ->where('m.user_id', $userId)
            ->where('mr.sent_at >=', date('Y-m-d', strtotime('-7 days')))
            ->groupBy('DATE(mr.sent_at)')
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();

        $formattedTrend = array_map(function ($trend) {
            return [
                'date' => $trend['date'],
                'sent' => (int) $trend['sent'],
                'success' => (int) $trend['success'],
                'failed' => (int) $trend['failed'],
            ];
        }, $trendData);

        return $this->successResponse([
            'totalSent' => $totalSent,
            'totalSuccess' => $totalSuccess,
            'totalFailed' => $totalFailed,
            'successRate' => $successRate,
            'totalChannels' => $totalChannels,
            'activeChannels' => $activeChannels,
            'recentMessages' => $formattedMessages,
            'recentLogs' => $formattedLogs,
            'trendData' => $formattedTrend,
        ]);
    }
}
