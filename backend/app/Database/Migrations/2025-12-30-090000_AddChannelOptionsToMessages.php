<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 新增 channel_options 欄位到 messages 表
 */
class AddChannelOptionsToMessages extends Migration
{
    public function up()
    {
        $this->forge->addColumn('messages', [
            'channel_options' => [
                'type' => 'JSON',
                'null' => true,
                'after' => 'channel_ids',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('messages', 'channel_options');
    }
}
