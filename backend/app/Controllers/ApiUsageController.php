<?php

namespace App\Controllers;

/**
 * ApiUsageController - API 使用紀錄 API
 */
class ApiUsageController extends BaseController
{
    /**
     * GET /api/api-usage/logs
     * 取得 API 使用紀錄
     */
    public function logs()
    {
        $apiKeyId = $this->request->getGet('apiKeyId');
        $status = $this->request->getGet('status');
        $startDate = $this->request->getGet('startDate');
        $endDate = $this->request->getGet('endDate');
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);
        $offset = ($page - 1) * $limit;

        $builder = $this->db->table('api_usage_logs l')
            ->select('l.*, k.name as api_key_name')
            ->join('api_keys k', 'k.id = l.api_key_id', 'left');

        // 篩選金鑰
        if ($apiKeyId) {
            $builder->where('l.api_key_id', $apiKeyId);
        }

        // 篩選狀態
        if ($status === 'success') {
            $builder->where('l.success', 1);
        } elseif ($status === 'failed') {
            $builder->where('l.success', 0);
        }

        // 日期範圍
        if ($startDate) {
            $builder->where('l.created_at >=', $startDate);
        }
        if ($endDate) {
            $builder->where('l.created_at <=', $endDate . ' 23:59:59');
        }

        // 總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $logs = $builder
            ->orderBy('l.created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        $formattedLogs = array_map(function ($log) {
            return [
                'id' => $log['id'],
                'apiKeyId' => $log['api_key_id'],
                'apiKeyName' => $log['api_key_name'],
                'endpoint' => $log['endpoint'],
                'method' => $log['method'],
                'statusCode' => (int) $log['status_code'],
                'success' => (bool) $log['success'],
                'responseTime' => (int) $log['response_time'],
                'ipAddress' => $log['ip'],
                'userAgent' => $log['user_agent'],
                'requestBody' => $log['request_body'] ? json_decode($log['request_body'], true) : null,
                'responseBody' => isset($log['response_body']) && $log['response_body'] ? json_decode($log['response_body'], true) : null,
                'errorMessage' => $log['error_message'],
                'createdAt' => $log['created_at'],
            ];
        }, $logs);

        return $this->successResponse([
            'logs' => $formattedLogs,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    /**
     * GET /api/api-usage/stats
     * 取得 API 使用統計
     */
    public function stats()
    {
        $period = $this->request->getGet('period') ?? 'week';

        // 根據週期計算開始日期
        $startDate = match ($period) {
            'day' => date('Y-m-d'),
            'week' => date('Y-m-d', strtotime('-7 days')),
            'month' => date('Y-m-d', strtotime('-30 days')),
            default => date('Y-m-d', strtotime('-7 days')),
        };

        // 總請求數
        $totalStats = $this->db->table('api_usage_logs')
            ->select('COUNT(*) as total, SUM(success) as success_count, AVG(response_time) as avg_response_time')
            ->where('created_at >=', $startDate)
            ->get()
            ->getRowArray();

        $totalRequests = (int) ($totalStats['total'] ?? 0);
        $successCount = (int) ($totalStats['success_count'] ?? 0);
        $failedCount = $totalRequests - $successCount;
        $successRate = $totalRequests > 0 ? round(($successCount / $totalRequests) * 100, 1) : 0;
        $avgResponseTime = (int) ($totalStats['avg_response_time'] ?? 0);

        // Endpoint 統計
        $endpointStats = $this->db->table('api_usage_logs')
            ->select('endpoint, COUNT(*) as count, AVG(response_time) as avg_response_time')
            ->where('created_at >=', $startDate)
            ->groupBy('endpoint')
            ->orderBy('count', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $endpointData = array_map(function ($stat) {
            return [
                'endpoint' => $stat['endpoint'],
                'count' => (int) $stat['count'],
                'avgResponseTime' => (int) ($stat['avg_response_time'] ?? 0),
            ];
        }, $endpointStats);

        // 每日統計
        $dailyStats = $this->db->table('api_usage_logs')
            ->select("DATE(created_at) as date, COUNT(*) as count, SUM(success) as success, SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed")
            ->where('created_at >=', $startDate)
            ->groupBy('DATE(created_at)')
            ->orderBy('date', 'ASC')
            ->limit(30)
            ->get()
            ->getResultArray();

        $dailyData = array_map(function ($stat) {
            return [
                'date' => $stat['date'],
                'count' => (int) $stat['count'],
                'success' => (int) $stat['success'],
                'failed' => (int) $stat['failed'],
            ];
        }, $dailyStats);

        // 返回欄位名稱要與前端 ApiStats interface 一致
        return $this->successResponse([
            'totalRequests' => $totalRequests,
            'successfulRequests' => $successCount,
            'failedRequests' => $failedCount,
            'successRate' => $successRate,
            'avgResponseTime' => $avgResponseTime,
            'requestsByEndpoint' => $endpointData,
            'requestsByDay' => $dailyData,
        ]);
    }
}
