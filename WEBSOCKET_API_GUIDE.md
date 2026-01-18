# WebSocket 連線追蹤功能

## 功能概述

本系統新增了完整的 WebSocket 連線追蹤功能，可以即時監控所有 WebSocket 連線的狀態、統計資訊和錯誤訊息。

## 主要功能

### 1. 連線追蹤
- **即時狀態監控**：追蹤每個連線的狀態（已連線、已斷線、錯誤）
- **連線資訊**：記錄連線 ID、IP 位址、User Agent
- **時間追蹤**：記錄連線時間、斷線時間、最後 Ping 時間

### 2. 訊息統計
- **發送訊息數**：追蹤每個連線發送的訊息總數
- **接收訊息數**：追蹤每個連線接收的訊息總數
- **平均訊息數**：計算每個連線的平均訊息數量

### 3. 錯誤追蹤
- **錯誤計數**：記錄每個連線的錯誤次數
- **錯誤訊息**：保存最後一次錯誤的完整訊息
- **錯誤狀態**：標記有錯誤的連線

### 4. 統計資訊
- **目前連線數**：顯示當前活躍的連線數量
- **總連線數**：顯示歷史總連線數
- **今日連線數**：顯示今天的連線數
- **平均連線時長**：計算連線的平均持續時間
- **每日趨勢**：顯示最近 7 天的連線趨勢

## API 端點

### 1. 獲取連線列表
```
GET /api/websocket/connections
```

**查詢參數：**
- `status`: 篩選狀態（all, connected, disconnected, error）
- `page`: 頁碼（預設：1）
- `limit`: 每頁數量（預設：50）

**回應範例：**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "1",
        "connectionId": "7f000001000000001",
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "status": "connected",
        "connectedAt": "2026-01-18 17:00:00",
        "disconnectedAt": null,
        "lastPingAt": "2026-01-18 17:05:00",
        "messagesSent": 10,
        "messagesReceived": 5,
        "errorCount": 0,
        "lastError": null,
        "metadata": {}
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

### 2. 獲取統計資訊
```
GET /api/websocket/stats
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "activeConnections": 5,
    "totalConnections": 100,
    "errorConnections": 2,
    "todayConnections": 15,
    "avgConnectionDuration": 120.5,
    "dailyTrends": [
      {
        "date": "2026-01-18",
        "count": 15,
        "active": 5,
        "errors": 1
      }
    ],
    "messageStats": {
      "totalSent": 1000,
      "totalReceived": 500,
      "avgSentPerConnection": 10.0,
      "avgReceivedPerConnection": 5.0
    },
    "recentErrors": [
      {
        "connectionId": "7f000001000000001",
        "ipAddress": "127.0.0.1",
        "error": "Connection timeout",
        "errorCount": 1,
        "connectedAt": "2026-01-18 17:00:00"
      }
    ]
  }
}
```

## 前端介面

在「API 使用紀錄」頁面新增了 WebSocket 連線追蹤區塊，包含：

### 統計卡片
- 目前連線數
- 總連線數
- 錯誤連線數
- 已發送訊息數

### 連線列表
顯示所有連線的詳細資訊：
- 連線 ID
- IP 位址
- 狀態（已連線/已斷線/錯誤）
- 連線時間
- 最後 Ping 時間
- 訊息統計（發送/接收）
- 錯誤次數

### 篩選功能
- 按狀態篩選（所有/已連線/已斷線/錯誤）

### 詳情檢視
點擊「詳情」按鈕可查看：
- 完整連線資訊
- 連線時長
- 詳細訊息統計
- 完整錯誤訊息
- 額外的 metadata

## 資料庫結構

### websocket_connections 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵 |
| connection_id | VARCHAR(100) | Workerman 連線 ID |
| ip_address | VARCHAR(45) | IP 位址 |
| user_agent | TEXT | User Agent |
| status | ENUM | 狀態（connected, disconnected, error） |
| connected_at | DATETIME | 連線時間 |
| disconnected_at | DATETIME | 斷線時間 |
| last_ping_at | DATETIME | 最後 Ping 時間 |
| messages_sent | INT | 發送訊息數 |
| messages_received | INT | 接收訊息數 |
| error_count | INT | 錯誤次數 |
| last_error | TEXT | 最後錯誤訊息 |
| metadata | JSON | 額外資訊 |

## 使用說明

### 1. 查看連線狀態
1. 登入系統
2. 進入「API 使用紀錄」頁面
3. 在頁面頂部查看 WebSocket 連線追蹤區塊
4. 查看統計卡片了解整體狀況

### 2. 篩選連線
1. 使用狀態下拉選單篩選特定狀態的連線
2. 查看篩選後的連線數量

### 3. 查看詳情
1. 點擊連線列表中的「詳情」按鈕
2. 在彈出視窗中查看完整資訊
3. 如有錯誤，可查看完整的錯誤訊息

### 4. 監控錯誤
1. 查看「錯誤連線」統計卡片
2. 使用狀態篩選器選擇「錯誤」
3. 查看有錯誤的連線列表
4. 點擊詳情查看完整錯誤訊息

## 技術實作

### 後端
- **WebSocketServer.php**：更新 WebSocket 伺服器，在連線、斷線、訊息和錯誤事件時記錄資訊
- **WebSocketController.php**：提供 API 端點查詢連線和統計資訊
- **websocket_db_helper.php**：提供資料庫操作的 helper 函數

### 前端
- **types/index.ts**：新增 WebSocketConnection 和 WebSocketStats 類型定義
- **NotificationContext.tsx**：新增 WebSocket 資料獲取函數
- **ApiUsage.tsx**：新增 WebSocket 追蹤 UI 組件

## 注意事項

1. **效能考量**：大量連線時，建議使用分頁和篩選功能
2. **資料保留**：建議定期清理舊的連線記錄以節省空間
3. **即時性**：統計資訊可能有輕微延遲，建議使用重新整理按鈕獲取最新資料
4. **錯誤處理**：系統會自動記錄所有錯誤，包括連線錯誤和發送錯誤

## 未來改進

- [ ] 新增即時更新功能（WebSocket 推送）
- [ ] 新增連線地理位置顯示
- [ ] 新增連線時長圖表
- [ ] 新增自動清理舊記錄功能
- [ ] 新增匯出功能
- [ ] 新增警報通知（錯誤率過高時）
