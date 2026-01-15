<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;

class UpdateHeartbeatTask extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'tasks:heartbeat';
    protected $description = '更新排程器心跳時間戳';

    public function run(array $params)
    {
        $heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';

        // 確保目錄存在
        if (!is_dir(WRITEPATH . 'pids')) {
            mkdir(WRITEPATH . 'pids', 0755, true);
        }

        // 寫入當前時間戳
        file_put_contents($heartbeatFile, time());
    }
}
