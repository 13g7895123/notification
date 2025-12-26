# 🔌 NotifyHub Backend API 文件

## 目錄

- [概述](#概述)
- [認證方式](#認證方式)
- [API 端點](#api-端點)
  - [認證系統](#認證系統-api)
  - [使用者管理](#使用者管理-api)
  - [通知渠道](#通知渠道-api)
  - [通知訊息](#通知訊息-api)
  - [訊息模板](#訊息模板-api)
  - [API 金鑰](#api-金鑰管理-api)
  - [API 使用紀錄](#api-使用紀錄-api)
  - [統計數據](#統計數據-api)
- [錯誤處理](#錯誤處理)
- [資料結構](#資料結構)

---

## 概述

### Base URL

```
開發環境: http://localhost:9208/api
生產環境: https://your-domain.com/api
```

### 通用 Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT_TOKEN>
```

### 統一回應格式

**成功回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功訊息（選填）"
}
```

**錯誤回應：**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人類可讀的錯誤訊息",
    "details": { ... }
  }
}
```

---

## 認證方式

### JWT Token 認證

1. 呼叫 `/api/auth/login` 取得 JWT Token
2. 在後續請求的 Header 中加入：
   ```
   Authorization: Bearer <your_jwt_token>
   ```
3. Token 有效期為 24 小時

### API Key 認證（外部整合）

```http
Authorization: Bearer <API_KEY>
```

---

## API 端點

### 認證系統 API

#### POST /api/auth/login

使用者登入，取得 JWT Token。

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
      "id": "550e8400-e29b-41d4-a716-446655440001",
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

#### POST /api/auth/logout

使用者登出。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "已成功登出"
}
```

---

#### GET /api/auth/me

取得當前登入使用者資訊。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "Admin",
    "email": "admin@notifyhub.com",
    "role": "admin",
    "avatar": null
  }
}
```

---

#### PUT /api/auth/profile

更新當前使用者個人資料。

**Headers:** `Authorization: Bearer <token>`

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
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "New Name",
    "email": "admin@notifyhub.com",
    "role": "admin",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

#### PUT /api/auth/password

變更當前使用者密碼。

**Headers:** `Authorization: Bearer <token>`

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

### 使用者管理 API

> ⚠️ 以下 API 僅限管理員 (role: admin) 存取

#### GET /api/users

取得使用者列表。

**Headers:** `Authorization: Bearer <token>`

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
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "Admin",
        "email": "admin@notifyhub.com",
        "role": "admin",
        "status": "active",
        "avatar": null,
        "createdAt": "2024-01-01 00:00:00",
        "lastLoginAt": "2024-12-25 10:30:00"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

#### POST /api/users

建立新使用者。

**Headers:** `Authorization: Bearer <token>`

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
    "id": "generated-uuid",
    "username": "New User",
    "email": "newuser@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-12-25 12:00:00"
  }
}
```

---

#### PUT /api/users/:id

更新使用者資料。

**Headers:** `Authorization: Bearer <token>`

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
    "id": "user-id",
    "username": "Updated Name",
    "email": "user@example.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

#### DELETE /api/users/:id

刪除使用者。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "使用者已刪除"
}
```

---

#### PUT /api/users/:id/status

切換使用者狀態。

**Headers:** `Authorization: Bearer <token>`

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
    "id": "user-id",
    "status": "inactive"
  }
}
```

---

#### PUT /api/users/:id/password

重設使用者密碼（管理員操作）。

**Headers:** `Authorization: Bearer <token>`

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

### 通知渠道 API

#### GET /api/channels

取得通知渠道列表。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "channel-uuid",
      "type": "line",
      "name": "LINE 主要通知",
      "enabled": true,
      "config": {
        "channelAccessToken": "xxx...xxx",
        "channelSecret": "xxx",
        "targetId": "U1234567890"
      },
      "createdAt": "2024-01-01 00:00:00",
      "updatedAt": "2024-12-20 00:00:00"
    }
  ]
}
```

---

#### POST /api/channels

建立新渠道。

**Headers:** `Authorization: Bearer <token>`

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
    "id": "generated-uuid",
    "type": "line",
    "name": "新 LINE 渠道",
    "enabled": true,
    "config": { ... },
    "createdAt": "2024-12-25 12:00:00"
  }
}
```

---

#### PUT /api/channels/:id

更新渠道。

**Headers:** `Authorization: Bearer <token>`

**請求：**
```json
{
  "name": "更新的渠道名稱",
  "enabled": false,
  "config": { ... }
}
```

---

#### DELETE /api/channels/:id

刪除渠道。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "渠道已刪除"
}
```

---

#### PUT /api/channels/:id/toggle

切換渠道啟用狀態。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "data": {
    "id": "channel-id",
    "enabled": false
  }
}
```

---

#### POST /api/channels/:id/test

測試渠道連線。

**Headers:** `Authorization: Bearer <token>`

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

### 通知訊息 API

#### GET /api/messages

取得訊息列表。

**Headers:** `Authorization: Bearer <token>`

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
        "id": "message-uuid",
        "title": "系統維護公告",
        "content": "系統將於今晚進行維護...",
        "status": "sent",
        "channelIds": ["channel-1", "channel-2"],
        "createdAt": "2024-12-25 10:00:00",
        "sentAt": "2024-12-25 10:00:05",
        "results": [
          {
            "channelId": "channel-1",
            "channelName": "LINE 主要通知",
            "channelType": "line",
            "success": true,
            "sentAt": "2024-12-25 10:00:05"
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

#### POST /api/messages/send

發送通知訊息。

**Headers:** `Authorization: Bearer <token>`

**請求：**
```json
{
  "title": "通知標題",
  "content": "通知內容",
  "channelIds": ["channel-1", "channel-2"],
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
        "channelId": "channel-1",
        "channelName": "LINE 主要通知",
        "success": true,
        "sentAt": "2024-12-25 12:00:00"
      }
    ]
  }
}
```

---

#### DELETE /api/messages/:id

刪除訊息。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "message": "訊息已刪除"
}
```

---

### 訊息模板 API

#### GET /api/templates

取得模板列表。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "template-uuid",
      "name": "系統維護通知",
      "title": "系統維護公告",
      "content": "親愛的用戶，系統將於 {{date}} 進行維護...",
      "channelTypes": ["line", "telegram"],
      "variables": ["date", "duration"],
      "createdAt": "2024-01-01 00:00:00",
      "updatedAt": "2024-12-01 00:00:00"
    }
  ]
}
```

---

#### POST /api/templates

建立模板。

**Headers:** `Authorization: Bearer <token>`

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

#### PUT /api/templates/:id

更新模板。

**Headers:** `Authorization: Bearer <token>`

---

#### DELETE /api/templates/:id

刪除模板。

**Headers:** `Authorization: Bearer <token>`

---

### API 金鑰管理 API

#### GET /api/api-keys

取得 API 金鑰列表。

**Headers:** `Authorization: Bearer <token>`

**成功回應 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": "key-uuid",
      "name": "生產環境 API",
      "key": "nk_live_xxxx...xxxx",
      "prefix": "nk_live_xxxx...xxxx",
      "permissions": ["send", "read_channels"],
      "rateLimit": 60,
      "usageCount": 1234,
      "enabled": true,
      "expiresAt": "2025-12-31 23:59:59",
      "lastUsedAt": "2024-12-25 10:00:00",
      "createdAt": "2024-01-01 00:00:00"
    }
  ]
}
```

---

#### POST /api/api-keys

建立 API 金鑰。

**Headers:** `Authorization: Bearer <token>`

**請求：**
```json
{
  "name": "新 API 金鑰",
  "permissions": ["send", "read_channels", "read_logs"],
  "rateLimit": 100,
  "expiresAt": "2025-12-31 23:59:59"
}
```

**成功回應 (201)：**
```json
{
  "success": true,
  "data": {
    "id": "key-uuid",
    "name": "新 API 金鑰",
    "key": "nk_live_xxxxxxxxxxxxxxxxxxxxxxxx",
    "permissions": ["send", "read_channels", "read_logs"],
    "rateLimit": 100,
    "enabled": true,
    "expiresAt": "2025-12-31 23:59:59",
    "createdAt": "2024-12-25 12:00:00"
  },
  "message": "請立即保存金鑰，此為唯一一次顯示完整金鑰的機會"
}
```

---

#### PUT /api/api-keys/:id

更新 API 金鑰設定。

**Headers:** `Authorization: Bearer <token>`

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

#### DELETE /api/api-keys/:id

刪除 API 金鑰。

**Headers:** `Authorization: Bearer <token>`

---

#### PUT /api/api-keys/:id/toggle

切換金鑰啟用狀態。

**Headers:** `Authorization: Bearer <token>`

---

#### POST /api/api-keys/:id/regenerate

重新產生金鑰。

**Headers:** `Authorization: Bearer <token>`

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

### API 使用紀錄 API

#### GET /api/api-usage/logs

取得 API 使用紀錄。

**Headers:** `Authorization: Bearer <token>`

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
        "id": "log-uuid",
        "apiKeyId": "key-uuid",
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
        "createdAt": "2024-12-25 10:00:00"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 20
  }
}
```

---

#### GET /api/api-usage/stats

取得 API 使用統計。

**Headers:** `Authorization: Bearer <token>`

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
      { "date": "2024-12-25", "requests": 500, "success": 490, "failed": 10 }
    ]
  }
}
```

---

### 統計數據 API

#### GET /api/stats/dashboard

取得儀表板統計數據。

**Headers:** `Authorization: Bearer <token>`

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
        "id": "msg-uuid",
        "title": "系統通知",
        "status": "sent",
        "createdAt": "2024-12-25 10:00:00"
      }
    ],
    "recentLogs": [
      {
        "id": "log-uuid",
        "channelName": "LINE",
        "title": "測試",
        "status": "success",
        "sentAt": "2024-12-25 10:00:00"
      }
    ],
    "trendData": [
      { "date": "2024-12-19", "sent": 40, "success": 38, "failed": 2 }
    ]
  }
}
```

