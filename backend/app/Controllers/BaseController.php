<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

/**
 * BaseController - API 基礎控制器
 */
class BaseController extends ResourceController
{
    use ResponseTrait;

    protected $format = 'json';
    protected $db;
    protected $currentUser = null;

    public function initController(\CodeIgniter\HTTP\RequestInterface $request, \CodeIgniter\HTTP\ResponseInterface $response, \Psr\Log\LoggerInterface $logger)
    {
        parent::initController($request, $response, $logger);
        $this->db = \Config\Database::connect();
    }

    /**
     * 成功回應
     */
    protected function successResponse($data = null, string $message = null, int $code = 200)
    {
        $response = ['success' => true];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if ($message !== null) {
            $response['message'] = $message;
        }

        return $this->respond($response, $code);
    }

    /**
     * 錯誤回應
     */
    protected function errorResponse(string $code, string $message, int $httpCode = 400, $details = null)
    {
        $response = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ]
        ];

        if ($details !== null) {
            $response['error']['details'] = $details;
        }

        return $this->respond($response, $httpCode);
    }

    /**
     * 驗證錯誤回應
     */
    protected function validationErrorResponse($errors)
    {
        return $this->errorResponse(
            'VALIDATION_ERROR',
            '請求參數驗證失敗',
            400,
            $errors
        );
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
     * 取得當前使用者
     */
    protected function getCurrentUser()
    {
        // 從 request 物件取得（由 AuthFilter 設定）
        if (isset($this->request->user)) {
            return $this->request->user;
        }
        return $this->currentUser;
    }

    /**
     * 設定當前使用者
     */
    public function setCurrentUser($user)
    {
        $this->currentUser = $user;
    }
}
