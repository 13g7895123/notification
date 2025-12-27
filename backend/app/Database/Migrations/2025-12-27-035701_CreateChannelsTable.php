<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立通知渠道表
 */
class CreateChannelsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'user_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'type' => [
                'type'       => 'ENUM',
                'constraint' => ['line', 'telegram'],
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'enabled' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'config' => [
                'type' => 'JSON',
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
        $this->forge->addKey('user_id');
        $this->forge->addKey('type');
        $this->forge->addKey('enabled');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $attributes = ($this->db->getPlatform() === 'MySQLi') ? ['ENGINE' => 'InnoDB'] : [];
        $this->forge->createTable('channels', false, $attributes);
    }

    public function down()
    {
        $this->forge->dropTable('channels', true);
    }
}
