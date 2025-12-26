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
     * 生成 UUID
     */
    protected function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    /**
     * 根據 ID 查找
     */
    public function findById(string $id): ?array
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
    public function delete(string $id): bool
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
