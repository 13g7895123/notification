<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use App\Models\SystemSettingModel;

/**
 * SchedulerController - 排程器管理 API
 * 
 * 提供排程器狀態監控、日誌查詢等功能
 */
class SchedulerController extends BaseController
{
    private SystemSettingModel $settingModel;

    public function __construct()
    {
        $this->settingModel = new SystemSettingModel();
    }

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

        // 從系統設定讀取超時時間
        $heartbeatTimeout = $this->settingModel->get('scheduler.heartbeat_timeout', 150);

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
            
            // 從系統設定讀取任務檢查間隔
            $taskCheckInterval = $this->settingModel->get('scheduler.task_check_interval', 60);
            $nextRunTimestamp = $lastRunTimestamp + $taskCheckInterval;
            $nextRun = date('c', $nextRunTimestamp);

            if ($diff < $heartbeatTimeout) {
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
                    'message' => "No heartbeat for {$diff}s (expected < {$heartbeatTimeout}s)"
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

            // 嘗試解析標準格式: [2024-12-25 12:00:00] [info] message
            if (preg_match('/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/', $line, $matches)) {
                $timestamp = $matches[1];
                // 驗證並轉換時間戳
                $parsedTime = strtotime($timestamp);
                if ($parsedTime === false) {
                    $parsedTime = time();
                }
                
                $parsedLogs[] = [
                    'timestamp' => date('c', $parsedTime),
                    'level' => $matches[2],
                    'message' => $matches[3],
                    'context' => null
                ];
            } else {
                // 無法解析的行，使用當前時間並顯示原始內容
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
     * POST /api/scheduler/stop
     * 
     * 停止排程器守護進程
     * 僅限管理員存取
     */
    public function stop(): ResponseInterface
    {
        $pidFile = WRITEPATH . 'pids/scheduler.pid';

        // 檢查 PID 檔案是否存在
        if (!file_exists($pidFile)) {
            return $this->failResponse('排程器未運行', 400);
        }

        $pid = (int) trim(file_get_contents($pidFile));

        // 檢查進程是否存在
        if (!$this->checkProcessExists($pid)) {
            // PID 檔案存在但進程不存在，清理 PID 檔案
            @unlink($pidFile);
            return $this->failResponse('排程器進程不存在', 400);
        }

        // 發送 SIGTERM 信號
        $stopped = false;
        if (function_exists('posix_kill')) {
            // SIGTERM = 15
            $stopped = @posix_kill($pid, defined('SIGTERM') ? SIGTERM : 15);
        } else {
            // 使用 kill 命令（適用於 Docker）
            exec("kill -TERM {$pid} 2>&1", $output, $returnVar);
            $stopped = ($returnVar === 0);
        }

        if (!$stopped) {
            return $this->failResponse('無法停止排程器', 500);
        }

        // 等待進程結束（最多 10 秒）
        $maxWait = 10;
        $waited = 0;
        while ($waited < $maxWait) {
            if (!$this->checkProcessExists($pid)) {
                break;
            }
            sleep(1);
            $waited++;
        }

        // 如果還沒結束，強制終止
        if ($this->checkProcessExists($pid)) {
            if (function_exists('posix_kill')) {
                // SIGKILL = 9
                @posix_kill($pid, defined('SIGKILL') ? SIGKILL : 9);
            } else {
                exec("kill -KILL {$pid} 2>&1");
            }
            sleep(1);
        }

        // 清理 PID 檔案
        @unlink($pidFile);

        // 記錄操作日誌
        log_message('info', "Scheduler stopped by user, PID: {$pid}");

        return $this->successResponse([
            'message' => '排程器已停止',
            'pid' => $pid,
            'stoppedAt' => date('c')
        ]);
    }

    /**
     * POST /api/scheduler/start
     * 
     * 啟動排程器守護進程
     * 僅限管理員存取
     */
    public function start(): ResponseInterface
    {
        $pidFile = WRITEPATH . 'pids/scheduler.pid';
        $logFile = WRITEPATH . 'logs/scheduler_startup.log';

        // 檢查是否已在運行
        if (file_exists($pidFile)) {
            $pid = (int) trim(file_get_contents($pidFile));
            if ($this->checkProcessExists($pid)) {
                return $this->successResponse([
                    'message' => '排程器已在運行中',
                    'pid' => $pid,
                    'status' => 'already_running'
                ]);
            } else {
                // PID 檔案存在但進程不存在，清理舊檔案
                @unlink($pidFile);
            }
        }

        // 啟動排程器
        $cmd = 'nohup php ' . ROOTPATH . 'spark scheduler:daemon > ' . $logFile . ' 2>&1 &';
        exec($cmd, $output, $returnVar);

        if ($returnVar !== 0) {
            log_message('error', 'Scheduler start failed: ' . implode("\n", $output));
            return $this->failResponse('啟動失敗，請檢查日誌', 500);
        }

        // 等待 PID 檔案生成（最多 5 秒）
        $maxWait = 5;
        $waited = 0;
        $newPid = null;

        while ($waited < $maxWait) {
            if (file_exists($pidFile)) {
                $newPid = (int) trim(file_get_contents($pidFile));
                if ($this->checkProcessExists($newPid)) {
                    break;
                }
            }
            sleep(1);
            $waited++;
        }

        if (!$newPid || !$this->checkProcessExists($newPid)) {
            return $this->failResponse('排程器啟動失敗，請檢查日誌', 500);
        }

        // 記錄操作日誌
        log_message('info', "Scheduler started by user, PID: {$newPid}");

        return $this->successResponse([
            'message' => '排程器已啟動',
            'pid' => $newPid,
            'startedAt' => date('c')
        ]);
    }

    /**
     * POST /api/scheduler/restart
     * 
     * 重啟排程器守護進程
     * 僅限管理員存取
     */
    public function restart(): ResponseInterface
    {
        $pidFile = WRITEPATH . 'pids/scheduler.pid';
        $oldPid = null;

        // 如果正在運行，先停止
        if (file_exists($pidFile)) {
            $oldPid = (int) trim(file_get_contents($pidFile));
            
            if ($this->checkProcessExists($oldPid)) {
                // 停止排程器
                $stopResult = $this->stop();
                $stopData = json_decode($stopResult->getBody(), true);
                
                if (!$stopData['success']) {
                    return $this->failResponse('停止排程器失敗', 500);
                }
                
                // 等待 2 秒確保完全停止
                sleep(2);
            } else {
                // PID 檔案存在但進程不存在，清理
                @unlink($pidFile);
            }
        }

        // 啟動排程器
        $startResult = $this->start();
        $startData = json_decode($startResult->getBody(), true);

        if (!$startData['success']) {
            return $this->failResponse('啟動排程器失敗', 500);
        }

        // 記錄操作日誌
        log_message('info', "Scheduler restarted by user, old PID: {$oldPid}, new PID: {$startData['data']['pid']}");

        return $this->successResponse([
            'message' => '排程器已重啟',
            'oldPid' => $oldPid,
            'newPid' => $startData['data']['pid'],
            'restartedAt' => date('c')
        ]);
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