---

## 錯誤處理

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 建立成功 |
| 400 | 請求參數錯誤 |
| 401 | 未認證 / Token 無效 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 409 | 資源衝突（如 Email 重複） |
| 429 | 超過速率限制 |
| 500 | 伺服器內部錯誤 |

### 錯誤碼列表

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|------------|------|
| `VALIDATION_ERROR` | 400 | 請求參數驗證失敗 |
| `INVALID_REQUEST` | 400 | 請求格式錯誤 |
| `UNAUTHORIZED` | 401 | 未認證 |
| `INVALID_CREDENTIALS` | 401 | 登入憑證錯誤 |
| `TOKEN_EXPIRED` | 401 | Token 已過期 |
| `INVALID_API_KEY` | 401 | API 金鑰無效 |
| `FORBIDDEN` | 403 | 權限不足 |
| `ACCOUNT_DISABLED` | 403 | 帳號已停用 |
| `API_KEY_DISABLED` | 403 | API 金鑰已停用 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `CONFLICT` | 409 | 資源衝突 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超過速率限制 |
| `INTERNAL_ERROR` | 500 | 伺服器內部錯誤 |
| `CHANNEL_ERROR` | 502 | 渠道連接錯誤 |
| `CHANNEL_TEST_FAILED` | 400 | 渠道測試失敗 |

