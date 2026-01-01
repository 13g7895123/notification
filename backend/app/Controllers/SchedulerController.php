<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * SchedulerController - 排程器管理 API
 * 
 * 提供排程器狀態監控、日誌查詢等功能
 */
class SchedulerController extends BaseController
{
    /**
     * GET /api/scheduler/status
     * 
     * 取得排程器當前狀態與健康檢查結果
     * 僅限管理員存取
     */
    public function status(): ResponseInterface
    {
        $heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';
        $pidFile = WRITEPATH . 'pids/scheduler.pid';
        $logFile = WRITEPATH . 'logs/scheduler.log';

        $checks = [];
        $status = 'stopped';
        $lastRun = null;
        $nextRun = null;
        $daemonStatus = 'inactive';

        // 1. 檢查心跳檔案
        if (file_exists($heartbeatFile)) {
            $lastRunTimestamp = (int) trim(file_get_contents($heartbeatFile));
            $now = time();
            $diff = $now - $lastRunTimestamp;

            $lastRun = date('c', $lastRunTimestamp);
            
            // 預估下次執行時間（心跳間隔約 60 秒）
            $nextRunTimestamp = $lastRunTimestamp + 60;
            $nextRun = date('c', $nextRunTimestamp);

            if ($diff < 150) {
                $status = 'running';
                $daemonStatus = 'active';
                $checks[] = [
                    'name' => 'Scheduler Heartbeat',
                    'status' => 'ok',
                    'message' => "Last heartbeat {$diff}s ago"
                ];
            } else {
                $checks[] = [
                    'name' => 'Scheduler Heartbeat',
                    'status' => 'error',
                    'message' => "No heartbeat for {$diff}s (expected < 150s)"
                ];
            }
        } else {
            $checks[] = [
                'name' => 'Scheduler Heartbeat',
                'status' => 'error',
                'message' => 'Heartbeat file not found'
            ];
        }

        // 2. 檢查資料庫連線
        try {
            $db = \Config\Database::connect();
            $db->query('SELECT 1');
            $checks[] = [
                'name' => 'Database Connection',
                'status' => 'ok',
                'message' => 'Connected'
            ];
        } catch (\Exception $e) {
            $checks[] = [
                'name' => 'Database Connection',
                'status' => 'error',
                'message' => 'Connection failed: ' . $e->getMessage()
            ];
        }

        // 3. 檢查 PID 檔案與進程狀態
        if (file_exists($pidFile)) {
            $pid = (int) trim(file_get_contents($pidFile));
            
            // 在 Docker 環境中檢查進程
            $processExists = $this->checkProcessExists($pid);
            
            if ($processExists) {
                $checks[] = [
                    'name' => 'Daemon Process',
                    'status' => 'ok',
                    'message' => "Running (PID: {$pid})"
                ];
            } else {
                $checks[] = [
                    'name' => 'Daemon Process',
                    'status' => 'warning',
                    'message' => "PID file exists but process not found (PID: {$pid})"
                ];
            }
        } else {
            $checks[] = [
                'name' => 'Daemon Process',
                'status' => 'warning',
                'message' => 'PID file not found'
            ];
        }

        // 4. 檢查待處理的排程訊息
        try {
            $db = \Config\Database::connect();
            $scheduledCount = $db->table('messages')
                ->where('status', 'scheduled')
                ->countAllResults();

            $readyCount = $db->table('messages')
                ->where('status', 'scheduled')
                ->where('scheduled_at <=', date('Y-m-d H:i:s'))
                ->countAllResults();

            if ($readyCount > 0) {
                $checks[] = [
                    'name' => 'Scheduled Messages',
                    'status' => 'warning',
                    'message' => "{$readyCount} messages ready to send (total: {$scheduledCount})"
                ];
            } else {
                $checks[] = [
                    'name' => 'Scheduled Messages',
                    'status' => 'ok',
                    'message' => "{$scheduledCount} scheduled messages pending"
                ];
            }
        } catch (\Exception $e) {
            $checks[] = [
                'name' => 'Scheduled Messages',
                'status' => 'error',
                'message' => 'Query failed: ' . $e->getMessage()
            ];
        }

        // 5. 檢查日誌檔案
        if (file_exists($logFile)) {
            $fileSize = filesize($logFile);
            $fileSizeMB = round($fileSize / 1024 / 1024, 2);
            
            $checks[] = [
                'name' => 'Log File',
                'status' => $fileSizeMB > 50 ? 'warning' : 'ok',
                'message' => "Log file size: {$fileSizeMB} MB" . ($fileSizeMB > 50 ? ' (consider rotation)' : '')
            ];
        } else {
            $checks[] = [
                'name' => 'Log File',
                'status' => 'warning',
                'message' => 'Log file not found'
            ];
        }

        return $this->successResponse([
            'status' => $status,
            'lastRun' => $lastRun ?? date('c', time() - 3600), // 如果沒有，顯示 1 小時前
            'nextRun' => $nextRun ?? date('c', time() + 60),    // 預估 1 分鐘後
            'daemonStatus' => $daemonStatus,
            'checks' => $checks
        ]);
    }

