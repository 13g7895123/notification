<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddWebhookKeyToChannels extends Migration
{
    public function up()
    {
        $this->forge->addColumn('channels', [
            'webhook_key' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'null'       => true,
                'after'      => 'config'
            ],
        ]);

        $this->forge->addKey('webhook_key');
    }

    public function down()
    {
        $this->forge->dropColumn('channels', 'webhook_key');
    }
}
