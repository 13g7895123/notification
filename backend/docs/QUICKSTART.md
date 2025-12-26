# 🚀 NotifyHub Backend 快速開始

## 環境需求

- Docker & Docker Compose
- PHP 8.3+ (如果本地開發)
- Composer (如果本地開發)

---

## 快速啟動

### 使用 Docker（推薦）

```bash
# 1. 啟動所有服務
docker compose up -d

# 2. 查看日誌，等待啟動完成
docker compose logs -f backend

# 3. 初始化資料庫（執行 Seeder）
docker compose exec backend php spark db:seed AdminSeeder

# 4. 測試 API
curl http://localhost:9208/
```

### 預設帳號

| Email | 密碼 | 角色 |
|-------|------|------|
| admin@notifyhub.com | admin123 | admin |
| user@notifyhub.com | admin123 | user |

---

## API 測試

### 登入取得 Token

```bash
curl -X POST http://localhost:9208/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@notifyhub.com",
    "password": "admin123"
  }'
```

回應：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "Admin",
      "email": "admin@notifyhub.com",
      "role": "admin",
      "avatar": null
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 使用 Token 存取 API

```bash
# 設定 Token
TOKEN="your_jwt_token_here"

# 取得使用者列表
curl http://localhost:9208/api/users \
  -H "Authorization: Bearer $TOKEN"

# 取得渠道列表
curl http://localhost:9208/api/channels \
  -H "Authorization: Bearer $TOKEN"

# 取得儀表板統計
curl http://localhost:9208/api/stats/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 設定通知渠道

### LINE 渠道

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立一個 Messaging API Channel
3. 取得 Channel Access Token 和 Channel Secret
4. 取得目標 User ID 或 Group ID

```bash
curl -X POST http://localhost:9208/api/channels \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "line",
    "name": "我的 LINE 通知",
    "enabled": true,
    "config": {
      "channelAccessToken": "YOUR_CHANNEL_ACCESS_TOKEN",
      "channelSecret": "YOUR_CHANNEL_SECRET",
      "targetId": "U1234567890abcdef"
    }
  }'
```

### Telegram 渠道

1. 與 [@BotFather](https://t.me/BotFather) 對話建立 Bot
2. 取得 Bot Token
3. 將 Bot 加入群組或取得 Chat ID

```bash
curl -X POST http://localhost:9208/api/channels \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "telegram",
    "name": "我的 Telegram 通知",
    "enabled": true,
    "config": {
      "botToken": "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
      "chatId": "-1001234567890",
      "parseMode": "HTML"
    }
  }'
```

### 測試渠道

```bash
# 取得渠道 ID（從 GET /api/channels 回應中取得）
CHANNEL_ID="your_channel_id"

# 發送測試訊息
curl -X POST "http://localhost:9208/api/channels/$CHANNEL_ID/test" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 發送訊息

```bash
# 發送訊息到指定渠道
curl -X POST http://localhost:9208/api/messages/send \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "系統通知",
    "content": "這是一則測試訊息，來自 NotifyHub！",
    "channelIds": ["channel-uuid-1", "channel-uuid-2"]
  }'
```

---

## 建立 API 金鑰

用於外部系統整合：

```bash
curl -X POST http://localhost:9208/api/api-keys \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "我的應用程式",
    "permissions": ["send", "read_channels"],
    "rateLimit": 60,
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

回應會包含完整的 API 金鑰，請立即保存！

---

## 常見問題

### Q: 容器啟動後無法連線？

等待容器完成初始化（約 60-90 秒）：
```bash
docker compose logs -f backend
```

看到 `CodeIgniter development server started` 表示已就緒。

### Q: 如何重設 Admin 密碼？

```bash
docker compose exec backend php spark db:seed AdminSeeder
```

### Q: 如何查看 API 日誌？

```bash
docker compose logs -f backend
```

或查看檔案：
```bash
docker compose exec backend cat writable/logs/log-$(date +%Y-%m-%d).log
```

### Q: 資料庫在哪裡？

資料儲存在 Docker Volume：
```bash
docker volume inspect notification_mariadb_data
```

---

## 下一步

- 📖 閱讀 [API 文件](./API.md) 了解完整 API 規格
- 🏗️ 閱讀 [架構說明](./ARCHITECTURE.md) 了解系統設計

---

*最後更新：2024-12-26*
