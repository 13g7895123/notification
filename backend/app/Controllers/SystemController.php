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
     * GET /api/system/websocket/status
     * 
     * 檢查 WebSocket 服務運行狀態
     */
    public function websocketStatus()
    {
        $wsPort = getenv('WEBSOCKET_PORT') ?: '8080';
        $internalPort = '8081';
        
        $status = [
            'service_running' => false,
            'websocket_port' => $wsPort,
            'internal_port' => $internalPort,
            'websocket_port_listening' => false,
            'internal_port_listening' => false,
            'pid' => null,
            'process_info' => null,
            'active_connections' => 0,
            'total_connections' => 0,
            'server_time' => date('Y-m-d H:i:s'),
        ];

        // 檢查 WebSocket 端口是否在監聽
        $wsPortCheck = $this->checkPortListening($wsPort);
        $status['websocket_port_listening'] = $wsPortCheck['listening'];
        if ($wsPortCheck['pid']) {
            $status['pid'] = $wsPortCheck['pid'];
        }

        // 檢查內部推送端口
        $internalPortCheck = $this->checkPortListening($internalPort);
        $status['internal_port_listening'] = $internalPortCheck['listening'];

        // 檢查進程是否存在
        $processInfo = $this->getWebSocketProcessInfo();
        if ($processInfo) {
            $status['service_running'] = true;
            $status['process_info'] = $processInfo;
            if (!$status['pid'] && isset($processInfo['pid'])) {
                $status['pid'] = $processInfo['pid'];
            }
        }

        // 從數據庫獲取連線統計
        try {
            $db = \Config\Database::connect();
            
            $activeConnections = $db->table('websocket_connections')
                ->where('status', 'connected')
                ->countAllResults();
            
            $totalConnections = $db->table('websocket_connections')
                ->countAllResults();
            
            $status['active_connections'] = $activeConnections;
            $status['total_connections'] = $totalConnections;
            
            // 獲取最近的連線活動
            $recentConnection = $db->table('websocket_connections')
                ->orderBy('connected_at', 'DESC')
                ->limit(1)
                ->get()
                ->getRowArray();
            
            if ($recentConnection) {
                $status['last_connection_at'] = $recentConnection['connected_at'];
            }
        } catch (\Exception $e) {
            log_message('error', 'WebSocket status check DB error: ' . $e->getMessage());
        }

        // 整體健康狀態判定
        $status['health'] = $this->determineWebSocketHealth($status);

        return $this->successResponse($status);
    }

    /**
     * POST /api/system/websocket/start
     * 
     * 啟動 WebSocket 服務
     */
    public function startWebSocket()
    {
        // 檢查是否已經運行
        $processInfo = $this->getWebSocketProcessInfo();
        if ($processInfo) {
            return $this->successResponse([
                'message' => 'WebSocket 服務已在運行中',
                'process_info' => $processInfo,
                'status' => 'already_running'
            ]);
        }

        $logFile = WRITEPATH . 'logs/websocket.log';
        $cmd = 'nohup php ' . ROOTPATH . 'spark ws:start > ' . $logFile . ' 2>&1 &';

        exec($cmd, $output, $returnVar);

        if ($returnVar === 0) {
            // 等待服務啟動
            sleep(2);
            
            $processInfo = $this->getWebSocketProcessInfo();
            
            return $this->successResponse([
                'message' => 'WebSocket 服務啟動成功',
                'process_info' => $processInfo,
                'log_file' => $logFile
            ]);
        } else {
            log_message('error', 'WebSocket start failed: ' . implode("\n", $output));
            return $this->fail('啟動失敗，請檢查日誌文件：' . $logFile, 500);
        }
    }

    /**
     * POST /api/system/websocket/stop
     * 
     * 停止 WebSocket 服務
     */
    public function stopWebSocket()
    {
        $processInfo = $this->getWebSocketProcessInfo();
        
        if (!$processInfo) {
            return $this->errorResponse('NOT_RUNNING', 'WebSocket 服務未運行', 400);
        }

        $pid = $processInfo['pid'];
        
        // 嘗試優雅停止
        exec("kill -TERM {$pid}", $output, $returnVar);
        
        // 等待進程結束
        sleep(2);
        
        // 檢查是否成功停止
        $stillRunning = $this->getWebSocketProcessInfo();
        
        if ($stillRunning) {
            // 強制停止
            exec("kill -9 {$pid}");
            sleep(1);
            
            $finalCheck = $this->getWebSocketProcessInfo();
            if ($finalCheck) {
                return $this->fail('無法停止 WebSocket 服務', 500);
            }
        }

        return $this->successResponse([
            'message' => 'WebSocket 服務已停止',
            'pid' => $pid
        ]);
    }

    /**
     * POST /api/system/websocket/restart
     * 
     * 重啟 WebSocket 服務
     */
    public function restartWebSocket()
    {
        $oldProcessInfo = $this->getWebSocketProcessInfo();
        $oldPid = $oldProcessInfo ? $oldProcessInfo['pid'] : null;

        // 停止服務
        if ($oldProcessInfo) {
            $stopResult = $this->stopWebSocket();
            if (!$stopResult->getStatusCode() === 200) {
                return $stopResult;
            }
            sleep(1);
        }

        // 啟動服務
        $startResult = $this->startWebSocket();
        
        if ($startResult->getStatusCode() === 200) {
            $data = json_decode($startResult->getBody(), true);
            $data['data']['old_pid'] = $oldPid;
            $data['data']['message'] = 'WebSocket 服務已重啟';
            
            return $this->successResponse($data['data']);
        }

        return $startResult;
    }

    /**
     * 檢查端口是否在監聽
     */
    private function checkPortListening($port)
    {
        $result = [
            'listening' => false,
            'pid' => null
        ];

        // 使用 netstat 檢查
        exec("netstat -tlnp 2>/dev/null | grep ':{$port} '", $output);
        
        if (!empty($output)) {
            $result['listening'] = true;
            
            // 嘗試提取 PID
            foreach ($output as $line) {
                if (preg_match('/(\d+)\//', $line, $matches)) {
                    $result['pid'] = (int)$matches[1];
                    break;
                }
            }
        }

        return $result;
    }

    /**
     * 獲取 WebSocket 進程資訊
     */
    private function getWebSocketProcessInfo()
    {
        exec('ps aux | grep "[w]s:start"', $output);
        
        if (empty($output)) {
            return null;
        }

        $line = $output[0];
        $parts = preg_split('/\s+/', $line);
        
        if (count($parts) >= 11) {
            return [
                'pid' => (int)$parts[1],
                'cpu' => $parts[2],
                'mem' => $parts[3],
                'start_time' => $parts[8],
                'command' => implode(' ', array_slice($parts, 10))
            ];
        }

        return null;
    }

    /**
     * 判定 WebSocket 服務健康狀態
     */
    private function determineWebSocketHealth($status)
    {
        $checks = [];
        $overallHealth = 'healthy';

        // 檢查 1: 服務運行狀態
        if ($status['service_running']) {
            $checks[] = [
                'name' => 'Service Running',
                'status' => 'ok',
                'message' => 'WebSocket 服務正在運行'
            ];
        } else {
            $checks[] = [
                'name' => 'Service Running',
                'status' => 'error',
                'message' => 'WebSocket 服務未運行'
            ];
            $overallHealth = 'unhealthy';
        }

        // 檢查 2: WebSocket 端口監聽
        if ($status['websocket_port_listening']) {
            $checks[] = [
                'name' => 'WebSocket Port',
                'status' => 'ok',
                'message' => "Port {$status['websocket_port']} 正在監聽"
            ];
        } else {
            $checks[] = [
                'name' => 'WebSocket Port',
                'status' => 'error',
                'message' => "Port {$status['websocket_port']} 未監聽"
            ];
            $overallHealth = 'unhealthy';
        }

        // 檢查 3: 內部推送端口監聽
        if ($status['internal_port_listening']) {
            $checks[] = [
                'name' => 'Internal Push Port',
                'status' => 'ok',
                'message' => "Port {$status['internal_port']} 正在監聽"
            ];
        } else {
            $checks[] = [
                'name' => 'Internal Push Port',
                'status' => 'error',
                'message' => "Port {$status['internal_port']} 未監聽"
            ];
            $overallHealth = 'unhealthy';
        }

        // 檢查 4: 連線統計
        if ($status['service_running']) {
            $checks[] = [
                'name' => 'Connections',
                'status' => 'ok',
                'message' => "{$status['active_connections']} 活躍連線 / {$status['total_connections']} 總連線"
            ];
        }

        return [
            'status' => $overallHealth,
            'checks' => $checks
        ];
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
