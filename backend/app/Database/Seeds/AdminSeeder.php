<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * AdminSeeder - 建立預設管理員帳號
 * 
 * 執行方式:
 * docker compose exec backend php spark db:seed AdminSeeder
 */
class AdminSeeder extends Seeder
{
    public function run()
    {
        // Admin 帳號資料（不含 id，讓資料庫自動產生）
        $adminData = [
            'username'     => 'jarvis',
            'display_name' => 'Antigravity Jarvis',
            'email'        => '13g7895123@gmail.com',
            'password'     => password_hash('termit0035', PASSWORD_BCRYPT),
            'role'         => 'admin',
            'status'       => 'active',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];

        // User 帳號資料（不含 id，讓資料庫自動產生）
        $userData = [
            'username'     => 'user',
            'display_name' => '測試人員',
            'email'        => 'user@notifyhub.com',
            'password'     => password_hash('admin123', PASSWORD_BCRYPT),
            'role'         => 'user',
            'status'       => 'active',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];

        $db = \Config\Database::connect();

        // 處理 Admin 帳號
        $existingAdmin = $db->table('users')->where('email', $adminData['email'])->get()->getRow();

        if ($existingAdmin) {
            // 更新密碼
            $db->table('users')
                ->where('email', $adminData['email'])
                ->update([
                    'password'   => $adminData['password'],
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            echo "✅ Admin 帳號已更新\n";
        } else {
            // 新增帳號
            $db->table('users')->insert($adminData);
            echo "✅ Admin 帳號已建立 (ID: " . $db->insertID() . ")\n";
        }

        // 處理 User 帳號
        $existingUser = $db->table('users')->where('email', $userData['email'])->get()->getRow();

        if ($existingUser) {
            // 更新密碼
            $db->table('users')
                ->where('email', $userData['email'])
                ->update([
                    'password'   => $userData['password'],
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            echo "✅ User 帳號已更新\n";
        } else {
            // 新增帳號
            $db->table('users')->insert($userData);
            echo "✅ User 帳號已建立 (ID: " . $db->insertID() . ")\n";
        }

        echo "\n";
        echo "========================================\n";
        echo "  預設帳號資訊\n";
        echo "========================================\n";
        echo "Admin: jarvis / termit0035 (13g7895123@gmail.com)\n";
        echo "User:  user / admin123 (user@notifyhub.com)\n";
        echo "========================================\n";
        echo "⚠️  生產環境請務必更改密碼！\n";
    }
}
