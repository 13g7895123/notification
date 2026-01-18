<?php

    /**
     * 記錄 WebSocket 連線
     * 
     * @param string $connectionId 連線 ID
     * @param string $ipAddress IP 位址
     * @param string $userAgent User Agent
     * @return int|false 返回插入的 ID 或 false
     */
    function ws_log_connection(string $connectionId, string $ipAddress = '', string $userAgent = '')
    {
        try {
            $db = \Config\Database::connect();
            $data = [
                'connection_id' => $connectionId,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'status' => 'connected',
                'connected_at' => date('Y-m-d H:i:s'),
            ];
            
            $db->table('websocket_connections')->insert($data);
            return $db->insertID();
        } catch (\Exception $e) {
            log_message('error', "WebSocket Log Connection Error: " . $e->getMessage());
            return false;
        }
    }
}

    /**
     * 更新 WebSocket 連線狀態
     * 
     * @param string $connectionId 連線 ID
     * @param array $data 要更新的資料
     * @return bool
     */
    function ws_update_connection(string $connectionId, array $data): bool
    {
        try {
            $db = \Config\Database::connect();
            $db->table('websocket_connections')
                ->where('connection_id', $connectionId)
                ->update($data);
            return true;
        } catch (\Exception $e) {
            log_message('error', "WebSocket Update Connection Error: " . $e->getMessage());
            return false;
        }
    }
}

    /**
     * 記錄 WebSocket 斷線
     * 
     * @param string $connectionId 連線 ID
     * @return bool
     */
    function ws_log_disconnect(string $connectionId): bool
    {
        return ws_update_connection($connectionId, [
            'status' => 'disconnected',
            'disconnected_at' => date('Y-m-d H:i:s'),
        ]);
    }
}

    /**
     * 記錄 WebSocket ping
     * 
     * @param string $connectionId 連線 ID
     * @return bool
     */
    function ws_log_ping(string $connectionId): bool
    {
        return ws_update_connection($connectionId, [
            'last_ping_at' => date('Y-m-d H:i:s'),
        ]);
    }
}

    /**
     * 增加訊息計數
     * 
     * @param string $connectionId 連線 ID
     * @param string $type 'sent' 或 'received'
     * @return bool
     */
    function ws_increment_messages(string $connectionId, string $type = 'sent'): bool
    {
        try {
            $db = \Config\Database::connect();
            $field = $type === 'received' ? 'messages_received' : 'messages_sent';
            
            $db->query("
                UPDATE websocket_connections 
                SET {$field} = {$field} + 1 
                WHERE connection_id = ?
            ", [$connectionId]);
            
            return true;
        } catch (\Exception $e) {
            log_message('error', "WebSocket Increment Messages Error: " . $e->getMessage());
            return false;
        }
    }
}

    /**
     * 記錄 WebSocket 錯誤
     * 
     * @param string $connectionId 連線 ID
     * @param string $error 錯誤訊息
     * @return bool
     */
    function ws_log_error(string $connectionId, string $error): bool
    {
        try {
            $db = \Config\Database::connect();
            $db->query("
                UPDATE websocket_connections 
                SET 
                    status = 'error',
                    error_count = error_count + 1,
                    last_error = ?
                WHERE connection_id = ?
            ", [$error, $connectionId]);
            
            return true;
        } catch (\Exception $e) {
            log_message('error', "WebSocket Log Error Error: " . $e->getMessage());
            return false;
        }
    }
}
