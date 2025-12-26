<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * AdminFilter - 管理員權限過濾器
 */
class AdminFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $response = service('response');

        // 確保已通過認證
        if (!isset($request->user)) {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => '未登入',
                ],
            ])->setStatusCode(401);
        }

        // 檢查是否為管理員
        if ($request->user['role'] !== 'admin') {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => '權限不足，僅限管理員存取',
                ],
            ])->setStatusCode(403);
        }

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 不需要處理
    }
}
