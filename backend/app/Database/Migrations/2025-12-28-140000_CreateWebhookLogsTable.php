<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立 Webhook 記錄表
 */
class CreateWebhookLogsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'channel_id' => [
                'type'     => 'INT',
                'unsigned' => true,
                'null'     => true,
            ],
            'method' => [
                'type'       => 'VARCHAR',
                'constraint' => 10,
            ],
            'url' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'headers' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'payload' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'response_status' => [
                'type' => 'INT',
                'null' => true,
            ],
            'response_body' => [
                'type' => 'TEXT', // Response might be large or not JSON
                'null' => true,
            ],
            'ip_address' => [
                'type'       => 'VARCHAR',
                'constraint' => 45,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('channel_id');
        $this->forge->addKey('created_at');
        // Do not enforce foreign key for channel_id as we might want to log invalid channel requests?
        // But better to enforce if we can identify it. User wants logging "on the channel".
        // Let's use SET NULL on delete to keep logs even if channel deleted? or cascade?
        // Given the requirement "查詢...有誰觸發", logs are important.
        $this->forge->addForeignKey('channel_id', 'channels', 'id', 'SET NULL', 'CASCADE');

        $attributes = ($this->db->getPlatform() === 'MySQLi') ? ['ENGINE' => 'InnoDB'] : [];
        $this->forge->createTable('webhook_logs', true, $attributes);
    }

    public function down()
    {
        $this->forge->dropTable('webhook_logs', true);
    }
}
