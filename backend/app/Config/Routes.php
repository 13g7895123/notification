<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// ===========================================
// 健康檢查
// ===========================================
$routes->get('/', static function () {
    return service('response')->setJSON([
        'success' => true,
        'message' => 'NotifyHub API is running',
        'version' => '1.0.0',
    ]);
});

$routes->get('/health', static function () {
    return service('response')->setJSON([
        'status' => 'healthy',
        'timestamp' => date('c'),
    ]);
});

// ===========================================
// 版本 API（無需認證）
// ===========================================
$routes->group('api/version', ['namespace' => 'App\Controllers'], static function ($routes) {
    $routes->get('current', 'VersionController::current');
    $routes->get('history', 'VersionController::history');
});

// ===========================================
// API 路由
// ===========================================
$routes->group('api', ['namespace' => 'App\Controllers'], static function ($routes) {

    // CORS preflight
    $routes->options('(:any)', static function () {
        return service('response')
            ->setHeader('Access-Control-Allow-Origin', '*')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->setStatusCode(200);
    });

    // =========================================
    // 認證 API（無需登入）
    // =========================================
    $routes->post('auth/login', 'AuthController::login');

    // Webhook API
    $routes->post('webhook/line', 'WebhookController::line');

    // =========================================
    // 系統狀態 API（無需認證，用於監控）
    // =========================================
    $routes->get('system/status', 'SystemController::status');

    // =========================================
    // Windows 通知 API（支援 API Key 認證）
    // Controller 內部會驗證 X-API-Key 或 JWT
    // =========================================
    $routes->get('notifications/windows', 'WindowsNotificationController::index');
    $routes->get('notifications/windows/pending', 'WindowsNotificationController::pending');
    $routes->get('notifications/windows/stats', 'WindowsNotificationController::stats');
    $routes->post('notifications/windows', 'WindowsNotificationController::create');
    $routes->get('notifications/windows/(:segment)', 'WindowsNotificationController::show/$1');
    $routes->patch('notifications/windows/(:segment)/status', 'WindowsNotificationController::updateStatus/$1');
    $routes->post('notifications/windows/expire', 'WindowsNotificationController::expire');

    // =========================================
    // 需要認證的 API
    // =========================================
    $routes->group('', ['filter' => 'auth'], static function ($routes) {

        // 認證相關
        $routes->post('auth/logout', 'AuthController::logout');
        $routes->get('auth/me', 'AuthController::me');
        $routes->put('auth/profile', 'AuthController::updateProfile');
        $routes->put('auth/password', 'AuthController::changePassword');

        // 系統管理
        $routes->post('system/scheduler/start', 'SystemController::startScheduler');

        // 統計數據
        $routes->get('stats/dashboard', 'StatsController::dashboard');

        // 通知渠道
        $routes->get('channels', 'ChannelController::index');
        $routes->post('channels', 'ChannelController::create');
        $routes->put('channels/(:segment)', 'ChannelController::update/$1');
        $routes->delete('channels/(:segment)', 'ChannelController::delete/$1');
        $routes->put('channels/(:segment)/toggle', 'ChannelController::toggle/$1');
        $routes->post('channels/(:segment)/test', 'ChannelController::test/$1');
        $routes->post('channels/(:segment)/regenerate-key', 'ChannelController::regenerateKey/$1');

        $routes->get('channels/(:segment)/users', 'ChannelController::users/$1');
        $routes->get('channels/(:segment)/webhook-logs', 'ChannelController::webhookLogs/$1');

        // 通知訊息
        $routes->get('messages', 'MessageController::index');
        $routes->post('messages/send', 'MessageController::send');
        $routes->delete('messages/(:segment)', 'MessageController::delete/$1');

        // 訊息模板
        $routes->get('templates', 'TemplateController::index');
        $routes->post('templates', 'TemplateController::create');
        $routes->put('templates/(:segment)', 'TemplateController::update/$1');
        $routes->delete('templates/(:segment)', 'TemplateController::delete/$1');

        // API 金鑰
        $routes->get('api-keys', 'ApiKeyController::index');
        $routes->post('api-keys', 'ApiKeyController::create');
        $routes->put('api-keys/(:segment)', 'ApiKeyController::update/$1');
        $routes->delete('api-keys/(:segment)', 'ApiKeyController::delete/$1');
        $routes->put('api-keys/(:segment)/toggle', 'ApiKeyController::toggle/$1');
        $routes->post('api-keys/(:segment)/regenerate', 'ApiKeyController::regenerate/$1');

        // API 使用紀錄
        $routes->get('api-usage', 'ApiUsageController::stats');
        $routes->get('api-usage/logs', 'ApiUsageController::logs');
        $routes->get('api-usage/stats', 'ApiUsageController::stats');

        // =========================================
        // 僅限管理員的 API
        // =========================================
        $routes->group('', ['filter' => 'admin'], static function ($routes) {
            // 使用者管理
            $routes->get('users', 'UserController::index');
            $routes->post('users', 'UserController::create');
            $routes->put('users/(:segment)', 'UserController::update/$1');
            $routes->delete('users/(:segment)', 'UserController::delete/$1');
            $routes->put('users/(:segment)/status', 'UserController::updateStatus/$1');
            $routes->put('users/(:segment)/password', 'UserController::resetPassword/$1');

            // 排程器管理
            $routes->get('scheduler/status', 'SchedulerController::status');
            $routes->get('scheduler/logs', 'SchedulerController::logs');
            $routes->get('scheduler/settings', 'SchedulerController::getSettings');
            $routes->post('scheduler/settings', 'SchedulerController::updateSettings');
            $routes->post('scheduler/enable', 'SchedulerController::enable');
            $routes->post('scheduler/disable', 'SchedulerController::disable');
            $routes->post('scheduler/run-now', 'SchedulerController::runNow');

            // 系統設定
            $routes->get('settings', 'SystemSettingsController::index');
        });

        // =========================================
        // Windows 通知 API（僅刪除需要登入）
        // =========================================
        $routes->delete('notifications/windows/(:segment)', 'WindowsNotificationController::delete/$1');
    });
});
