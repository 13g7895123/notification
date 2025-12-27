<?php

namespace App\Controllers;

use App\Repositories\TemplateRepository;

/**
 * TemplateController - 訊息模板 API
 */
class TemplateController extends BaseController
{
    private TemplateRepository $templateRepository;

    public function __construct()
    {
        $this->templateRepository = new TemplateRepository();
    }

    /**
     * GET /api/templates
     * 取得當前使用者的模板列表
     */
    public function index()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $templates = $this->templateRepository->findByUserId((int) $user['id']);

        $formattedTemplates = array_map(function ($template) {
            return $template->toArray();
        }, $templates);

        return $this->successResponse($formattedTemplates);
    }

    /**
     * POST /api/templates
     * 建立模板
     */
    public function create()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $json = $this->request->getJSON(true);

        // 驗證必要欄位
        if (empty($json['name']) || empty($json['title']) || empty($json['content'])) {
            return $this->errorResponse('VALIDATION_ERROR', '缺少必要欄位 (name, title, content)', 400);
        }

        $json['userId'] = (int) $user['id'];
        $template = $this->templateRepository->create($json);

        return $this->successResponse($template->toArray(), null, 201);
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

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $template = $this->templateRepository->find((int) $id, (int) $user['id']);

        if (!$template) {
            return $this->errorResponse('NOT_FOUND', '模板不存在', 404);
        }

        $json = $this->request->getJSON(true);
        $updatedTemplate = $this->templateRepository->update((int) $id, $json, (int) $user['id']);

        return $this->successResponse($updatedTemplate->toArray());
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

        $user = $this->getCurrentUser();
        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', '請先登入', 401);
        }

        $template = $this->templateRepository->find((int) $id, (int) $user['id']);

        if (!$template) {
            return $this->errorResponse('NOT_FOUND', '模板不存在', 404);
        }

        $this->templateRepository->deleteByUserId((int) $id, (int) $user['id']);

        return $this->successResponse(null, '模板已刪除');
    }
}
