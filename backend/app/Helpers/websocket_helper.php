<?php

if (!function_exists('ws_push_notification')) {
    /**
     * 推送通知到 WebSocket Server
     * 
     * @param array $data 通知資料
     * @return bool
     */
    function ws_push_notification(array $data): bool
    {
        try {
            // 連接到內部推送服務 (Port 8081)
            // 在 Docker 環境中，如果從 backend 連接 websocket 服務，主機名應為 websocket
            // 但如果是在同一個 container 內運行，則是 127.0.0.1
            $host = '127.0.0.1';
            $port = 8081;

            $client = stream_socket_client("tcp://$host:$port", $errno, $errstr, 1);
            if (!$client) {
                log_message('error', "WebSocket Push Error: $errstr ($errno)");
                return false;
            }

            // 發送 JSON 數據，Workerman Text 協議需要以換行符結尾
            fwrite($client, json_encode($data) . "\n");

            // 讀取回應
            $response = fread($client, 1024);
            fclose($client);

            return trim($response) === 'ok';
        } catch (\Exception $e) {
            log_message('error', "WebSocket Push Exception: " . $e->getMessage());
            return false;
        }
    }
}
