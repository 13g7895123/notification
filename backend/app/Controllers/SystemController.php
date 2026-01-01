<?php

namespace App\Controllers;

/**
 * SystemController - 系統狀態檢查 API
 */
class SystemController extends BaseController
{
    /**
     * GET /api/system/status
     * 
     * 檢查排程器運行狀態
     */
    public function status()
    {
        $heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';
        $status = [
            'scheduler_running' => false,
            'last_heartbeat' => null,
            'heartbeat_diff' => null,
            'server_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get(),
        ];

        if (file_exists($heartbeatFile)) {
            $lastRun = (int) trim(file_get_contents($heartbeatFile));
            $now = time();
            $diff = $now - $lastRun;

            $status['last_heartbeat'] = date('Y-m-d H:i:s', $lastRun);
            $status['heartbeat_diff'] = $diff;

            // 如果心跳在 150 秒內（考量到任務執行時間與 sleep 60s），判定為運行中
            if ($diff < 150) {
                $status['scheduler_running'] = true;
            }
        }

        return $this->successResponse($status);
    }

    /**
     * POST /api/system/scheduler/start
     * 
     * 嘗試啟動排程器守護進程
     */
    public function startScheduler()
    {
        $logFile = WRITEPATH . 'logs/scheduler_startup.log';
        $pidFile = WRITEPATH . 'pids/scheduler.pid';

        // 檢查是否已在運行
        if (file_exists($pidFile)) {
            $pid = (int) trim(file_get_contents($pidFile));
            if (file_exists("/proc/{$pid}")) {
                return $this->successResponse([
                    'message' => '排程器已在運行中',
                    'pid' => $pid,
                    'status' => 'already_running'
                ]);
            }
        }

        // 使用新的 scheduler:daemon 命令
        $cmd = 'nohup php ' . ROOTPATH . 'spark scheduler:daemon > ' . $logFile . ' 2>&1 &';

        exec($cmd, $output, $returnVar);

        // 由於是用 nohup & 執行，returnVar 0 表示指令成功送出
        if ($returnVar === 0) {
            return $this->successResponse([
                'message' => '排程器啟動指令已發送',
                'command' => 'scheduler:daemon',
                'log_file' => $logFile
            ]);
        } else {
            log_message('error', 'Scheduler start failed: ' . implode("\n", $output));
            return $this->fail('啟動失敗，請檢查 error log');
        }
    }
}
