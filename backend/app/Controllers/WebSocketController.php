<?php

namespace App\Controllers;

/**
 * WebSocketController - WebSocket 連線追蹤 API
 */
class WebSocketController extends BaseController
{
    /**
     * GET /api/websocket/connections
     * 取得 WebSocket 連線列表
     */
    public function connections()
    {
        $status = $this->request->getGet('status');
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 50);
        $offset = ($page - 1) * $limit;

        $builder = $this->db->table('websocket_connections');

        // 篩選狀態
        if ($status && in_array($status, ['connected', 'disconnected', 'error'])) {
            $builder->where('status', $status);
        }

        // 總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $connections = $builder
            ->orderBy('connected_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        $formattedConnections = array_map(function ($conn) {
            return [
                'id' => $conn['id'],
                'connectionId' => $conn['connection_id'],
                'ipAddress' => $conn['ip_address'],
                'userAgent' => $conn['user_agent'],
                'status' => $conn['status'],
                'connectedAt' => $conn['connected_at'],
                'disconnectedAt' => $conn['disconnected_at'],
                'lastPingAt' => $conn['last_ping_at'],
                'messagesReceived' => (int) $conn['messages_received'],
                'messagesSent' => (int) $conn['messages_sent'],
                'errorCount' => (int) $conn['error_count'],
                'lastError' => $conn['last_error'],
                'metadata' => $conn['metadata'] ? json_decode($conn['metadata'], true) : null,
            ];
        }, $connections);

        return $this->successResponse([
            'connections' => $formattedConnections,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    /**
     * GET /api/websocket/stats
     * 取得 WebSocket 統計資訊
     */
    public function stats()
    {
        // 目前連線數
        $activeConnections = $this->db->table('websocket_connections')
            ->where('status', 'connected')
            ->countAllResults();

        // 總連線數
        $totalConnections = $this->db->table('websocket_connections')
            ->countAllResults();

        // 錯誤連線數
        $errorConnections = $this->db->table('websocket_connections')
            ->where('status', 'error')
            ->orWhere('error_count >', 0)
            ->countAllResults();

        // 今日連線數
        $todayConnections = $this->db->table('websocket_connections')
            ->where('DATE(connected_at)', date('Y-m-d'))
            ->countAllResults();

        // 平均連線時長（分鐘）
        $avgDuration = $this->db->query("
            SELECT AVG(TIMESTAMPDIFF(MINUTE, connected_at, COALESCE(disconnected_at, NOW()))) as avg_duration
            FROM websocket_connections
            WHERE status = 'disconnected'
        ")->getRowArray();

        // 每日連線趨勢（最近 7 天）
        $dailyTrends = $this->db->query("
            SELECT 
                DATE(connected_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'error' OR error_count > 0 THEN 1 ELSE 0 END) as errors
            FROM websocket_connections
            WHERE connected_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(connected_at)
            ORDER BY date ASC
        ")->getResultArray();

        // 訊息統計
        $messageStats = $this->db->query("
            SELECT 
                SUM(messages_sent) as total_sent,
                SUM(messages_received) as total_received,
                AVG(messages_sent) as avg_sent_per_connection,
                AVG(messages_received) as avg_received_per_connection
            FROM websocket_connections
        ")->getRowArray();

        // 最近錯誤
        $recentErrors = $this->db->table('websocket_connections')
            ->select('connection_id, ip_address, last_error, error_count, connected_at')
            ->where('last_error IS NOT NULL')
            ->orderBy('connected_at', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        return $this->successResponse([
            'activeConnections' => $activeConnections,
            'totalConnections' => $totalConnections,
            'errorConnections' => $errorConnections,
            'todayConnections' => $todayConnections,
            'avgConnectionDuration' => round($avgDuration['avg_duration'] ?? 0, 2),
            'dailyTrends' => array_map(function ($trend) {
                return [
                    'date' => $trend['date'],
                    'count' => (int) $trend['count'],
                    'active' => (int) $trend['active'],
                    'errors' => (int) $trend['errors'],
                ];
            }, $dailyTrends),
            'messageStats' => [
                'totalSent' => (int) ($messageStats['total_sent'] ?? 0),
                'totalReceived' => (int) ($messageStats['total_received'] ?? 0),
                'avgSentPerConnection' => round($messageStats['avg_sent_per_connection'] ?? 0, 2),
                'avgReceivedPerConnection' => round($messageStats['avg_received_per_connection'] ?? 0, 2),
            ],
            'recentErrors' => array_map(function ($error) {
                return [
                    'connectionId' => $error['connection_id'],
                    'ipAddress' => $error['ip_address'],
                    'error' => $error['last_error'],
                    'errorCount' => (int) $error['error_count'],
                    'connectedAt' => $error['connected_at'],
                ];
            }, $recentErrors),
        ]);
    }
}
