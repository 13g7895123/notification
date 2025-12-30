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
}
