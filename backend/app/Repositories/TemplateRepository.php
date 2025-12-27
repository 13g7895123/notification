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
     * 根據 ID 查找模板
     */
    public function find(int $id): ?TemplateEntity
    {
        $data = $this->db->table($this->table)
            ->where('id', $id)
            ->get()
            ->getRowArray();
        return $data ? new TemplateEntity($data) : null;
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
    public function update(int $id, array $data): ?TemplateEntity
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

        $this->db->table($this->table)
            ->where('id', $id)
            ->update($updateData);

        return $this->find($id);
    }
}
