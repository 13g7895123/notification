<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 新增使用者顯示名稱欄位
 */
class AddDisplayNameToUsers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('users', [
            'display_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'after'      => 'username',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('users', 'display_name');
    }
}
