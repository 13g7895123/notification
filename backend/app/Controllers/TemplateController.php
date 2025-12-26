<?php

namespace App\Controllers;

/**
 * TemplateController - 訊息模板 API
 */
class TemplateController extends BaseController
{
    /**
     * GET /api/templates
     * 取得模板列表
     */
    public function index()
    {
        $templates = $this->db->table('templates')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        $formattedTemplates = array_map(function ($template) {
            return [
                'id' => $template['id'],
                'name' => $template['name'],
                'title' => $template['title'],
                'content' => $template['content'],
                'channelTypes' => json_decode($template['channel_types'], true),
                'variables' => json_decode($template['variables'], true),
                'createdAt' => $template['created_at'],
                'updatedAt' => $template['updated_at'],
            ];
        }, $templates);

        return $this->successResponse($formattedTemplates);
    }

    /**
     * POST /api/templates
     * 建立模板
     */
    public function create()
    {
        $json = $this->request->getJSON(true);

        // 驗證必要欄位
        if (empty($json['name']) || empty($json['title']) || empty($json['content'])) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少必要欄位 (name, title, content)', 400);
        }

        $templateId = $this->generateUuid();
        $now = date('Y-m-d H:i:s');

        $templateData = [
            'id' => $templateId,
            'name' => $json['name'],
            'title' => $json['title'],
            'content' => $json['content'],
            'channel_types' => json_encode($json['channelTypes'] ?? ['line', 'telegram']),
            'variables' => json_encode($json['variables'] ?? []),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->db->table('templates')->insert($templateData);

        return $this->successResponse([
            'id' => $templateId,
            'name' => $templateData['name'],
            'title' => $templateData['title'],
            'content' => $templateData['content'],
            'channelTypes' => $json['channelTypes'] ?? ['line', 'telegram'],
            'variables' => $json['variables'] ?? [],
            'createdAt' => $now,
        ], null, 201);
    }

    /**
     * PUT /api/templates/:id
     * 更新模板
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少模板 ID', 400);
        }

        $template = $this->db->table('templates')->where('id', $id)->get()->getRow();

        if (!$template) {
            return $this->errorResponse('NOT_FOUND', '模板不存在', 404);
        }

        $json = $this->request->getJSON(true);

        $updateData = [];

        if (isset($json['name'])) {
            $updateData['name'] = $json['name'];
        }
        if (isset($json['title'])) {
            $updateData['title'] = $json['title'];
        }
        if (isset($json['content'])) {
            $updateData['content'] = $json['content'];
        }
        if (isset($json['channelTypes'])) {
            $updateData['channel_types'] = json_encode($json['channelTypes']);
        }
        if (isset($json['variables'])) {
            $updateData['variables'] = json_encode($json['variables']);
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('templates')->where('id', $id)->update($updateData);
        }

        $updatedTemplate = $this->db->table('templates')
            ->where('id', $id)
            ->get()
            ->getRowArray();

        return $this->successResponse([
            'id' => $updatedTemplate['id'],
            'name' => $updatedTemplate['name'],
            'title' => $updatedTemplate['title'],
            'content' => $updatedTemplate['content'],
            'channelTypes' => json_decode($updatedTemplate['channel_types'], true),
            'variables' => json_decode($updatedTemplate['variables'], true),
            'updatedAt' => $updatedTemplate['updated_at'],
        ]);
    }

    /**
     * DELETE /api/templates/:id
     * 刪除模板
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少模板 ID', 400);
        }

        $template = $this->db->table('templates')->where('id', $id)->get()->getRow();

        if (!$template) {
            return $this->errorResponse('NOT_FOUND', '模板不存在', 404);
        }

        $this->db->table('templates')->where('id', $id)->delete();

        return $this->successResponse(null, '模板已刪除');
    }
}
