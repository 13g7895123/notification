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
     * 嘗試啟動排程器
     */
    public function startScheduler()
    {
        $logFile = WRITEPATH . 'logs/scheduler_startup.log';
        // 使用 ROOTPATH 確保路徑正確，並透過 nohup 在背景執行
        $cmd = 'nohup php ' . ROOTPATH . 'spark task:scheduler > ' . $logFile . ' 2>&1 &';

        exec($cmd, $output, $returnVar);

        // 由於是用 nohup & 執行，returnVar 0 表示指令成功送出，不代表排程一定成功跑起來
        // 但通常這樣就夠了，詳細錯誤要看 log
        if ($returnVar === 0) {
            return $this->successResponse([
                'message' => '排程器啟動指令已發送',
                'command' => $cmd
            ]);
        } else {
            log_message('error', 'Scheduler start failed: ' . implode("\n", $output));
            return $this->fail('啟動失敗，請檢查 error log');
        }
    }
}
