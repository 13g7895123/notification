<?php

namespace App\Controllers;

/**
 * ApiKeyController - API 金鑰管理 API
 */
class ApiKeyController extends BaseController
{
    /**
     * GET /api/api-keys
     * 取得 API 金鑰列表
     */
    public function index()
    {
        $user = $this->getCurrentUser();

        $builder = $this->db->table('api_keys');

        // 非管理員只能看到自己的金鑰
        if ($user && $user['role'] !== 'admin') {
            $builder->where('user_id', $user['id']);
        }

        $apiKeys = $builder
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        $formattedKeys = array_map(function ($key) {
            return [
                'id' => $key['id'],
                'name' => $key['name'],
                'key' => $key['prefix'], // 只顯示前綴
                'prefix' => $key['prefix'],
                'permissions' => json_decode($key['permissions'], true),
                'rateLimit' => (int) $key['rate_limit'],
                'usageCount' => (int) $key['usage_count'],
                'enabled' => (bool) $key['enabled'],
                'expiresAt' => $key['expires_at'],
                'lastUsedAt' => $key['last_used_at'],
                'createdAt' => $key['created_at'],
            ];
        }, $apiKeys);

        return $this->successResponse($formattedKeys);
    }

    /**
     * POST /api/api-keys
     * 建立 API 金鑰
     */
    public function create()
    {
        $json = $this->request->getJSON(true);
        $user = $this->getCurrentUser();

        if (empty($json['name'])) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供金鑰名稱', 400);
        }

        $now = date('Y-m-d H:i:s');

        // 生成金鑰
        $fullKey = 'nk_live_' . bin2hex(random_bytes(24));
        $prefix = substr($fullKey, 0, 12) . '...' . substr($fullKey, -4);

        $apiKeyData = [
            'user_id' => $user ? $user['id'] : 1,
            'name' => $json['name'],
            'key' => hash('sha256', $fullKey), // 儲存 hash
            'prefix' => $prefix,
            'permissions' => json_encode($json['permissions'] ?? ['send']),
            'rate_limit' => $json['rateLimit'] ?? 60,
            'usage_count' => 0,
            'enabled' => 1,
            'expires_at' => $json['expiresAt'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table('api_keys')->insert($apiKeyData);
        $keyId = $this->db->insertID();

        return $this->successResponse([
            'id' => $keyId,
            'name' => $apiKeyData['name'],
            'key' => $fullKey, // 只在建立時回傳完整金鑰
            'permissions' => $json['permissions'] ?? ['send'],
            'rateLimit' => $apiKeyData['rate_limit'],
            'enabled' => true,
            'expiresAt' => $apiKeyData['expires_at'],
            'createdAt' => $now,
        ], '請立即保存金鑰，此為唯一一次顯示完整金鑰的機會', 201);
    }

    /**
     * PUT /api/api-keys/:id
     * 更新 API 金鑰設定
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少金鑰 ID', 400);
        }

        $apiKey = $this->db->table('api_keys')->where('id', $id)->get()->getRow();

        if (!$apiKey) {
            return $this->errorResponse('NOT_FOUND', '金鑰不存在', 404);
        }

        $json = $this->request->getJSON(true);

        $updateData = [];

        if (isset($json['name'])) {
            $updateData['name'] = $json['name'];
        }
        if (isset($json['permissions'])) {
            $updateData['permissions'] = json_encode($json['permissions']);
        }
        if (isset($json['rateLimit'])) {
            $updateData['rate_limit'] = $json['rateLimit'];
        }
        if (isset($json['enabled'])) {
            $updateData['enabled'] = $json['enabled'] ? 1 : 0;
        }
        if (isset($json['expiresAt'])) {
            $updateData['expires_at'] = $json['expiresAt'];
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('api_keys')->where('id', $id)->update($updateData);
        }

        $updatedKey = $this->db->table('api_keys')
            ->where('id', $id)
            ->get()
            ->getRowArray();

        return $this->successResponse([
            'id' => $updatedKey['id'],
            'name' => $updatedKey['name'],
            'prefix' => $updatedKey['prefix'],
            'permissions' => json_decode($updatedKey['permissions'], true),
            'rateLimit' => (int) $updatedKey['rate_limit'],
            'enabled' => (bool) $updatedKey['enabled'],
            'expiresAt' => $updatedKey['expires_at'],
        ]);
    }

    /**
     * DELETE /api/api-keys/:id
     * 刪除 API 金鑰
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少金鑰 ID', 400);
        }

        $apiKey = $this->db->table('api_keys')->where('id', $id)->get()->getRow();

        if (!$apiKey) {
            return $this->errorResponse('NOT_FOUND', '金鑰不存在', 404);
        }

        // 刪除相關使用紀錄
        $this->db->table('api_usage_logs')->where('api_key_id', $id)->delete();
        // 刪除金鑰
        $this->db->table('api_keys')->where('id', $id)->delete();

        return $this->successResponse(null, '金鑰已刪除');
    }

    /**
     * PUT /api/api-keys/:id/toggle
     * 切換金鑰啟用狀態
     */
    public function toggle($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少金鑰 ID', 400);
        }

        $apiKey = $this->db->table('api_keys')->where('id', $id)->get()->getRowArray();

        if (!$apiKey) {
            return $this->errorResponse('NOT_FOUND', '金鑰不存在', 404);
        }

        $newEnabled = !$apiKey['enabled'];

        $this->db->table('api_keys')
            ->where('id', $id)
            ->update([
                'enabled' => $newEnabled ? 1 : 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse([
            'id' => $id,
            'enabled' => $newEnabled,
        ]);
    }

    /**
     * POST /api/api-keys/:id/regenerate
     * 重新產生金鑰
     */
    public function regenerate($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少金鑰 ID', 400);
        }

        $apiKey = $this->db->table('api_keys')->where('id', $id)->get()->getRow();

        if (!$apiKey) {
            return $this->errorResponse('NOT_FOUND', '金鑰不存在', 404);
        }

        // 生成新金鑰
        $fullKey = 'nk_live_' . bin2hex(random_bytes(24));
        $prefix = substr($fullKey, 0, 12) . '...' . substr($fullKey, -4);

        $this->db->table('api_keys')
            ->where('id', $id)
            ->update([
                'key' => hash('sha256', $fullKey),
                'prefix' => $prefix,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse([
            'key' => $fullKey,
        ], '金鑰已重新產生，請立即保存');
    }
}
