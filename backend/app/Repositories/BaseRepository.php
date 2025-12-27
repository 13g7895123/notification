<?php

namespace App\Repositories;

use CodeIgniter\Database\ConnectionInterface;

/**
 * BaseRepository - 基礎 Repository
 */
abstract class BaseRepository
{
    protected ConnectionInterface $db;
    protected string $table;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    /**
     * 取得最後插入的 ID
     */
    protected function getInsertId(): int
    {
        return $this->db->insertID();
    }

    /**
     * 根據 ID 查找
     */
    public function findById(int $id): ?array
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
    }

    /**
     * 取得所有記錄
     */
    public function findAll(): array
    {
        return $this->db->table($this->table)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();
    }

    /**
     * 刪除記錄
     */
    public function delete(int $id): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->delete();
    }

    /**
     * 計算總數
     */
    public function count(array $conditions = []): int
    {
        $builder = $this->db->table($this->table);

        foreach ($conditions as $key => $value) {
            $builder->where($key, $value);
        }

        return $builder->countAllResults();
    }
}
