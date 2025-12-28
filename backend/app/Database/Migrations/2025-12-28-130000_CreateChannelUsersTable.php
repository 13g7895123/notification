<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateChannelUsersTable extends Migration
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
            'channel_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'provider_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'display_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'picture_url' => [
                'type'       => 'TEXT',
                'null'       => true,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['active', 'blocked'],
                'default'    => 'active',
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
        $this->forge->addKey(['channel_id', 'provider_id']); // Unique constraint logic handling in code or here? Best to have unique index.
        $this->forge->addUniqueKey(['channel_id', 'provider_id']);
        $this->forge->addForeignKey('channel_id', 'channels', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('channel_users');
    }

    public function down()
    {
        $this->forge->dropTable('channel_users');
    }
}
