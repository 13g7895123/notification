<?php

namespace App\Controllers;

/**
 * StatsController - 統計數據 API
 */
class StatsController extends BaseController
{
    /**
     * GET /api/stats/dashboard
     * 取得儀表板統計數據
     */
    public function dashboard()
    {
        // 訊息統計
        $messageStats = $this->db->table('message_results')
            ->select('COUNT(*) as total, SUM(success) as success_count')
            ->get()
            ->getRowArray();

        $totalSent = (int) ($messageStats['total'] ?? 0);
        $totalSuccess = (int) ($messageStats['success_count'] ?? 0);
        $totalFailed = $totalSent - $totalSuccess;
        $successRate = $totalSent > 0 ? round(($totalSuccess / $totalSent) * 100, 1) : 0;

        // 渠道統計
        $channelStats = $this->db->table('channels')
            ->select('COUNT(*) as total, SUM(enabled) as active')
            ->get()
            ->getRowArray();

        $totalChannels = (int) ($channelStats['total'] ?? 0);
        $activeChannels = (int) ($channelStats['active'] ?? 0);

        // 最近訊息
        $recentMessages = $this->db->table('messages')
            ->select('id, title, status, created_at')
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

        // 最近發送紀錄
        $recentLogs = $this->db->table('message_results mr')
            ->select('mr.id, c.name as channel_name, m.title, mr.success, mr.sent_at')
            ->join('channels c', 'c.id = mr.channel_id', 'left')
            ->join('messages m', 'm.id = mr.message_id', 'left')
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

        // 趨勢數據（過去 7 天）
        $trendData = $this->db->table('message_results')
            ->select("DATE(sent_at) as date, COUNT(*) as sent, SUM(success) as success, SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed")
            ->where('sent_at >=', date('Y-m-d', strtotime('-7 days')))
            ->groupBy('DATE(sent_at)')
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
