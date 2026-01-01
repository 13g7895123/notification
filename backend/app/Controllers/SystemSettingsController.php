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
            return $this->failResponse('取得設定失敗', 500);
        }
    }

    /**
     * GET /api/settings/scheduler
     * 
     * 取得排程器相關設定
     * 僅限管理員存取
     */
    public function scheduler(): ResponseInterface
    {
        try {
            $keys = [
                'scheduler.heartbeat_interval',
                'scheduler.task_check_interval',
                'scheduler.heartbeat_timeout'
            ];

            $settings = $this->settingModel->getMultiple($keys);

            return $this->successResponse([
                'heartbeatInterval' => $settings['scheduler.heartbeat_interval'] ?? 10,
                'taskCheckInterval' => $settings['scheduler.task_check_interval'] ?? 60,
                'heartbeatTimeout' => $settings['scheduler.heartbeat_timeout'] ?? 150,
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Get scheduler settings error: ' . $e->getMessage());
            return $this->failResponse('取得排程器設定失敗', 500);
        }
    }

    /**
     * PUT /api/settings/scheduler
     * 
     * 更新排程器設定
     * 僅限管理員存取
     */
    public function updateScheduler(): ResponseInterface
    {
        $rules = [
            'heartbeatInterval' => 'permit_empty|integer|greater_than[4]|less_than[61]',
            'taskCheckInterval' => 'permit_empty|integer|greater_than[9]|less_than[601]',
            'heartbeatTimeout' => 'permit_empty|integer|greater_than[29]|less_than[301]',
        ];

        if (!$this->validate($rules)) {
            return $this->failResponse($this->validator->getErrors(), 400);
        }

        try {
            $data = $this->request->getJSON(true);

            if (isset($data['heartbeatInterval'])) {
                $this->settingModel->set('scheduler.heartbeat_interval', $data['heartbeatInterval']);
            }

            if (isset($data['taskCheckInterval'])) {
                $this->settingModel->set('scheduler.task_check_interval', $data['taskCheckInterval']);
            }

            if (isset($data['heartbeatTimeout'])) {
                $this->settingModel->set('scheduler.heartbeat_timeout', $data['heartbeatTimeout']);
            }

            log_message('info', 'Scheduler settings updated by user');

            return $this->successResponse([
                'message' => '排程器設定已更新，需要重啟排程器才會生效'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Update scheduler settings error: ' . $e->getMessage());
            return $this->failResponse('更新設定失敗', 500);
        }
    }
}
