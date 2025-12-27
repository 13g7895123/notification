<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立訊息發送結果表
 */
class CreateMessageResultsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'message_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'channel_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'success' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
            ],
            'error' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'sent_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('message_id');
        $this->forge->addKey('channel_id');
        $this->forge->addForeignKey('message_id', 'messages', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('channel_id', 'channels', 'id', 'CASCADE', 'CASCADE');

        $attributes = ($this->db->getPlatform() === 'MySQLi') ? ['ENGINE' => 'InnoDB'] : [];
        $this->forge->createTable('message_results', false, $attributes);
    }

    public function down()
    {
        $this->forge->dropTable('message_results', true);
    }
}
