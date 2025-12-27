<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立訊息模板表
 */
class CreateTemplatesTable extends Migration
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
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'content' => [
                'type' => 'TEXT',
            ],
            'channel_types' => [
                'type' => 'JSON',
            ],
            'variables' => [
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
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $attributes = ($this->db->getPlatform() === 'MySQLi') ? ['ENGINE' => 'InnoDB'] : [];
        $this->forge->createTable('templates', false, $attributes);
    }

    public function down()
    {
        $this->forge->dropTable('templates', true);
    }
}
