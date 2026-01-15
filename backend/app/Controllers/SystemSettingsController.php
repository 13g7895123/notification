<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use App\Models\SystemSettingModel;

/**
 * SystemSettingsController - 系統設定 API
 * 
 * 提供系統設定的讀取與更新功能
 */
class SystemSettingsController extends BaseController
{
    private SystemSettingModel $settingModel;

    public function __construct()
    {
        $this->settingModel = new SystemSettingModel();
    }

    /**
     * GET /api/settings
     * 
     * 取得所有系統設定
     * 僅限管理員存取
     */
    public function index(): ResponseInterface
    {
        try {
            $settings = $this->settingModel->getAll();
            return $this->successResponse($settings);
        } catch (\Exception $e) {
            log_message('error', 'Get settings error: ' . $e->getMessage());
            return $this->errorResponse('GET_SETTINGS_ERROR', '取得設定失敗', 500);
        }
    }
}
