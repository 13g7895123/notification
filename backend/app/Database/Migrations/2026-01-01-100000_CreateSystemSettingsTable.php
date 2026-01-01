<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSystemSettingsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'key' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'unique'     => true,
            ],
            'value' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'string',
                'comment'    => 'string, integer, boolean, json',
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('system_settings');

        // 插入預設設定
        $data = [
            [
                'key'         => 'scheduler.heartbeat_interval',
                'value'       => '10',
                'type'        => 'integer',
                'description' => '排程器心跳更新間隔（秒）',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
            [
                'key'         => 'scheduler.task_check_interval',
                'value'       => '60',
                'type'        => 'integer',
                'description' => '排程任務檢查間隔（秒）',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
            [
                'key'         => 'scheduler.heartbeat_timeout',
                'value'       => '150',
                'type'        => 'integer',
                'description' => '排程器心跳超時時間（秒）',
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ],
        ];

        $this->db->table('system_settings')->insertBatch($data);
    }

    public function down()
    {
        $this->forge->dropTable('system_settings');
    }
}
