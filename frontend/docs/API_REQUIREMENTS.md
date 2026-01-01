# 🔌 NotifyHub 前端 API 需求文件

## 目錄

- [概述](#概述)
- [認證系統 API](#認證系統-api)
- [使用者管理 API](#使用者管理-api)
- [通知渠道 API](#通知渠道-api)
- [通知訊息 API](#通知訊息-api)
- [訊息模板 API](#訊息模板-api)
- [API 金鑰管理 API](#api-金鑰管理-api)
- [API 使用紀錄 API](#api-使用紀錄-api)
- [統計數據 API](#統計數據-api)
- [排程器管理 API](#排程器管理-api)
- [錯誤處理](#錯誤處理)
- [資料類型定義](#資料類型定義)

---

## 概述

### Base URL

```
開發環境: http://localhost:3000/api
生產環境: https://your-domain.com/api
```

### 通用 Headers

```http
Content-Type: application/json
Accept: application/json
```

### 認證方式

前端支援兩種認證方式：

1. **Session 認證**（網頁登入）
   - 登入後由後端設定 Cookie
   - 後續請求自動帶 Cookie

2. **API Key 認證**（外部整合）
   ```http
   Authorization: Bearer <API_KEY>
   ```

---

## 認證系統 API

### POST /api/auth/login

使用者登入。

**請求：**
```json
{
  "email": "admin@notifyhub.com",
  "password": "admin123"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "Admin",
      "email": "admin@notifyhub.com",
      "role": "admin",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**失敗回應 (401)：**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "電子郵件或密碼錯誤"
  }
}
```

---

### POST /api/auth/logout

使用者登出。

**請求：** 無需 Body

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "已成功登出"
}
```

---

### GET /api/auth/me

取得當前登入使用者資訊。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "username": "Admin",
    "email": "admin@notifyhub.com",
    "role": "admin",
    "avatar": null
  }
}
```

**未登入回應 (401)：**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未登入或登入已過期"
  }
}
```

---

### PUT /api/auth/profile

更新當前使用者個人資料。

**請求：**
```json
{
  "username": "New Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "username": "New Name",
    "email": "admin@notifyhub.com",
    "role": "admin",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

### PUT /api/auth/password

變更當前使用者密碼。

**請求：**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "密碼已變更"
}
```

---

## 使用者管理 API

> ⚠️ 以下 API 僅限管理員 (role: admin) 存取

### GET /api/users

取得使用者列表。

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `search` | string | 搜尋名稱或 Email |
| `role` | string | 篩選角色 (admin/user) |
| `status` | string | 篩選狀態 (active/inactive) |
| `page` | number | 頁碼，預設 1 |
| `limit` | number | 每頁筆數，預設 20 |

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "1",
        "username": "Admin",
        "email": "admin@notifyhub.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLoginAt": "2024-12-25T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST /api/users

建立新使用者。

**請求：**
```json
{
  "username": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user",
  "status": "active"
}
```

**成功回應 (201)：**
```json
{
  "success": true,
  "data": {
    "id": "6",
    "username": "New User",
    "email": "newuser@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-12-25T12:00:00Z"
  }
}
```

---

### PUT /api/users/:id

更新使用者資料。

**請求：**
```json
{
  "username": "Updated Name",
  "role": "admin",
  "status": "active"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "6",
    "username": "Updated Name",
    "email": "newuser@example.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

### DELETE /api/users/:id

刪除使用者。

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "使用者已刪除"
}
```

---

### PUT /api/users/:id/status

切換使用者狀態。

**請求：**
```json
{
  "status": "inactive"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "6",
    "status": "inactive"
  }
}
```

---

### PUT /api/users/:id/password

重設使用者密碼（管理員操作）。

**請求：**
```json
{
  "newPassword": "newpassword123"
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "密碼已重設"
}
```

---

## 通知渠道 API

### GET /api/channels

取得通知渠道列表。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "line",
      "name": "LINE 主要通知",
      "enabled": true,
      "config": {
        "channelAccessToken": "xxx...xxx",
        "channelSecret": "xxx",
        "targetId": "U1234567890"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-12-20T00:00:00Z"
    },
    {
      "id": "2",
      "type": "telegram",
      "name": "Telegram 群組",
      "enabled": true,
      "config": {
        "botToken": "123456:ABC-DEF...",
        "chatId": "-1001234567890",
        "parseMode": "HTML"
      },
      "createdAt": "2024-02-01T00:00:00Z",
      "updatedAt": "2024-12-15T00:00:00Z"
    }
  ]
}
```

---

### POST /api/channels

建立新渠道。

**請求 (LINE)：**
```json
{
  "type": "line",
  "name": "新 LINE 渠道",
  "enabled": true,
  "config": {
    "channelAccessToken": "your-channel-access-token",
    "channelSecret": "your-channel-secret",
    "targetId": "U1234567890"
  }
}
```

**請求 (Telegram)：**
```json
{
  "type": "telegram",
  "name": "新 Telegram 渠道",
  "enabled": true,
  "config": {
    "botToken": "your-bot-token",
    "chatId": "-1001234567890",
    "parseMode": "HTML"
  }
}
```

**成功回應 (201)：**
```json
{
  "success": true,
  "data": {
    "id": "3",
    "type": "line",
    "name": "新 LINE 渠道",
    "enabled": true,
    "config": { ... },
    "createdAt": "2024-12-25T12:00:00Z"
  }
}
```

---

### PUT /api/channels/:id

更新渠道。

**請求：**
```json
{
  "name": "更新的渠道名稱",
  "enabled": false,
  "config": { ... }
}
```

---

### DELETE /api/channels/:id

刪除渠道。

---

### PUT /api/channels/:id/toggle

切換渠道啟用狀態。

---

### POST /api/channels/:id/test

測試渠道連線。

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "測試訊息發送成功"
}
```

**失敗回應 (400)：**
```json
{
  "success": false,
  "error": {
    "code": "CHANNEL_TEST_FAILED",
    "message": "無法連接到渠道，請檢查設定"
  }
}
```

---

## 通知訊息 API

### GET /api/messages

取得訊息列表。

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `search` | string | 搜尋標題或內容 |
| `status` | string | 篩選狀態 |
| `page` | number | 頁碼 |
| `limit` | number | 每頁筆數 |

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "1",
        "title": "系統維護公告",
        "content": "系統將於今晚進行維護...",
        "status": "sent",
        "channelIds": ["1", "2"],
        "createdAt": "2024-12-25T10:00:00Z",
        "sentAt": "2024-12-25T10:00:05Z",
        "results": [
          {
            "channelId": "1",
            "channelName": "LINE 主要通知",
            "channelType": "line",
            "success": true,
            "sentAt": "2024-12-25T10:00:05Z"
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST /api/messages/send

發送通知訊息。

**請求：**
```json
{
  "title": "通知標題",
  "content": "通知內容",
  "channelIds": ["1", "2"],
  "scheduledAt": null
}
```

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456",
    "status": "sent",
    "results": [
      {
        "channelId": "1",
        "channelName": "LINE 主要通知",
        "success": true,
        "sentAt": "2024-12-25T12:00:00Z"
      }
    ]
  }
}
```

---

### DELETE /api/messages/:id

刪除訊息。

---

## 訊息模板 API

### GET /api/templates

取得模板列表。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "系統維護通知",
      "title": "系統維護公告",
      "content": "親愛的用戶，系統將於 {{date}} 進行維護...",
      "channelTypes": ["line", "telegram"],
      "variables": ["date", "duration"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-12-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/templates

建立模板。

**請求：**
```json
{
  "name": "新模板",
  "title": "{{type}} 通知",
  "content": "內容: {{message}}",
  "channelTypes": ["line"],
  "variables": ["type", "message"]
}
```

---

### PUT /api/templates/:id

更新模板。

---

### DELETE /api/templates/:id

刪除模板。

---

## API 金鑰管理 API

### GET /api/api-keys

取得 API 金鑰列表。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "生產環境 API",
      "key": "nk_live_xxxxxxxxxxxx",
      "prefix": "nk_live_xxxx...xxxx",
      "permissions": ["send", "read_channels"],
      "rateLimit": 60,
      "usageCount": 1234,
      "enabled": true,
      "expiresAt": "2025-12-31T23:59:59Z",
      "lastUsedAt": "2024-12-25T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/api-keys

建立 API 金鑰。

**請求：**
```json
{
  "name": "新 API 金鑰",
  "permissions": ["send", "read_channels", "read_logs"],
  "rateLimit": 100,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**成功回應 (201)：**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "新 API 金鑰",
    "key": "nk_live_xxxxxxxxxxxxxxxxxxxxxxxx",
    "permissions": ["send", "read_channels", "read_logs"],
    "rateLimit": 100,
    "enabled": true,
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2024-12-25T12:00:00Z"
  },
  "message": "請立即保存金鑰，此為唯一一次顯示完整金鑰的機會"
}
```

---

### PUT /api/api-keys/:id

更新 API 金鑰設定。

**請求：**
```json
{
  "name": "更新的名稱",
  "permissions": ["send"],
  "rateLimit": 30,
  "enabled": false
}
```

---

### DELETE /api/api-keys/:id

刪除 API 金鑰。

---

### PUT /api/api-keys/:id/toggle

切換金鑰啟用狀態。

---

### POST /api/api-keys/:id/regenerate

重新產生金鑰。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "key": "nk_live_new_key_xxxxxxxx"
  },
  "message": "金鑰已重新產生，請立即保存"
}
```

---

## API 使用紀錄 API

### GET /api/api-usage/logs

取得 API 使用紀錄。

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `apiKeyId` | string | 篩選特定金鑰 |
| `status` | string | 篩選狀態 (success/failed) |
| `startDate` | string | 開始日期 |
| `endDate` | string | 結束日期 |
| `page` | number | 頁碼 |
| `limit` | number | 每頁筆數 |

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "1",
        "apiKeyId": "1",
        "apiKeyName": "生產環境 API",
        "endpoint": "/api/v1/send",
        "method": "POST",
        "statusCode": 200,
        "success": true,
        "responseTime": 245,
        "ip": "192.168.1.100",
        "userAgent": "MyApp/1.0",
        "requestBody": { "title": "...", "content": "..." },
        "errorMessage": null,
        "createdAt": "2024-12-25T10:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /api/api-usage/stats

取得 API 使用統計。

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `period` | string | 統計週期 (day/week/month) |

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "totalRequests": 5000,
    "successCount": 4850,
    "failedCount": 150,
    "successRate": 97.0,
    "avgResponseTime": 180,
    "endpointStats": {
      "/api/v1/send": 3500,
      "/api/v1/channels": 1000,
      "/api/v1/logs": 500
    },
    "dailyStats": [
      { "date": "2024-12-25", "requests": 500, "success": 490, "failed": 10 },
      { "date": "2024-12-24", "requests": 480, "success": 475, "failed": 5 }
    ]
  }
}
```

---

## 統計數據 API

### GET /api/stats/dashboard

取得儀表板統計數據。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "totalSent": 1247,
    "totalSuccess": 1198,
    "totalFailed": 49,
    "successRate": 96.1,
    "totalChannels": 3,
    "activeChannels": 2,
    "recentMessages": [
      {
        "id": "1",
        "title": "系統通知",
        "status": "sent",
        "createdAt": "2024-12-25T10:00:00Z"
      }
    ],
    "recentLogs": [
      {
        "id": "1",
        "channelName": "LINE",
        "title": "測試",
        "status": "success",
        "sentAt": "2024-12-25T10:00:00Z"
      }
    ],
    "trendData": [
      { "date": "2024-12-19", "sent": 40, "success": 38, "failed": 2 },
      { "date": "2024-12-20", "sent": 45, "success": 44, "failed": 1 }
    ]
  }
}
```

---

## 排程器管理 API

> ⚠️ 以下 API 僅限管理員 (role: admin) 存取

### GET /api/scheduler/status

取得排程器當前狀態與健康檢查結果。

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "status": "running",
    "lastRun": "2024-12-25T12:00:00Z",
    "nextRun": "2024-12-25T12:01:00Z",
    "daemonStatus": "active",
    "checks": [
      {
        "name": "Database Connection",
        "status": "ok",
        "message": "Connected"
      },
      {
        "name": "Queue Worker",
        "status": "ok",
        "message": "3 workers active"
      },
      {
        "name": "Cron Job",
        "status": "warning",
        "message": "Last run was 5 minutes ago"
      }
    ]
  }
}
```

---

### GET /api/scheduler/logs

取得排程器執行日誌。

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| `limit` | number | 筆數，預設 50 |

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-12-25T12:00:00Z",
      "level": "info",
      "message": "Starting scheduled task: ProcessScheduledMessages",
      "context": { "task": "ProcessScheduledMessages" }
    },
    {
      "timestamp": "2024-12-25T12:00:05Z",
      "level": "info",
      "message": "Successfully processed 5 messages",
      "context": { "count": 5 }
    }
  ]
}
```

---

### POST /api/scheduler/stop

停止排程器守護進程。

**請求：** 無需 Body

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已停止",
    "pid": 12345,
    "stoppedAt": "2024-12-25T12:05:00Z"
  }
}
```

**失敗回應 (400)：**
```json
{
  "success": false,
  "error": {
    "code": "SCHEDULER_NOT_RUNNING",
    "message": "排程器未運行"
  }
}
```

---

### POST /api/scheduler/start

啟動排程器守護進程。

**請求：** 無需 Body

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已啟動",
    "pid": 12345,
    "startedAt": "2024-12-25T12:06:00Z"
  }
}
```

**成功回應（已在運行）(200)：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已在運行中",
    "pid": 12345,
    "status": "already_running"
  }
}
```

