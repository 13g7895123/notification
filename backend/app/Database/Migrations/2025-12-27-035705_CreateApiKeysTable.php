<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 建立 API 金鑰表
 */
class CreateApiKeysTable extends Migration
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
            'key' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
            ],
            'prefix' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'permissions' => [
                'type' => 'JSON',
            ],
            'rate_limit' => [
                'type'    => 'INT',
                'default' => 60,
            ],
            'usage_count' => [
                'type'    => 'INT',
                'default' => 0,
            ],
            'enabled' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'expires_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'last_used_at' => [
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
        $this->forge->addUniqueKey('key');
        $this->forge->addKey('user_id');
        $this->forge->addKey('enabled');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('api_keys', false, [
            'ENGINE' => 'InnoDB',
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('api_keys', true);
    }
}
