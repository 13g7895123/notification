<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateWebSocketConnectionsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'connection_id' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'comment' => 'Workerman 連線 ID',
            ],
            'ip_address' => [
                'type' => 'VARCHAR',
                'constraint' => 45,
                'null' => true,
            ],
            'user_agent' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'status' => [
                'type' => 'ENUM',
                'constraint' => ['connected', 'disconnected', 'error'],
                'default' => 'connected',
            ],
            'connected_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'disconnected_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'last_ping_at' => [
                'type' => 'DATETIME',
                'null' => true,
                'comment' => '最後一次 ping 時間',
            ],
            'messages_received' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
                'comment' => '收到的訊息數',
            ],
            'messages_sent' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
                'comment' => '發送的訊息數',
            ],
            'error_count' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
                'comment' => '錯誤次數',
            ],
            'last_error' => [
                'type' => 'TEXT',
                'null' => true,
                'comment' => '最後一次錯誤訊息',
            ],
            'metadata' => [
                'type' => 'JSON',
                'null' => true,
                'comment' => '額外的連線資訊',
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('connection_id');
        $this->forge->addKey('status');
        $this->forge->addKey('connected_at');
        $this->forge->createTable('websocket_connections');
    }

    public function down()
    {
        $this->forge->dropTable('websocket_connections');
    }
}
