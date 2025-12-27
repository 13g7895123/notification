<?php

namespace App\Repositories;

use App\Entities\TemplateEntity;

/**
 * TemplateRepository - 訊息模板 Repository
 */
class TemplateRepository extends BaseRepository
{
    protected string $table = 'templates';

    /**
     * 根據 ID 和使用者 ID 查找模板
     */
    public function find(int $id, ?int $userId = null): ?TemplateEntity
    {
        $builder = $this->db->table($this->table)->where('id', $id);

        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }

        $data = $builder->get()->getRowArray();
        return $data ? new TemplateEntity($data) : null;
    }

    /**
     * 根據使用者 ID 取得所有模板
     */
    public function findByUserId(int $userId): array
    {
        $data = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new TemplateEntity($row), $data);
    }

    /**
     * 取得所有模板
     */
    public function findAll(): array
    {
        $data = $this->db->table($this->table)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return array_map(fn($row) => new TemplateEntity($row), $data);
    }

    /**
     * 建立模板
     */
    public function create(array $data): TemplateEntity
    {
        $now = date('Y-m-d H:i:s');

        $templateData = [
            'user_id' => $data['userId'],
            'name' => $data['name'],
            'title' => $data['title'],
            'content' => $data['content'],
            'channel_types' => json_encode($data['channelTypes'] ?? ['line', 'telegram']),
            'variables' => json_encode($data['variables'] ?? []),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table($this->table)->insert($templateData);
        $templateData['id'] = $this->getInsertId();

        return new TemplateEntity($templateData);
    }

    /**
     * 更新模板
     */
    public function update(int $id, array $data, ?int $userId = null): ?TemplateEntity
    {
        $updateData = ['updated_at' => date('Y-m-d H:i:s')];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['title'])) {
            $updateData['title'] = $data['title'];
        }
        if (isset($data['content'])) {
            $updateData['content'] = $data['content'];
        }
        if (isset($data['channelTypes'])) {
            $updateData['channel_types'] = json_encode($data['channelTypes']);
        }
        if (isset($data['variables'])) {
            $updateData['variables'] = json_encode($data['variables']);
        }

        $builder = $this->db->table($this->table)->where('id', $id);

        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }

        $builder->update($updateData);

        return $this->find($id, $userId);
    }

    /**
     * 刪除模板
     */
    public function deleteByUserId(int $id, int $userId): bool
    {
        return $this->db->table($this->table)
            ->where('id', $id)
            ->where('user_id', $userId)
            ->delete();
    }

    /**
     * 根據使用者 ID 取得統計
     */
    public function getStatsByUserId(int $userId): array
    {
        $total = $this->db->table($this->table)
            ->where('user_id', $userId)
            ->countAllResults();

        return [
            'total' => $total,
        ];
    }
}