    /**
     * GET /api/scheduler/logs
     * 
     * 取得排程器執行日誌
     * 僅限管理員存取
     */
    public function logs(): ResponseInterface
    {
        $limit = (int) ($this->request->getGet('limit') ?? 50);
        $limit = min(max($limit, 1), 500); // 限制在 1-500 之間

        $logFile = WRITEPATH . 'logs/scheduler.log';

        if (!file_exists($logFile)) {
            return $this->successResponse([]);
        }

        // 讀取日誌檔案的最後 N 行
        $logs = $this->readLastLines($logFile, $limit);

        // 解析日誌格式: [2024-12-25 12:00:00] [info] message
        $parsedLogs = [];
        foreach ($logs as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // 使用正則表達式解析日誌
            if (preg_match('/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/', $line, $matches)) {
                $parsedLogs[] = [
                    'timestamp' => date('c', strtotime($matches[1])),
                    'level' => $matches[2],
                    'message' => $matches[3],
                    'context' => null
                ];
            } else {
                // 無法解析的行，作為普通訊息
                $parsedLogs[] = [
                    'timestamp' => date('c'),
                    'level' => 'info',
                    'message' => $line,
                    'context' => null
                ];
            }
        }

        // 反轉陣列，使最新的日誌在前面
        $parsedLogs = array_reverse($parsedLogs);

        return $this->successResponse($parsedLogs);
    }

    /**
     * 檢查進程是否存在（適用於 Docker 環境）
     */
    private function checkProcessExists(int $pid): bool
    {
        // 方法 1: 使用 /proc 檔案系統（Linux）
        if (file_exists("/proc/{$pid}")) {
            return true;
        }

        // 方法 2: 使用 ps 命令（適用於 Docker）
        $output = shell_exec("ps -p {$pid} -o pid= 2>/dev/null");
        if (!empty(trim($output))) {
            return true;
        }

        // 方法 3: 使用 posix_kill（如果可用）
        if (function_exists('posix_kill')) {
            return @posix_kill($pid, 0);
        }

        return false;
    }

    /**
     * 讀取檔案的最後 N 行
     */
    private function readLastLines(string $filePath, int $lines): array
    {
        // 使用 tail 命令（在 Docker 環境中通常可用）
        $output = shell_exec("tail -n {$lines} " . escapeshellarg($filePath));
        
        if ($output !== null) {
            return explode("\n", trim($output));
        }

        // 備用方案：使用 PHP 讀取
        $file = new \SplFileObject($filePath, 'r');
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();
        
        $startLine = max(0, $lastLine - $lines);
        $result = [];
        
        $file->seek($startLine);
        while (!$file->eof()) {
            $line = $file->current();
            if ($line !== false) {
                $result[] = $line;
            }
            $file->next();
        }
        
        return $result;
    }
}