**失敗回應 (500)：**
```json
{
  "success": false,
  "error": {
    "code": "START_FAILED",
    "message": "啟動失敗，請檢查日誌"
  }
}
```

---

### POST /api/scheduler/restart

重啟排程器守護進程（先停止再啟動）。

**請求：** 無需 Body

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "message": "排程器已重啟",
    "oldPid": 12345,
    "newPid": 12346,
    "restartedAt": "2024-12-25T12:07:00Z"
  }
}
```

**失敗回應 (500)：**
```json
{
  "success": false,
  "error": {
    "code": "RESTART_FAILED",
    "message": "停止排程器失敗"
  }
}
```

---

## 錯誤處理

### 標準錯誤回應格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人類可讀的錯誤訊息",
    "details": { }
  }
}
```

### 錯誤碼列表

| HTTP 狀態碼 | 錯誤碼 | 說明 |
|------------|--------|------|
| 400 | VALIDATION_ERROR | 請求參數驗證失敗 |
| 400 | INVALID_REQUEST | 請求格式錯誤 |
| 401 | UNAUTHORIZED | 未認證 |
| 401 | INVALID_CREDENTIALS | 登入憑證錯誤 |
| 401 | TOKEN_EXPIRED | Token 已過期 |
| 401 | INVALID_API_KEY | API 金鑰無效 |
| 403 | FORBIDDEN | 權限不足 |
| 403 | API_KEY_DISABLED | API 金鑰已停用 |
| 404 | NOT_FOUND | 資源不存在 |
| 409 | CONFLICT | 資源衝突 |
| 429 | RATE_LIMIT_EXCEEDED | 超過速率限制 |
| 500 | INTERNAL_ERROR | 伺服器內部錯誤 |
| 502 | CHANNEL_ERROR | 渠道連接錯誤 |

