<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSchedulerConfigToSettings extends Migration
{
    public function up()
    {
        $data = [
            [
                'key'         => 'scheduler.enabled',
                'value'       => '1',
                'type'        => 'boolean',
                'description' => '排程器是否啟用',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
            [
                'key'         => 'scheduler.log_retention_days',
                'value'       => '7',
                'type'        => 'integer',
                'description' => '排程器日誌保留天數',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
        ];

        $this->db->table('system_settings')->insertBatch($data);
    }

    public function down()
    {
        $this->db->table('system_settings')
            ->whereIn('key', ['scheduler.enabled', 'scheduler.log_retention_days'])
            ->delete();
    }
}
