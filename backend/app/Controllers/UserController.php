<?php

namespace App\Controllers;

/**
 * UserController - 使用者管理 API
 */
class UserController extends BaseController
{
    /**
     * GET /api/users
     * 取得使用者列表
     */
    public function index()
    {
        $search = $this->request->getGet('search');
        $role = $this->request->getGet('role');
        $status = $this->request->getGet('status');
        $page = (int) ($this->request->getGet('page') ?? 1);
        $limit = (int) ($this->request->getGet('limit') ?? 20);
        $offset = ($page - 1) * $limit;

        $builder = $this->db->table('users');

        // 搜尋
        if ($search) {
            $builder->groupStart()
                ->like('username', $search)
                ->orLike('email', $search)
                ->groupEnd();
        }

        // 篩選角色
        if ($role) {
            $builder->where('role', $role);
        }

        // 篩選狀態
        if ($status) {
            $builder->where('status', $status);
        }

        // 總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $users = $builder
            ->select('id, username, email, role, status, avatar, created_at, last_login_at')
            ->orderBy('created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        // 格式化
        $formattedUsers = array_map(function ($user) {
            return [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'status' => $user['status'],
                'avatar' => $user['avatar'],
                'createdAt' => $user['created_at'],
                'lastLoginAt' => $user['last_login_at'],
            ];
        }, $users);

        return $this->successResponse([
            'users' => $formattedUsers,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    /**
     * POST /api/users
     * 建立新使用者
     */
    public function create()
    {
        $json = $this->request->getJSON(true);

        // 驗證必要欄位
        $required = ['username', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($json[$field])) {
                return $this->errorResponse('VALIDATION_ERROR', "缺少必要欄位: {$field}", 400);
            }
        }

        // 檢查 email 是否重複
        $existing = $this->db->table('users')
            ->where('email', $json['email'])
            ->get()
            ->getRow();

        if ($existing) {
            return $this->errorResponse('CONFLICT', '此電子郵件已被使用', 409);
        }

        $userId = $this->generateUuid();
        $now = date('Y-m-d H:i:s');

        $userData = [
            'id' => $userId,
            'username' => $json['username'],
            'email' => $json['email'],
            'password' => password_hash($json['password'], PASSWORD_BCRYPT),
            'role' => $json['role'] ?? 'user',
            'status' => $json['status'] ?? 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table('users')->insert($userData);

        return $this->successResponse([
            'id' => $userId,
            'username' => $userData['username'],
            'email' => $userData['email'],
            'role' => $userData['role'],
            'status' => $userData['status'],
            'createdAt' => $now,
        ], null, 201);
    }

    /**
     * PUT /api/users/:id
     * 更新使用者資料
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $user = $this->db->table('users')->where('id', $id)->get()->getRowArray();

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', '使用者不存在', 404);
        }

        $json = $this->request->getJSON(true);

        $updateData = [];

        if (isset($json['username'])) {
            $updateData['username'] = $json['username'];
        }
        if (isset($json['role'])) {
            $updateData['role'] = $json['role'];
        }
        if (isset($json['status'])) {
            $updateData['status'] = $json['status'];
        }
        if (isset($json['avatar'])) {
            $updateData['avatar'] = $json['avatar'];
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('users')->where('id', $id)->update($updateData);
        }

        $updatedUser = $this->db->table('users')
            ->select('id, username, email, role, status, avatar')
            ->where('id', $id)
            ->get()
            ->getRowArray();

        return $this->successResponse($updatedUser);
    }

    /**
     * DELETE /api/users/:id
     * 刪除使用者
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $user = $this->db->table('users')->where('id', $id)->get()->getRow();

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', '使用者不存在', 404);
        }

        // 不能刪除自己
        $currentUser = $this->getCurrentUser();
        if ($currentUser && $currentUser['id'] === $id) {
            return $this->errorResponse('FORBIDDEN', '不能刪除自己的帳號', 403);
        }

        $this->db->table('users')->where('id', $id)->delete();

        return $this->successResponse(null, '使用者已刪除');
    }

    /**
     * PUT /api/users/:id/status
     * 切換使用者狀態
     */
    public function updateStatus($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $user = $this->db->table('users')->where('id', $id)->get()->getRow();

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', '使用者不存在', 404);
        }

        $json = $this->request->getJSON(true);
        $status = $json['status'] ?? null;

        if (!in_array($status, ['active', 'inactive'])) {
            return $this->errorResponse('VALIDATION_ERROR', '狀態必須是 active 或 inactive', 400);
        }

        $this->db->table('users')
            ->where('id', $id)
            ->update([
                'status' => $status,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse([
            'id' => $id,
            'status' => $status,
        ]);
    }

    /**
     * PUT /api/users/:id/password
     * 重設使用者密碼（管理員操作）
     */
    public function resetPassword($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少使用者 ID', 400);
        }

        $user = $this->db->table('users')->where('id', $id)->get()->getRow();

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', '使用者不存在', 404);
        }

        $json = $this->request->getJSON(true);
        $newPassword = $json['newPassword'] ?? '';

        if (empty($newPassword)) {
            return $this->errorResponse('VALIDATION_ERROR', '請提供新密碼', 400);
        }

        $this->db->table('users')
            ->where('id', $id)
            ->update([
                'password' => password_hash($newPassword, PASSWORD_BCRYPT),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $this->successResponse(null, '密碼已重設');
    }
}
