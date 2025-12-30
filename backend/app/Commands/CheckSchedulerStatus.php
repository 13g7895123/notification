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

        // 1. 檢查進程
        $pid = shell_exec('pgrep -f "tasks:run"');
        if ($pid) {
            CLI::write("✓ Scheduler 進程正在運行 (PID: " . trim($pid) . ")", 'green');
        } else {
            CLI::write("✗ Scheduler 進程未在運行", 'red');
        }

        // 2. 檢查日誌
        $logFile = WRITEPATH . 'logs/scheduler.log';
        if (file_exists($logFile)) {
            CLI::write("✓ 找到日誌檔案: " . $logFile, 'green');
            CLI::write("最後 5 行日誌內容:", 'cyan');
            $lastLines = shell_exec("tail -n 5 " . escapeshellarg($logFile));
            CLI::write($lastLines ?: '(空)');
        } else {
            CLI::write("✗ 未找到日誌檔案", 'yellow');
        }

        // 3. 檢查資料庫中待處理的訊息
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
    }
}
