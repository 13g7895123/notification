<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

/**
 * AuthFilter - JWT 認證過濾器
 */
class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $response = service('response');

        // 取得 Authorization header
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => '未提供認證 Token',
                ],
            ])->setStatusCode(401);
        }

        // 解析 Bearer token
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => '無效的 Token 格式',
                ],
            ])->setStatusCode(401);
        }

        $token = $matches[1];
        $jwtSecret = getenv('JWT_SECRET') ?: 'default-secret-key';

        try {
            // 驗證 JWT
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));

            // 取得使用者資料
            $db = \Config\Database::connect();
            $user = $db->table('users')
                ->where('id', $decoded->sub)
                ->get()
                ->getRowArray();

            if (!$user) {
                return $response->setJSON([
                    'success' => false,
                    'error' => [
                        'code' => 'UNAUTHORIZED',
                        'message' => '使用者不存在',
                    ],
                ])->setStatusCode(401);
            }

            if ($user['status'] !== 'active') {
                return $response->setJSON([
                    'success' => false,
                    'error' => [
                        'code' => 'ACCOUNT_DISABLED',
                        'message' => '帳號已被停用',
                    ],
                ])->setStatusCode(403);
            }

            // 將使用者資料存入 request
            $request->user = $user;
        } catch (ExpiredException $e) {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'TOKEN_EXPIRED',
                    'message' => 'Token 已過期',
                ],
            ])->setStatusCode(401);
        } catch (\Exception $e) {
            return $response->setJSON([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => '無效的 Token',
                ],
            ])->setStatusCode(401);
        }

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 不需要處理
    }
}
