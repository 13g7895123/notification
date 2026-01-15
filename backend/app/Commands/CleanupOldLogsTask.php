<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;

class CleanupOldLogsTask extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'tasks:cleanup-logs';
    protected $description = '清理舊的日誌檔案';

    public function run(array $params)
    {
        $logFile = WRITEPATH . 'logs/scheduler.log';

        if (!file_exists($logFile)) {
            return;
        }

        $fileSize = filesize($logFile);
        $maxSize = 50 * 1024 * 1024; // 50MB

        if ($fileSize > $maxSize) {
            // 備份並清空
            $backup = $logFile . '.' . date('Y-m-d-His');
            rename($logFile, $backup);

            // 只保留最近 7 個備份
            $logs = glob($logFile . '.*');
            if (count($logs) > 7) {
                // 按時間排序，舊的在前
                sort($logs);
                $toDelete = array_slice($logs, 0, count($logs) - 7);
                array_map('unlink', $toDelete);
            }

            $this->log('日誌檔案已輪轉');
        }
    }

    private function log(string $message)
    {
        $logFile = WRITEPATH . 'logs/scheduler.log';
        $timestamp = date('Y-m-d H:i:s');
        $logLine = "[{$timestamp}] [info] {$message}" . PHP_EOL;
        file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}
