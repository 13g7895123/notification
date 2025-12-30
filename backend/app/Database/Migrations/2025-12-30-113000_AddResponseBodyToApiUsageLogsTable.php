<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * 新增 response_body 欄位到 api_usage_logs 表
 */
class AddResponseBodyToApiUsageLogsTable extends Migration
{
    public function up()
    {
        $this->forge->addColumn('api_usage_logs', [
            'response_body' => [
                'type' => 'JSON',
                'null' => true,
                'after' => 'request_body',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('api_usage_logs', 'response_body');
    }
}
