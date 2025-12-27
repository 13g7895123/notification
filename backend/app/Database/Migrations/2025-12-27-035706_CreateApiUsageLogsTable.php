<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立 API 使用紀錄表
 */
class CreateApiUsageLogsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'api_key_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'endpoint' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'method' => [
                'type'       => 'VARCHAR',
                'constraint' => 10,
            ],
            'status_code' => [
                'type' => 'INT',
            ],
            'success' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
            ],
            'response_time' => [
                'type' => 'INT',
            ],
            'ip' => [
                'type'       => 'VARCHAR',
                'constraint' => 45,
            ],
            'user_agent' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
                'null'       => true,
            ],
            'request_body' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'error_message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('api_key_id');
        $this->forge->addKey('created_at');
        $this->forge->addKey('endpoint');
        $this->forge->addForeignKey('api_key_id', 'api_keys', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('api_usage_logs', false, [
            'ENGINE' => 'InnoDB',
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('api_usage_logs', true);
    }
}
