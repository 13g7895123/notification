<?php

namespace Config;

use CodeIgniter\Tasks\Config\Tasks as BaseTasks;
use CodeIgniter\Tasks\Scheduler;

/**
 * Task 排程配置
 * 
 * 啟動方式（選擇一種）：
 * 1. Cron Job（建議）：
 *    * * * * * cd /path/to/project && php spark tasks:run >> /dev/null 2>&1
 * 
 * 2. 或使用 CI4 內建的 Daemon 模式：
 *    php spark tasks:run --daemon
 */
class Tasks extends BaseTasks
{
    /**
     * 註冊排程任務
     */
    public function init(Scheduler $schedule)
    {
        // 1. 每分鐘處理已到期的排程訊息
        $schedule->command('tasks:process-messages')
            ->everyMinute()
            ->named('process-scheduled-messages');

        // 2. 每分鐘更新心跳
        $schedule->command('tasks:heartbeat')
            ->everyMinute()
            ->named('update-heartbeat');

        // 3. 每天凌晨 2 點清理日誌
        $schedule->command('tasks:cleanup-logs')
            ->daily('02:00')
            ->named('cleanup-old-logs');
    }
}
