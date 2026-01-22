# WebSocket 功能測試指南

## 📋 目錄
- [系統架構](#系統架構)
- [系統監控介面](#系統監控介面)
- [測試前準備](#測試前準備)
- [測試方案](#測試方案)
  - [方案 1：使用瀏覽器測試](#方案-1使用瀏覽器測試)
  - [方案 2：使用命令行工具](#方案-2使用命令行工具)
  - [方案 3：使用 Python 腳本](#方案-3使用-python-腳本)
  - [方案 4：使用前端介面](#方案-4使用前端介面)
  - [方案 5：端到端測試](#方案-5端到端測試)
- [故障排查](#故障排查)

---

## 系統架構

本專案的 WebSocket 系統包含兩個服務：

1. **WebSocket Server (Port 8080)** - 對外服務，客戶端連線
   - 接收客戶端連線
   - 處理 ping/pong 保活
   - 推送通知給所有連線的客戶端

2. **Internal Push Service (Port 8081)** - 內部服務，API 推送
   - 接收來自 PHP-FPM 的推送請求
   - 廣播訊息到所有 WebSocket 客戶端

---

## 系統監控介面

本專案提供了完整的 WebSocket 服務監控功能，可以在系統上即時查看服務運行狀態。

### 🖥️ 前端管理介面

1. **訪問位置**
   - URL: http://localhost:3000
   - 登入帳號: `admin@notifyhub.com` / `admin123`
   - 進入「排程器管理」頁面

2. **監控功能**
   - ✅ **即時服務狀態**：顯示 WebSocket 服務是否運行
   - 📊 **健康檢查**：自動檢測服務運行、端口監聽狀態
   - 🔌 **連線統計**：活躍連線數、總連線數
   - 📈 **進程信息**：PID、CPU 使用率、記憶體使用率
   - 🎛️ **服務控制**：啟動、停止、重啟服務

3. **功能展示**
   ```
   ┌─────────────────────────────────────────┐
   │  WebSocket 服務監控                      │
   ├─────────────────────────────────────────┤
   │  🟢 服務正常運行                         │
   │  已啟動 | 5 活躍連線 / 100 總連線        │
   ├─────────────────────────────────────────┤
   │  ✅ Service Running                      │
   │     WebSocket 服務正在運行               │
   │                                          │
   │  ✅ WebSocket Port                       │
   │     Port 8080 正在監聽                   │
   │                                          │
   │  ✅ Internal Push Port                   │
   │     Port 8081 正在監聽                   │
   ├─────────────────────────────────────────┤
   │  WebSocket 端口: 8080 [監聽中]          │
   │  內部推送端口: 8081 [監聽中]            │
   │  進程 ID: 12345                          │
   ├─────────────────────────────────────────┤
   │  [重啟服務] [停止服務]                   │
   └─────────────────────────────────────────┘
   ```

### 🔧 API 狀態端點

**無需認證的狀態查詢：**

```bash
# 獲取 WebSocket 服務狀態
curl http://localhost:8080/api/system/websocket/status | jq

# 回應範例
{
  "success": true,
  "data": {
    "service_running": true,
    "websocket_port": "8080",
    "internal_port": "8081",
    "websocket_port_listening": true,
    "internal_port_listening": true,
    "pid": 12345,
    "process_info": {
      "pid": 12345,
      "cpu": "0.5",
      "mem": "1.2",
      "start_time": "10:30",
      "command": "php spark ws:start"
    },
    "active_connections": 5,
    "total_connections": 100,
    "server_time": "2026-01-22 15:30:00",
    "last_connection_at": "2026-01-22 15:28:15",
    "health": {
      "status": "healthy",
      "checks": [
        {
          "name": "Service Running",
          "status": "ok",
          "message": "WebSocket 服務正在運行"
        },
        {
          "name": "WebSocket Port",
          "status": "ok",
          "message": "Port 8080 正在監聽"
        },
        {
          "name": "Internal Push Port",
          "status": "ok",
          "message": "Port 8081 正在監聽"
        },
        {
          "name": "Connections",
          "status": "ok",
          "message": "5 活躍連線 / 100 總連線"
        }
      ]
    }
  }
}
```

**需要認證的服務控制：**

```bash
# 獲取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}' \
  | jq -r '.data.token')

# 啟動 WebSocket 服務
curl -X POST http://localhost:8080/api/system/websocket/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# 停止 WebSocket 服務
curl -X POST http://localhost:8080/api/system/websocket/stop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# 重啟 WebSocket 服務
curl -X POST http://localhost:8080/api/system/websocket/restart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### 🛠️ 命令行快速檢查

使用內建的檢查腳本：

```bash
# 執行自動檢查腳本
chmod +x scripts/check-websocket.sh
./scripts/check-websocket.sh

# 腳本會自動檢查：
# ✅ Backend 容器狀態
# ✅ WebSocket 服務進程
# ✅ 端口監聽狀態（8080, 8081）
# ✅ API 狀態端點
# ✅ 數據庫連線記錄
```

**預期輸出：**

```
======================================
   WebSocket 服務狀態檢查
======================================

[1/5] 檢查 Backend 容器狀態...
✅ Backend 容器正在運行

[2/5] 檢查 WebSocket 服務進程...
✅ WebSocket 服務進程運行中
   PID: 12345 | CPU: 0.5% | MEM: 1.2% | CMD: php spark ws:start

[3/5] 檢查端口監聽狀態...
✅ WebSocket 端口 8080 正在監聽
✅ 內部推送端口 8081 正在監聽

[4/5] 檢查 API 狀態端點...
✅ API 狀態端點可訪問
   服務運行: true
   活躍連線: 5
   總連線數: 100
   健康狀態: healthy
✅ 服務健康狀態良好

[5/5] 檢查數據庫連線記錄...
✅ 數據庫連線記錄可訪問
   總連線記錄: 100
   活躍連線: 5

======================================
   檢查完成
======================================
✅ WebSocket 服務運行正常
```

---

## 測試前準備

### 1. 確認服務運行狀態

```bash
# 查看 Docker 容器狀態
docker compose ps

# 確認 WebSocket Server 是否運行
docker compose logs backend | grep -i websocket

# 檢查端口監聽
docker compose exec backend netstat -tlnp | grep -E '8080|8081'
```

### 2. 啟動 WebSocket Server

如果尚未啟動，執行：

```bash
# 方法 1: 在容器內啟動（前台）
docker compose exec backend php spark ws:start

# 方法 2: 背景運行
docker compose exec -d backend php spark ws:start

# 方法 3: 使用 nohup（推薦）
docker compose exec backend bash -c "nohup php spark ws:start > /var/www/html/writable/logs/websocket.log 2>&1 &"
```

### 3. 驗證 WebSocket Server 啟動

```bash
# 查看日誌
docker compose exec backend tail -f /var/www/html/writable/logs/websocket.log

# 預期輸出：
# WebSocket Server starting on port 8080...
# Internal Push Interface on port 8081...
# Workerman[spark] start in DEBUG mode
```

---

## 測試方案

### 方案 1：使用瀏覽器測試

**最簡單直觀的測試方式**

#### 1.1 創建測試 HTML 頁面

創建 `websocket-test.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WebSocket 測試</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
        #messages { 
            border: 1px solid #ddd; 
            padding: 10px; 
            height: 300px; 
            overflow-y: auto; 
            background: #f9f9f9;
            font-family: monospace;
        }
        button { 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 5px;
        }
        button:hover { background: #0056b3; }
        .message { 
            margin: 5px 0; 
            padding: 5px; 
            border-left: 3px solid #007bff;
            background: white;
        }
        .error { border-left-color: #dc3545; }
        .success { border-left-color: #28a745; }
    </style>
</head>
<body>
    <h1>🔌 WebSocket 連線測試</h1>
    
    <div id="status" class="status disconnected">
        狀態：未連線
    </div>

    <div>
        <button onclick="connect()">連線</button>
        <button onclick="disconnect()">斷線</button>
        <button onclick="sendPing()">發送 Ping</button>
        <button onclick="clearMessages()">清除訊息</button>
    </div>

    <h3>訊息記錄：</h3>
    <div id="messages"></div>

    <script>
        let ws = null;
        let reconnectInterval = null;

        function updateStatus(connected, message) {
            const statusDiv = document.getElementById('status');
            statusDiv.className = 'status ' + (connected ? 'connected' : 'disconnected');
            statusDiv.textContent = '狀態：' + message;
        }

        function addMessage(text, type = 'info') {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;
            const timestamp = new Date().toLocaleTimeString();
            messageDiv.textContent = `[${timestamp}] ${text}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function connect() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                addMessage('已經連線中', 'info');
                return;
            }

            // 注意：如果在 Docker 環境，需要使用 localhost 或實際 IP
            const wsUrl = 'ws://localhost:8080';
            addMessage('正在連線到 ' + wsUrl + '...', 'info');

            ws = new WebSocket(wsUrl);

            ws.onopen = function(event) {
                updateStatus(true, '已連線');
                addMessage('✅ WebSocket 連線成功！', 'success');
            };

            ws.onmessage = function(event) {
                addMessage('📨 收到訊息: ' + event.data, 'success');
                
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'pong') {
                        addMessage('🏓 收到 Pong 回應', 'success');
                    } else if (data.type === 'new_notification') {
                        addMessage('🔔 收到新通知: ' + JSON.stringify(data.data, null, 2), 'success');
                    }
                } catch (e) {
                    // 非 JSON 格式的訊息
                }
            };

            ws.onerror = function(error) {
                addMessage('❌ 連線錯誤: ' + error.message, 'error');
                updateStatus(false, '連線錯誤');
            };

            ws.onclose = function(event) {
                updateStatus(false, '已斷線');
                addMessage('🔌 連線已關閉 (code: ' + event.code + ')', 'info');
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
                addMessage('主動斷開連線', 'info');
            }
        }

        function sendPing() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const pingMsg = JSON.stringify({ type: 'ping', time: Date.now() });
                ws.send(pingMsg);
                addMessage('📤 發送 Ping: ' + pingMsg, 'info');
            } else {
                addMessage('❌ 尚未連線，無法發送訊息', 'error');
            }
        }

        function clearMessages() {
            document.getElementById('messages').innerHTML = '';
        }

        // 頁面載入時自動連線
        window.onload = function() {
            addMessage('頁面已載入，點擊「連線」開始測試', 'info');
        };
    </script>
</body>
</html>
```

#### 1.2 使用方法

1. 將上面的 HTML 儲存為 `websocket-test.html`
2. 用瀏覽器直接開啟此檔案
3. 點擊「連線」按鈕
4. 觀察連線狀態和訊息記錄

**預期結果：**
- ✅ 狀態變為「已連線」
- ✅ 訊息記錄顯示「WebSocket 連線成功！」
- ✅ 點擊「發送 Ping」會收到 Pong 回應

---

### 方案 2：使用命令行工具

#### 2.1 使用 websocat（推薦）

```bash
# 安裝 websocat
# Ubuntu/Debian
sudo wget -qO /usr/local/bin/websocat https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-unknown-linux-musl
sudo chmod +x /usr/local/bin/websocat

# macOS
brew install websocat

# 連接到 WebSocket Server
websocat ws://localhost:8080

# 連線後，手動輸入 JSON 測試 ping/pong：
{"type":"ping","time":1234567890}

# 預期回應：
{"type":"pong","time":1234567890}
```

#### 2.2 使用 wscat

```bash
# 安裝 wscat (需要 Node.js)
npm install -g wscat

# 連接測試
wscat -c ws://localhost:8080

# 發送測試訊息
> {"type":"ping","time":1234567890}

# 預期收到：
< {"type":"pong","time":1234567890}
```

#### 2.3 使用 curl (HTTP 握手測試)

```bash
# 測試 WebSocket 握手（會失敗但可以驗證端口開啟）
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
     http://localhost:8080
```

---

### 方案 3：使用 Python 腳本

創建 `test_websocket.py`：

```python
#!/usr/bin/env python3
"""
WebSocket 測試腳本
需要安裝: pip install websocket-client
"""

import websocket
import json
import time
import threading

class WebSocketTester:
    def __init__(self, url="ws://localhost:8080"):
        self.url = url
        self.ws = None
        self.connected = False

    def on_message(self, ws, message):
        print(f"📨 收到訊息: {message}")
        try:
            data = json.loads(message)
            if data.get('type') == 'pong':
                print("✅ Pong 回應正常")
            elif data.get('type') == 'new_notification':
                print(f"🔔 收到新通知: {json.dumps(data['data'], indent=2, ensure_ascii=False)}")
        except json.JSONDecodeError:
            print(f"⚠️  非 JSON 格式: {message}")

    def on_error(self, ws, error):
        print(f"❌ 錯誤: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        print(f"🔌 連線關閉 (code: {close_status_code}, msg: {close_msg})")
        self.connected = False

    def on_open(self, ws):
        print("✅ WebSocket 連線成功！")
        self.connected = True
        
        # 自動發送 ping 測試
        def send_ping():
            time.sleep(1)
            if self.connected:
                ping_msg = json.dumps({"type": "ping", "time": int(time.time())})
                print(f"📤 發送 Ping: {ping_msg}")
                ws.send(ping_msg)
        
        threading.Thread(target=send_ping).start()

    def connect(self):
        print(f"🔗 正在連線到 {self.url}...")
        self.ws = websocket.WebSocketApp(
            self.url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.ws.run_forever()

    def send(self, message):
        if self.connected and self.ws:
            self.ws.send(message)
            print(f"📤 發送: {message}")
        else:
            print("❌ 未連線，無法發送訊息")

if __name__ == "__main__":
    tester = WebSocketTester()
    try:
        tester.connect()
    except KeyboardInterrupt:
        print("\n⏹️  測試結束")
```

使用方法：

```bash
# 安裝依賴
pip install websocket-client

# 執行測試
python test_websocket.py

# 預期輸出：
# 🔗 正在連線到 ws://localhost:8080...
# ✅ WebSocket 連線成功！
# 📤 發送 Ping: {"type": "ping", "time": 1234567890}
# 📨 收到訊息: {"type":"pong","time":1234567890}
# ✅ Pong 回應正常
```

---

### 方案 4：使用前端介面

本專案已內建 WebSocket 連線追蹤功能：

#### 4.1 使用管理介面查看

1. 啟動前端服務：
   ```bash
   docker compose up -d
   ```

2. 訪問 http://localhost:3000

3. 登入系統（admin@notifyhub.com / admin123）

4. 進入「API 使用紀錄」頁面

5. 查看 WebSocket 連線追蹤區塊：
   - 目前連線數
   - 總連線數
   - 錯誤連線數
   - 連線列表

#### 4.2 API 測試

```bash
# 取得 JWT Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}' \
  | jq -r '.data.token')

# 查看 WebSocket 連線列表
curl -X GET http://localhost:8080/api/websocket/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# 查看 WebSocket 統計資訊
curl -X GET http://localhost:8080/api/websocket/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

---

### 方案 5：端到端測試

**完整測試 API → WebSocket 推送流程**

#### 5.1 測試流程

```bash
# 1. 開啟一個終端，使用 websocat 監聽
websocat ws://localhost:8080

# 2. 開啟另一個終端，取得 API Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}' \
  | jq -r '.data.token')

# 3. 創建一個 Windows 通知
curl -X POST http://localhost:8080/api/notifications/windows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "WebSocket 測試",
    "message": "這是一個測試通知",
    "severity": "info"
  }' | jq

# 4. 在第一個終端應該會收到推送訊息：
# {"type":"new_notification","data":{...}}
```

#### 5.2 自動化測試腳本

創建 `test_e2e.sh`：

```bash
#!/bin/bash

echo "🚀 開始端到端 WebSocket 測試..."

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 檢查 WebSocket Server
echo -e "\n${YELLOW}[1/5]${NC} 檢查 WebSocket Server..."
if docker compose exec backend ps aux | grep -q "[w]s:start"; then
    echo -e "${GREEN}✅ WebSocket Server 運行中${NC}"
else
    echo -e "${RED}❌ WebSocket Server 未運行，正在啟動...${NC}"
    docker compose exec -d backend bash -c "nohup php spark ws:start > /var/www/html/writable/logs/websocket.log 2>&1 &"
    sleep 3
fi

# 2. 測試連線
echo -e "\n${YELLOW}[2/5]${NC} 測試 WebSocket 連線..."
timeout 5 websocat ws://localhost:8080 < /dev/null && \
    echo -e "${GREEN}✅ WebSocket 連線成功${NC}" || \
    echo -e "${RED}❌ WebSocket 連線失敗${NC}"

# 3. 取得 Token
echo -e "\n${YELLOW}[3/5]${NC} 取得 API Token..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}' \
  | jq -r '.data.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Token 取得成功${NC}"
else
    echo -e "${RED}❌ Token 取得失敗${NC}"
    exit 1
fi

# 4. 查看統計
echo -e "\n${YELLOW}[4/5]${NC} 查看 WebSocket 統計..."
curl -s -X GET http://localhost:8080/api/websocket/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.data | {activeConnections, totalConnections, errorConnections}'

# 5. 測試推送（需要有客戶端連線）
echo -e "\n${YELLOW}[5/5]${NC} 測試通知推送..."
RESULT=$(curl -s -X POST http://localhost:8080/api/notifications/windows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E2E 測試通知",
    "message": "這是一個端到端測試",
    "severity": "info"
  }')

if echo "$RESULT" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ 通知創建成功${NC}"
    echo "$RESULT" | jq '.data | {id, title, message}'
else
    echo -e "${RED}❌ 通知創建失敗${NC}"
fi

echo -e "\n${GREEN}🎉 測試完成！${NC}"
```

使用方法：

```bash
chmod +x test_e2e.sh
./test_e2e.sh
```

---

## 故障排查

### 問題 1：無法連線到 WebSocket Server

**症狀：**
```
WebSocket connection failed: Error in connection establishment
```

**解決方案：**

```bash
# 1. 檢查 WebSocket Server 是否運行
docker compose exec backend ps aux | grep ws:start

# 2. 檢查端口是否監聽
docker compose exec backend netstat -tlnp | grep 8080

# 3. 查看 WebSocket 日誌
docker compose exec backend cat /var/www/html/writable/logs/websocket.log

# 4. 手動啟動
docker compose exec backend php spark ws:start
```

### 問題 2：連線成功但收不到推送

**症狀：**
- WebSocket 連線正常
- 創建通知成功
- 但客戶端收不到訊息

**解決方案：**

```bash
# 1. 檢查 Internal Push Service (8081)
docker compose exec backend netstat -tlnp | grep 8081

# 2. 測試內部推送
docker compose exec backend bash -c 'echo "{\"type\":\"test\",\"data\":{}}" | nc localhost 8081'

# 3. 檢查 websocket_helper.php
docker compose exec backend cat /var/www/html/app/Helpers/websocket_helper.php

# 4. 查看 PHP 錯誤日誌
docker compose exec backend tail -f /var/www/html/writable/logs/log-*.php
```

### 問題 3：Docker 環境網路問題

**症狀：**
- 容器內可以連線
- 宿主機無法連線

**解決方案：**

```bash
# 1. 檢查 Docker Compose 端口映射
docker compose ps

# 2. 確認 docker-compose.yml 中有映射 8080
# 應該有類似：
# ports:
#   - "8080:8080"

# 3. 檢查防火牆
sudo ufw status
sudo ufw allow 8080/tcp

# 4. 從宿主機測試
telnet localhost 8080
```

### 問題 4：高併發連線測試

創建 `stress_test.sh`：

```bash
#!/bin/bash

# 壓力測試 - 同時建立多個連線
CONNECTIONS=10

for i in $(seq 1 $CONNECTIONS); do
    websocat ws://localhost:8080 &
    echo "啟動連線 #$i"
done

echo "已建立 $CONNECTIONS 個連線，按 Ctrl+C 結束"
wait
```

---

## 推薦測試流程

### 快速驗證（5 分鐘）

1. 啟動 WebSocket Server
2. 使用瀏覽器測試頁面連線
3. 點擊發送 Ping，確認收到 Pong
4. ✅ 基本功能正常

### 完整測試（15 分鐘）

1. 使用方案 1（瀏覽器）測試連線
2. 使用方案 5（端到端）測試推送
3. 使用方案 4（管理介面）查看統計
4. ✅ 全功能驗證完成

### 生產環境驗證（30 分鐘）

1. 執行端到端自動化腳本
2. 進行壓力測試
3. 監控連線穩定性
4. 檢查錯誤日誌
5. ✅ 生產就緒

---

## 相關文檔

- [WEBSOCKET_API_GUIDE.md](WEBSOCKET_API_GUIDE.md) - WebSocket API 詳細說明
- [README.md](README.md) - 專案概述
- [backend/app/Commands/WebSocketServer.php](backend/app/Commands/WebSocketServer.php) - WebSocket Server 實作

---

**最後更新：** 2026-01-22
**維護者：** NotifyHub Team
