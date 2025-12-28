<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立 Windows 通知表
 */
class CreateWindowsNotificationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'cicd',
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'message' => [
                'type' => 'TEXT',
            ],
            'repo' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'branch' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'commit_sha' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'delivered', 'read', 'dismissed', 'expired'],
                'default'    => 'pending',
            ],
            'priority' => [
                'type'       => 'ENUM',
                'constraint' => ['low', 'normal', 'high'],
                'default'    => 'normal',
            ],
            'icon' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
                'null'       => true,
            ],
            'action_url' => [
                'type'       => 'VARCHAR',
                'constraint' => 1000,
                'null'       => true,
            ],
            'metadata' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'delivered_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'read_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('status');
        $this->forge->addKey('type');
        $this->forge->addKey('repo');
        $this->forge->addKey('created_at');

        $attributes = ($this->db->getPlatform() === 'MySQLi') ? ['ENGINE' => 'InnoDB'] : [];
        $this->forge->createTable('windows_notifications', false, $attributes);
    }

    public function down()
    {
        $this->forge->dropTable('windows_notifications', true);
    }
}
