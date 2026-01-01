# 排程器控制 API 測試指南

## API 端點

所有排程器控制 API 都需要管理員權限，請先登入取得 JWT Token。

### 1. 取得排程器狀態

```bash
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "status": "running",
    "pid": 123,
    "uptime": 3600,
    "lastHeartbeat": "2024-12-25T12:00:00Z",
    "checks": [
      {
        "name": "Heartbeat Check",
        "status": "ok",
        "message": "Last heartbeat: 5s ago"
      },
      {
        "name": "Database Connection",
        "status": "ok",
        "message": "Connected"
      }
    ]
  }
}
```

---

### 2. 停止排程器

```bash
curl -X POST http://localhost:8080/api/scheduler/stop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已停止",
    "pid": 123,
    "stoppedAt": "2024-12-25T12:05:00Z"
  }
}
```

**錯誤情況（排程器未運行）：**
```json
{
  "success": false,
  "message": "排程器未運行"
}
```

---

### 3. 啟動排程器

```bash
curl -X POST http://localhost:8080/api/scheduler/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已啟動",
    "pid": 456,
    "startedAt": "2024-12-25T12:06:00Z"
  }
}
```

**已在運行時：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已在運行中",
    "pid": 123,
    "status": "already_running"
  }
}
```

---

### 4. 重啟排程器

```bash
curl -X POST http://localhost:8080/api/scheduler/restart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已重啟",
    "oldPid": 123,
    "newPid": 789,
    "restartedAt": "2024-12-25T12:07:00Z"
  }
}
```

---

### 5. 取得排程器日誌

```bash
# 取得最近 50 筆日誌（預設）
curl -X GET "http://localhost:8080/api/scheduler/logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"

# 取得最近 100 筆日誌
curl -X GET "http://localhost:8080/api/scheduler/logs?limit=100" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -w "\n"
```

**預期回應：**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-12-25T12:00:00Z",
      "level": "info",
      "message": "Starting scheduled task: ProcessScheduledMessages",
      "context": null
    },
    {
      "timestamp": "2024-12-25T12:00:05Z",
      "level": "info",
      "message": "Successfully processed 5 messages",
      "context": null
    }
  ]
}
```

---

## 完整測試流程

### 1. 登入取得 Token

```bash
# 登入
RESPONSE=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@notifyhub.com",
    "password": "admin123"
  }' -s)

# 提取 Token（需要 jq 工具）
TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"
```

### 2. 測試排程器控制流程

```bash
# 1. 檢查當前狀態
echo "=== 檢查排程器狀態 ==="
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 2

# 2. 停止排程器
echo -e "\n=== 停止排程器 ==="
curl -X POST http://localhost:8080/api/scheduler/stop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 2

# 3. 確認已停止
echo -e "\n=== 確認狀態（應為已停止） ==="
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 2

# 4. 啟動排程器
echo -e "\n=== 啟動排程器 ==="
curl -X POST http://localhost:8080/api/scheduler/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 5

# 5. 確認已啟動
echo -e "\n=== 確認狀態（應為運行中） ==="
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 2

# 6. 測試重啟
echo -e "\n=== 重啟排程器 ==="
curl -X POST http://localhost:8080/api/scheduler/restart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

sleep 5

# 7. 確認重啟成功
echo -e "\n=== 確認最終狀態 ==="
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s

# 8. 查看日誌
echo -e "\n=== 查看最近 20 筆日誌 ==="
curl -X GET "http://localhost:8080/api/scheduler/logs?limit=20" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n" -s
```

---

## 預期行為

### 停止排程器時
1. 發送 SIGTERM 信號給排程器進程
2. 等待最多 10 秒讓進程正常結束
3. 如果未結束，發送 SIGKILL 強制終止
4. 刪除 PID 檔案
5. 記錄操作日誌

### 啟動排程器時
1. 檢查是否已有 PID 檔案
2. 如果檔案存在但進程不存在，清理檔案
3. 執行 `nohup php spark scheduler:daemon` 背景啟動
4. 等待最多 5 秒確認 PID 檔案生成
5. 驗證進程確實在運行
6. 記錄操作日誌

### 重啟排程器時
1. 先執行停止流程
2. 等待 2 秒
3. 執行啟動流程
4. 記錄新舊 PID 以供追蹤

---

## 注意事項

### Docker 環境
- 在 Docker 環境中，排程器由 Supervisor 管理
- 手動停止後，Supervisor 會在短時間內自動重啟
- 如需永久停止，需修改 `backend/docker/supervisord.conf` 並重啟容器

### 權限檢查
- 所有排程器控制 API 都需要管理員權限（`role: admin`）
- 未登入或權限不足會返回 401/403 錯誤

### 進程檢測
- 使用 `posix_kill($pid, 0)` 檢測進程存在性（Docker 環境）
- 如果函數不可用，使用 `ps` 命令替代

### PID 檔案位置
- `backend/writable/pids/scheduler.pid`
- 包含當前運行的排程器進程 PID

### 日誌檔案位置
- 啟動日誌：`backend/writable/logs/scheduler_startup.log`
- 運行日誌：`backend/writable/logs/scheduler.log`

---

## 故障排查

### 排程器無法停止
1. 檢查 PID 檔案是否存在：`ls -la backend/writable/pids/`
2. 檢查進程是否存在：`docker exec notifyhub_backend ps aux | grep scheduler`
3. 手動終止：`docker exec notifyhub_backend kill -9 <PID>`

### 排程器無法啟動
1. 檢查啟動日誌：`docker exec notifyhub_backend cat /var/www/html/writable/logs/scheduler_startup.log`
2. 檢查 PHP CLI 可執行性：`docker exec notifyhub_backend which php`
3. 手動啟動測試：`docker exec notifyhub_backend php /var/www/html/spark scheduler:daemon`

### API 返回 401 未授權
1. 確認已登入並取得有效 Token
2. 確認使用者角色為 `admin`
3. 檢查 Token 是否過期

### API 返回 500 錯誤
1. 檢查後端日誌：`docker logs notifyhub_backend`
2. 檢查 PHP 錯誤日誌：`docker exec notifyhub_backend cat /var/www/html/writable/logs/log-*.php`
3. 確認檔案權限正確：`docker exec notifyhub_backend ls -la /var/www/html/writable/pids/`

---

*更新時間：2026-01-01*