---

## 資料結構

### User

```typescript
interface User {
  id: string;           // UUID
  username: string;     // 使用者名稱
  email: string;        // 電子郵件
  role: 'admin' | 'user';  // 角色
  status: 'active' | 'inactive';  // 狀態
  avatar?: string;      // 頭像 URL
  createdAt: string;    // 建立時間
  lastLoginAt?: string; // 最後登入時間
}
```

### Channel

```typescript
type ChannelType = 'line' | 'telegram';

interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  enabled: boolean;
  config: LineConfig | TelegramConfig;
  createdAt: string;
  updatedAt: string;
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

### Message

```typescript
type MessageStatus = 'pending' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed';

interface Message {
  id: string;
  title: string;
  content: string;
  status: MessageStatus;
  channelIds: string[];
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  results?: MessageResult[];
}

interface MessageResult {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  success: boolean;
  sentAt: string;
  error?: string;
}
```

### ApiKey

```typescript
type ApiPermission = 'send' | 'read_channels' | 'read_logs' | 'read_stats';

interface ApiKey {
  id: string;
  name: string;
  key: string;       // 完整金鑰（僅建立時回傳）
  prefix: string;    // 部分顯示的金鑰
  permissions: ApiPermission[];
  rateLimit: number;
  usageCount: number;
  enabled: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}
```

### Template

```typescript
interface Template {
  id: string;
  name: string;
  title: string;         // 支援 {{variable}} 語法
  content: string;       // 支援 {{variable}} 語法
  channelTypes: ChannelType[];
  variables: string[];   // 變數列表
  createdAt: string;
  updatedAt: string;
}
```

---

## cURL 範例

### 登入

```bash
curl -X POST http://localhost:9208/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}'
```

### 取得使用者列表

```bash
curl http://localhost:9208/api/users \
  -H 'Authorization: Bearer <your_token>'
```

### 建立渠道

```bash
curl -X POST http://localhost:9208/api/channels \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your_token>' \
  -d '{
    "type": "telegram",
    "name": "我的 Telegram",
    "enabled": true,
    "config": {
      "botToken": "123456:ABC-DEF",
      "chatId": "-1001234567890",
      "parseMode": "HTML"
    }
  }'
```

### 發送訊息

```bash
curl -X POST http://localhost:9208/api/messages/send \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your_token>' \
  -d '{
    "title": "測試通知",
    "content": "這是一則測試訊息",
    "channelIds": ["channel-uuid-1"]
  }'
```

---

*最後更新：2024-12-26*
