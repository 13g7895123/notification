<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use App\Models\SystemSettingModel;

/**
 * SchedulerController - 排程器管理 API
 * 
 * 提供排程器狀態監控、日誌查詢、設定管理等功能
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
     */
    public function status(): ResponseInterface
    {
        $heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';
        $logFile = WRITEPATH . 'logs/scheduler.log';

        // 從系統設定讀取超時時間 (預設 150 秒)
        $heartbeatTimeout = $this->settingModel->get('scheduler.heartbeat_timeout', 150);
        $enabled = $this->settingModel->get('scheduler.enabled', true);

        $checks = [];
        $status = $enabled ? 'active' : 'disabled';
        $lastRun = null;
        $nextRun = null;

        // 1. 檢查排程器啟用狀態
        $checks[] = [
            'name' => 'Scheduler Configuration',
            'status' => $enabled ? 'ok' : 'warning',
            'message' => $enabled ? 'Enabled' : 'Disabled (Task execution skip)'
        ];

        // 2. 檢查心跳檔案
        if (file_exists($heartbeatFile)) {
            $lastRunTimestamp = (int) trim(file_get_contents($heartbeatFile));
            $now = time();
            $diff = $now - $lastRunTimestamp;

            $lastRun = date('c', $lastRunTimestamp);

            // 下次預計運行時間 (CI4 Tasks 預設每分鐘)
            $taskCheckInterval = $this->settingModel->get('scheduler.task_check_interval', 60);
            $nextRunTimestamp = $lastRunTimestamp + $taskCheckInterval;
            $nextRun = date('c', $nextRunTimestamp);

            if ($diff < $heartbeatTimeout) {
                // 如果已啟用且有心跳，狀態為 running
                if ($enabled) {
                    $status = 'running';
                }
                $checks[] = [
                    'name' => 'Scheduler Heartbeat',
                    'status' => 'ok',
                    'message' => "Last heartbeat {$diff}s ago"
                ];
            } else {
                $checks[] = [
                    'name' => 'Scheduler Heartbeat',
                    'status' => $enabled ? 'error' : 'warning',
                    'message' => "No heartbeat for {$diff}s (expected < {$heartbeatTimeout}s)"
                ];
            }
        } else {
            $checks[] = [
                'name' => 'Scheduler Heartbeat',
                'status' => $enabled ? 'error' : 'warning',
                'message' => 'Heartbeat file not found'
            ];
        }

        // 3. 檢查資料庫連線
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

        // 4. 檢查 Cron Daemon (透過 ps)
        $cronRunning = $this->checkProcessExistsByName('crond');
        $checks[] = [
            'name' => 'Cron Daemon',
            'status' => $cronRunning ? 'ok' : 'error',
            'message' => $cronRunning ? 'Running' : 'Not found in process list'
        ];

        // 5. 檢查待處理的排程訊息
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
                    'status' => $enabled ? 'warning' : 'ok',
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

        // 6. 檢查日誌檔案
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
            'lastRun' => $lastRun,
            'nextRun' => $nextRun,
            'enabled' => $enabled,
            'checks' => $checks
        ]);
    }

    /**
     * GET /api/scheduler/settings
     */
    public function getSettings(): ResponseInterface
    {
        $settings = [
            'enabled' => (bool)$this->settingModel->get('scheduler.enabled', true),
            'heartbeatInterval' => (int)$this->settingModel->get('scheduler.heartbeat_interval', 60),
            'taskCheckInterval' => (int)$this->settingModel->get('scheduler.task_check_interval', 60),
            'heartbeatTimeout' => (int)$this->settingModel->get('scheduler.heartbeat_timeout', 150),
            'logRetentionDays' => (int)$this->settingModel->get('scheduler.log_retention_days', 7),
        ];

        return $this->successResponse($settings);
    }

    /**
     * POST /api/scheduler/settings
     */
    public function updateSettings(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        $allowedKeys = [
            'enabled',
            'heartbeatInterval',
            'taskCheckInterval',
            'heartbeatTimeout',
            'logRetentionDays',
        ];

        foreach ($allowedKeys as $key) {
            if (isset($data[$key])) {
                $settingKey = 'scheduler.' . $this->camelToSnake($key);
                $this->settingModel->setSetting($settingKey, $data[$key]);
            }
        }

        log_message('info', 'Scheduler settings updated by user');

        return $this->successResponse([
            'message' => '設定已更新',
            'updatedAt' => date('c')
        ]);
    }

    /**
     * POST /api/scheduler/enable
     */
    public function enable(): ResponseInterface
    {
        $this->settingModel->setSetting('scheduler.enabled', true);
        log_message('info', 'Scheduler enabled by user');

        return $this->successResponse([
            'message' => '排程器已啟用',
            'enabledAt' => date('c')
        ]);
    }

    /**
     * POST /api/scheduler/disable
     */
    public function disable(): ResponseInterface
    {
        $this->settingModel->setSetting('scheduler.enabled', false);
        log_message('info', 'Scheduler disabled by user');

        return $this->successResponse([
            'message' => '排程器已停用',
            'disabledAt' => date('c')
        ]);
    }

    /**
     * POST /api/scheduler/run-now
     */
    public function runNow(): ResponseInterface
    {
        // 檢查是否啟用
        if (!$this->settingModel->get('scheduler.enabled', true)) {
            return $this->errorResponse('SCHEDULER_DISABLED', '排程器目前為停用狀態，請先啟用');
        }

        $cmd = 'php ' . ROOTPATH . 'spark tasks:process-messages > /dev/null 2>&1 &';
        exec($cmd, $output, $returnVar);

        if ($returnVar !== 0) {
            return $this->errorResponse('EXECUTION_FAILED', '執行失敗', 500);
        }

        log_message('info', 'Scheduler task manually triggered by user');

        return $this->successResponse([
            'message' => '排程任務已觸發',
            'triggeredAt' => date('c')
        ]);
    }

    /**
     * GET /api/scheduler/logs
     */
    public function logs(): ResponseInterface
    {
        $limit = (int) ($this->request->getGet('limit') ?? 50);
        $limit = min(max($limit, 1), 500);

        $logFile = WRITEPATH . 'logs/scheduler.log';

        if (!file_exists($logFile)) {
            return $this->successResponse([]);
        }

        $logs = $this->readLastLines($logFile, $limit);

        $parsedLogs = [];
        foreach ($logs as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (preg_match('/^\[([^\]]+)\] \[([^\]]+)\] (.+)$/', $line, $matches)) {
                $timestamp = $matches[1];
                $parsedTime = strtotime($timestamp);
                if ($parsedTime === false) $parsedTime = time();

                $parsedLogs[] = [
                    'timestamp' => date('c', $parsedTime),
                    'level' => $matches[2],
                    'message' => $matches[3]
                ];
            } else {
                $parsedLogs[] = [
                    'timestamp' => date('c'),
                    'level' => 'info',
                    'message' => $line
                ];
            }
        }

        return $this->successResponse(array_reverse($parsedLogs));
    }

    /**
     * 檢查進程是否存在
     */
    private function checkProcessExistsByName(string $name): bool
    {
        $output = shell_exec("ps aux | grep " . escapeshellarg($name) . " | grep -v grep");
        return !empty(trim($output));
    }

    private function readLastLines(string $filePath, int $lines): array
    {
        $output = shell_exec("tail -n {$lines} " . escapeshellarg($filePath));
        if ($output !== null) {
            return explode("\n", trim($output));
        }
        return [];
    }

    private function camelToSnake(string $input): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }
}
