<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class CheckSchedulerStatus extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'schedule:status';
    protected $description = '檢查 Task Scheduler 運行狀態';

    public function run(array $params)
    {
        CLI::write('--- Task Scheduler 狀態檢查 ---', 'yellow');

        $heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';
        $pidFile = WRITEPATH . 'pids/scheduler.pid';

        // 1. 檢查心跳
        if (file_exists($heartbeatFile)) {
            $lastRun = (int) trim(file_get_contents($heartbeatFile));
            $now = time();
            $diff = $now - $lastRun;

            CLI::write("心跳檔案: {$heartbeatFile}", 'cyan');
            CLI::write("最後心跳: " . date('Y-m-d H:i:s', $lastRun) . " ({$diff} 秒前)", 'cyan');

            if ($diff < 150) {
                CLI::write("✓ Scheduler 心跳正常 (< 150 秒)", 'green');
            } else {
                CLI::write("✗ Scheduler 心跳異常 (> 150 秒，可能已停止)", 'red');
            }
        } else {
            CLI::write("✗ 未找到心跳檔案: {$heartbeatFile}", 'red');
        }

        // 2. 檢查 PID 檔案
        if (file_exists($pidFile)) {
            $pid = (int) trim(file_get_contents($pidFile));
            if (file_exists("/proc/{$pid}")) {
                CLI::write("✓ Scheduler 進程正在運行 (PID: {$pid})", 'green');
            } else {
                CLI::write("⚠ PID 檔案存在但進程已停止 (PID: {$pid})", 'yellow');
            }
        } else {
            CLI::write("⚠ 未找到 PID 檔案", 'yellow');
        }

        // 3. 檢查日誌
        $logFile = WRITEPATH . 'logs/scheduler.log';
        if (file_exists($logFile)) {
            CLI::write("✓ 找到日誌檔案: " . $logFile, 'green');
            CLI::write("最後 5 行日誌內容:", 'cyan');
            $lastLines = shell_exec("tail -n 5 " . escapeshellarg($logFile));
            CLI::write($lastLines ?: '(空)');
        } else {
            CLI::write("⚠ 未找到日誌檔案", 'yellow');
        }

        // 4. 檢查資料庫中待處理的訊息
        $db = \Config\Database::connect();
        $count = $db->table('messages')->where('status', 'scheduled')->countAllResults();
        CLI::write("目前資料庫中有 {$count} 筆待處理的排程訊息", 'cyan');

        if ($count > 0) {
            $next = $db->table('messages')
                ->where('status', 'scheduled')
                ->orderBy('scheduled_at', 'ASC')
                ->limit(1)
                ->get()
                ->getRowArray();
            CLI::write("次一筆預定發送時間: " . ($next['scheduled_at'] ?? 'N/A'), 'yellow');
        }

        CLI::newLine();
        CLI::write('--- 使用說明 ---', 'yellow');
        CLI::write('啟動排程器: php spark scheduler:daemon', 'cyan');
        CLI::write('單次執行:   php spark scheduler:daemon --once', 'cyan');
    }
}