---

## 資料類型定義

### User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

interface UserWithAuth extends User {
  password: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLoginAt?: Date;
}
```

### NotificationChannel

```typescript
type ChannelType = 'line' | 'telegram';

interface NotificationChannel {
  id: string;
  type: ChannelType;
  name: string;
  enabled: boolean;
  config: LineConfig | TelegramConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  targetId: string;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
  parseMode: 'HTML' | 'Markdown';
}
```

### NotificationMessage

```typescript
type MessageStatus = 'pending' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed';

interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  status: MessageStatus;
  channelIds: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  results?: MessageResult[];
}

interface MessageResult {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  success: boolean;
  sentAt: Date;
  error?: string;
}
```

### ApiKey

```typescript
type ApiPermission = 'send' | 'read_channels' | 'read_logs' | 'read_stats';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: ApiPermission[];
  rateLimit: number;
  usageCount: number;
  enabled: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### ApiUsageLog

```typescript
interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  success: boolean;
  responseTime: number;
  ip: string;
  userAgent: string;
  requestBody?: object;
  errorMessage?: string;
  createdAt: Date;
}
```

---

## 附錄：前端 Context 使用對照表

| Context 函數 | 對應 API |
|-------------|----------|
| `login()` | POST /api/auth/login |
| `logout()` | POST /api/auth/logout |
| `updateProfile()` | PUT /api/auth/profile |
| `addUser()` | POST /api/users |
| `updateUser()` | PUT /api/users/:id |
| `deleteUser()` | DELETE /api/users/:id |
| `toggleUserStatus()` | PUT /api/users/:id/status |
| `resetUserPassword()` | PUT /api/users/:id/password |
| `addChannel()` | POST /api/channels |
| `updateChannel()` | PUT /api/channels/:id |
| `deleteChannel()` | DELETE /api/channels/:id |
| `toggleChannel()` | PUT /api/channels/:id/toggle |
| `testChannel()` | POST /api/channels/:id/test |
| `sendMessage()` | POST /api/messages/send |
| `deleteMessage()` | DELETE /api/messages/:id |
| `addTemplate()` | POST /api/templates |
| `updateTemplate()` | PUT /api/templates/:id |
| `deleteTemplate()` | DELETE /api/templates/:id |
| `addApiKey()` | POST /api/api-keys |
| `updateApiKey()` | PUT /api/api-keys/:id |
| `deleteApiKey()` | DELETE /api/api-keys/:id |
| `toggleApiKey()` | PUT /api/api-keys/:id/toggle |
| `regenerateApiKey()` | POST /api/api-keys/:id/regenerate |

---

*最後更新：2024-12-25*
