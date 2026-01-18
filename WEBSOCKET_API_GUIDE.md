# NotifyHub WebSocket API 使用文件

本文件說明如何對接 NotifyHub 的即時通知 WebSocket 服務。透過此伺服器，Windows Client 可以實現即時接收訊息，而無需傳統的輪詢（Polling）。

## 1. 連線資訊

*   **連線網址 (生產環境 - 推薦)**: `wss://notify.try-8verything.com/ws` (透過 Nginx 反向代理，支援 SSL)
*   **連線網址 (開發環境)**: `ws://[伺服器IP]:8080` (直接連接背景服務)
*   **通訊協定**: 標準 WebSocket (RFC 6455)
*   **資料格式**: JSON

## 2. 訊息格式

伺服器推送出的訊息採用統一的 JSON 結構。

### 2.1 新通知推送 (`new_notification`)
當系統建立新的 Windows 通知（例如 CI/CD 部署完成）時，會立即推送此訊息。

**Payload 範例:**
```json
{
  "type": "new_notification",
  "data": {
    "id": 1,
    "type": "cicd",
    "title": "✅ 生產環境部署成功",
    "message": "NotifyHub 已於 2026-01-16 22:30 成功完成藍綠部署轉換。",
    "repo": "13g7895123/notification",
    "branch": "main",
    "commit_sha": "90866a7",
    "priority": "normal",
    "status": "pending",
    "action_url": "https://github.com/...",
    "created_at": "2026-01-16T15:00:00.000000Z"
  }
}
```

---

## 3. 客戶端操作規範 (Windows Client)

### 3.1 心跳維持 (Heartbeat)
為了避免網路防火牆或負載均衡器（如 Nginx）因連線閒置而強制斷開，建議客戶端每 30-60 秒發送一次 Ping 訊息。

*   **客戶端發送**: `{"type": "ping"}`
*   **伺服器回應**: `{"type": "pong", "time": 1737039600}`

### 3.2 自動重連機制
WebSocket 連線可能因伺服器啟動或網路波動中斷。建議實作以下邏輯：
1.  **偵測斷線**: 監聽 `onClose` 或 `onError` 事件。
2.  **指數退避重連**: 
    *   第 1 次失敗：5 秒後重連。
    *   第 2 次失敗：10 秒後重連。
    *   依此類推，直到恢復連線。

### 3.3 狀態反饋 (回調 HTTP API)
WebSocket 目前僅用於**單向實時接收**。當客戶端顯示通知後，若需要更新資料庫狀態（如變更為 `delivered` 或 `read`），**請依然呼叫現有的 HTTP API**：

*   **Endpoint**: `PATCH /api/notifications/windows/{id}/status`
*   **Body**: `{"status": "delivered"}`

---

## 4. 伺服器架構說明 (後端開發者參考)

*   **核心引擎**: [Workerman](http://www.workerman.net/) (PHP 高效能 Socket 框架)
*   **端口配置**:
    *   `8080` (WebSocket): 對外部客戶端連線，由 `WEBSOCKET_PORT` 環境變數控制。
    *   `8081` (TCP Text): 對內部 API 推送連線，不對外開放。
*   **推送流程**:
    1.  API (PHP-FPM) 收到建立通知請求。
    2.  呼叫 `websocket_helper` 中的 `ws_push_notification()`。
    3.  透過內部 TCP 連線發送資料給 WebSocket 背景進程。
    4.  WebSocket 背景進程將訊息廣播給所有 `connections`。

---

## 5. 測試工具建議
您可以使用 [Postman](https://www.postman.com/) 或瀏覽器套件 [WebSocket Test Client] 來驗證連線：
1.  輸入 `wss://notify.try-8verything.com/ws`。
2.  點擊 Connect。
3.  建立一筆新的測試通知。
4.  觀察測試工具是否即時彈出 `new_notification` 訊息。
