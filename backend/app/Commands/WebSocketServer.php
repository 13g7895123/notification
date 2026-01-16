<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Workerman\Worker;
use Workerman\Connection\TcpConnection;

class WebSocketServer extends BaseCommand
{
    /**
     * The Command's Group
     *
     * @var string
     */
    protected $group = 'NotifyHub';

    /**
     * The Command's Name
     *
     * @var string
     */
    protected $name = 'ws:start';

    /**
     * The Command's Description
     *
     * @var string
     */
    protected $description = 'Starts the WebSocket server for real-time Windows notifications';

    /**
     * The Command's Usage
     *
     * @var string
     */
    protected $usage = 'ws:start';

    /**
     * The Command's Arguments
     *
     * @var array
     */
    protected $arguments = [];

    /**
     * The Command's Options
     *
     * @var array
     */
    protected $options = [];

    /**
     * Actually execute a command.
     *
     * @param array $params
     */
    public function run(array $params)
    {
        $port = getenv('WEBSOCKET_PORT') ?: '8080';

        // 1. 建立 WebSocket 服務 (對外)
        $wsWorker = new Worker("websocket://0.0.0.0:$port");
        $wsWorker->count = 1;

        // 用來儲存所有連線的客戶端
        $wsWorker->connections = [];

        $wsWorker->onConnect = function (TcpConnection $connection) use ($wsWorker) {
            echo "New connection: " . $connection->id . PHP_EOL;
            $wsWorker->connections[$connection->id] = $connection;
        };

        $wsWorker->onClose = function (TcpConnection $connection) use ($wsWorker) {
            echo "Connection closed: " . $connection->id . PHP_EOL;
            unset($wsWorker->connections[$connection->id]);
        };

        $wsWorker->onMessage = function (TcpConnection $connection, $data) {
            // 處理來自客戶端的消息 (如果有需要)
            $msg = json_decode($data, true);
            if (isset($msg['type']) && $msg['type'] === 'ping') {
                $connection->send(json_encode(['type' => 'pong', 'time' => time()]));
            }
        };

        // 2. 建立內部推送服務 (對內)
        // 使用 Text 協議，方便 PHP-FPM API 直接發送消息給這個背景進程
        $innerPushWorker = new Worker("text://0.0.0.0:8081");

        $innerPushWorker->onMessage = function (TcpConnection $connection, $data) use ($wsWorker) {
            // data 是來自 PHP-FPM 的 JSON 字串
            $payload = json_decode($data, true);

            if (!$payload) {
                echo "Invalid payload received" . PHP_EOL;
                return;
            }

            echo "Internal Push Triggered: " . $data . PHP_EOL;

            // 廣播給所有連線中的掛件 (Windows Clients)
            foreach ($wsWorker->connections as $clientConnection) {
                $clientConnection->send($data);
            }

            $connection->send('ok');
        };

        echo "WebSocket Server starting on port $port..." . PHP_EOL;
        echo "Internal Push Interface on port 8081..." . PHP_EOL;

        Worker::runAll();
    }
}
