<?php

namespace App\Repositories;

use App\Entities\UserEntity;

/**
 * UserRepository - 使用者 Repository
 */
class UserRepository extends BaseRepository
{
    protected string $table = 'users';

    /**
     * 根據 ID 查找使用者
     */
    public function find(int $id): ?UserEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new UserEntity($data) : null;
    }

    /**
     * 根據 Email 查找使用者
     */
    public function findByEmail(string $email): ?UserEntity
    {
        $data = $this->db->table($this->table)
            ->where('email', $email)
            ->get()
            ->getRowArray();

        return $data ? new UserEntity($data) : null;
    }

    /**
     * 分頁查詢使用者
     */
    public function findPaginated(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        $builder = $this->db->table($this->table);

        // 搜尋
        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('username', $filters['search'])
                ->orLike('email', $filters['search'])
                ->groupEnd();
        }

        // 篩選角色
        if (!empty($filters['role'])) {
            $builder->where('role', $filters['role']);
        }

        // 篩選狀態
        if (!empty($filters['status'])) {
            $builder->where('status', $filters['status']);
        }

        // 計算總數
        $total = $builder->countAllResults(false);

        // 取得資料
        $data = $builder
            ->select('id, username, email, role, status, avatar, created_at, last_login_at')
            ->orderBy('created_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultArray();

        $users = array_map(fn($row) => new UserEntity($row), $data);

        return [
            'users' => $users,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 建立使用者
     */
    public function create(array $data): UserEntity
    {
        $now = date('Y-m-d H:i:s');

        $userData = [
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role' => $data['role'] ?? 'user',
            'status' => $data['status'] ?? 'active',
            'avatar' => $data['avatar'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table($this->table)->insert($userData);
        $userData['id'] = $this->getInsertId();

        return new UserEntity($userData);
    }

    /**
     * 更新使用者
     */
    public function update(int $id, array $data): ?UserEntity
    {
        $data['updated_at'] = date('Y-m-d H:i:s');

        $this->db->table($this->table)
            ->where('id', $id)
            ->update($data);

        return $this->find($id);
    }

    /**
     * 更新密碼
     */
    public function updatePassword(int $id, string $password): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->update([
                'password' => password_hash($password, PASSWORD_BCRYPT),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    /**
     * 更新最後登入時間
     */
    public function updateLastLogin(int $id): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->update(['last_login_at' => date('Y-m-d H:i:s')]);
    }

    /**
     * 檢查 Email 是否存在
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $builder = $this->db->table($this->table)->where('email', $email);

        if ($excludeId) {
            $builder->where('id !=', $excludeId);
        }

        return $builder->countAllResults() > 0;
    }
}
