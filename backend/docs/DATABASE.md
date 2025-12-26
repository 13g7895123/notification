# 🗄️ NotifyHub 資料庫結構

## 資料表總覽

| 資料表名稱 | 說明 | 主要欄位 |
|------------|------|----------|
| `users` | 使用者帳號 | id, username, email, password, role |
| `channels` | 通知渠道 | id, type, name, enabled, config |
| `messages` | 通知訊息 | id, title, content, status, channel_ids |
| `message_results` | 訊息發送結果 | message_id, channel_id, success |
| `templates` | 訊息模板 | id, name, title, content, variables |
| `api_keys` | API 金鑰 | id, name, key, permissions, rate_limit |
| `api_usage_logs` | API 使用紀錄 | api_key_id, endpoint, method, status_code |

---

## 資料表詳細結構

### users 使用者

```sql
CREATE TABLE `users` (
  `id` char(36) NOT NULL,                    -- UUID
  `username` varchar(100) NOT NULL,          -- 使用者名稱
  `email` varchar(255) NOT NULL UNIQUE,      -- 電子郵件（唯一）
  `password` varchar(255) NOT NULL,          -- 密碼（bcrypt 加密）
  `role` enum('admin','user') DEFAULT 'user',-- 角色
  `status` enum('active','inactive') DEFAULT 'active', -- 狀態
  `avatar` varchar(500) DEFAULT NULL,        -- 頭像 URL
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,     -- 最後登入時間
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
);
```

### channels 通知渠道

```sql
CREATE TABLE `channels` (
  `id` char(36) NOT NULL,                    -- UUID
  `type` varchar(50) NOT NULL,               -- 類型：line, telegram
  `name` varchar(100) NOT NULL,              -- 渠道名稱
  `enabled` tinyint(1) DEFAULT 1,            -- 是否啟用
  `config` json NOT NULL,                    -- 渠道設定（JSON）
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_channels_type` (`type`),
  KEY `idx_channels_enabled` (`enabled`)
);
```

**config JSON 結構：**

LINE:
```json
{
  "channelAccessToken": "string",
  "channelSecret": "string",
  "targetId": "string"
}
```

Telegram:
```json
{
  "botToken": "string",
  "chatId": "string",
  "parseMode": "HTML" | "Markdown"
}
```

### messages 通知訊息

```sql
CREATE TABLE `messages` (
  `id` char(36) NOT NULL,                    -- UUID
  `user_id` char(36) NOT NULL,               -- 發送者 ID
  `title` varchar(255) NOT NULL,             -- 訊息標題
  `content` text NOT NULL,                   -- 訊息內容
  `status` enum('pending','scheduled','sending','sent','partial','failed') 
           DEFAULT 'pending',                -- 發送狀態
  `channel_ids` json NOT NULL,               -- 目標渠道 ID 列表
  `scheduled_at` datetime DEFAULT NULL,      -- 排程時間
  `sent_at` datetime DEFAULT NULL,           -- 實際發送時間
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_user_id` (`user_id`),
  KEY `idx_messages_status` (`status`),
  KEY `idx_messages_created_at` (`created_at`)
);
```

**狀態說明：**

| 狀態 | 說明 |
|------|------|
| `pending` | 待發送 |
| `scheduled` | 已排程 |
| `sending` | 發送中 |
| `sent` | 發送成功（所有渠道） |
| `partial` | 部分成功 |
| `failed` | 發送失敗（所有渠道） |

### message_results 訊息發送結果

```sql
CREATE TABLE `message_results` (
  `id` char(36) NOT NULL,                    -- UUID
  `message_id` char(36) NOT NULL,            -- 訊息 ID
  `channel_id` char(36) NOT NULL,            -- 渠道 ID
  `success` tinyint(1) NOT NULL DEFAULT 0,   -- 是否成功
  `error` text DEFAULT NULL,                 -- 錯誤訊息
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,-- 發送時間
  PRIMARY KEY (`id`),
  KEY `idx_results_message_id` (`message_id`),
  KEY `idx_results_channel_id` (`channel_id`),
  KEY `idx_results_success` (`success`),
  KEY `idx_results_sent_at` (`sent_at`)
);
```

### templates 訊息模板

```sql
CREATE TABLE `templates` (
  `id` char(36) NOT NULL,                    -- UUID
  `name` varchar(100) NOT NULL,              -- 模板名稱
  `title` varchar(255) NOT NULL,             -- 標題模板
  `content` text NOT NULL,                   -- 內容模板
  `channel_types` json DEFAULT NULL,         -- 支援的渠道類型
  `variables` json DEFAULT NULL,             -- 變數列表
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

**範例：**
```json
{
  "name": "系統維護通知",
  "title": "系統維護公告",
  "content": "親愛的用戶，系統將於 {{date}} 進行維護，預計時間 {{duration}}。",
  "channel_types": ["line", "telegram"],
  "variables": ["date", "duration"]
}
```

### api_keys API 金鑰

```sql
CREATE TABLE `api_keys` (
  `id` char(36) NOT NULL,                    -- UUID
  `user_id` char(36) NOT NULL,               -- 擁有者 ID
  `name` varchar(100) NOT NULL,              -- 金鑰名稱
  `key` varchar(255) NOT NULL,               -- 金鑰 Hash
  `prefix` varchar(50) NOT NULL,             -- 金鑰前綴（用於顯示）
  `permissions` json NOT NULL,               -- 權限列表
  `rate_limit` int DEFAULT 60,               -- 每分鐘請求限制
  `usage_count` int DEFAULT 0,               -- 使用次數
  `enabled` tinyint(1) DEFAULT 1,            -- 是否啟用
  `expires_at` datetime DEFAULT NULL,        -- 過期時間
  `last_used_at` datetime DEFAULT NULL,      -- 最後使用時間
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_api_keys_user_id` (`user_id`),
  KEY `idx_api_keys_enabled` (`enabled`)
);
```

**權限列表：**

| 權限 | 說明 |
|------|------|
| `send` | 發送訊息 |
| `read_channels` | 讀取渠道列表 |
| `read_logs` | 讀取使用紀錄 |
| `read_stats` | 讀取統計數據 |

### api_usage_logs API 使用紀錄

```sql
CREATE TABLE `api_usage_logs` (
  `id` char(36) NOT NULL,                    -- UUID
  `api_key_id` char(36) NOT NULL,            -- API 金鑰 ID
  `endpoint` varchar(255) NOT NULL,          -- API 端點
  `method` varchar(10) NOT NULL,             -- HTTP 方法
  `status_code` int NOT NULL,                -- HTTP 狀態碼
  `success` tinyint(1) NOT NULL DEFAULT 0,   -- 是否成功
  `response_time` int DEFAULT NULL,          -- 回應時間（毫秒）
  `ip` varchar(45) DEFAULT NULL,             -- 來源 IP
  `user_agent` varchar(500) DEFAULT NULL,    -- User Agent
  `request_body` json DEFAULT NULL,          -- 請求內容
  `error_message` text DEFAULT NULL,         -- 錯誤訊息
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_api_key_id` (`api_key_id`),
  KEY `idx_logs_endpoint` (`endpoint`),
  KEY `idx_logs_success` (`success`),
  KEY `idx_logs_created_at` (`created_at`)
);
```

---

## 索引說明

### 效能優化索引

| 資料表 | 索引名稱 | 欄位 | 用途 |
|--------|----------|------|------|
| users | idx_users_role | role | 角色篩選 |
| users | idx_users_status | status | 狀態篩選 |
| channels | idx_channels_type | type | 類型篩選 |
| channels | idx_channels_enabled | enabled | 啟用篩選 |
| messages | idx_messages_status | status | 狀態篩選 |
| messages | idx_messages_created_at | created_at | 時間排序 |
| message_results | idx_results_message_id | message_id | 關聯查詢 |
| message_results | idx_results_sent_at | sent_at | 時間排序 |
| api_usage_logs | idx_logs_created_at | created_at | 時間範圍查詢 |

---

## ER 圖

```
┌──────────────┐         ┌──────────────┐
│    users     │         │   channels   │
├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ username     │         │ type         │
│ email (UK)   │         │ name         │
│ password     │         │ enabled      │
│ role         │         │ config (JSON)│
│ status       │         │ created_at   │
│ avatar       │         │ updated_at   │
│ created_at   │         └──────┬───────┘
│ updated_at   │                │
│ last_login_at│                │
└──────┬───────┘                │
       │                        │
       │                        │
       ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│     messages     │    │ message_results  │
├──────────────────┤    ├──────────────────┤
│ id (PK)          │◄───┤ message_id (FK)  │
│ user_id (FK)     │    │ channel_id (FK)──┼────►
│ title            │    │ success          │
│ content          │    │ error            │
│ status           │    │ sent_at          │
│ channel_ids(JSON)│    └──────────────────┘
│ scheduled_at     │
│ sent_at          │
│ created_at       │
└──────────────────┘

┌──────────────┐    ┌──────────────────┐
│  templates   │    │    api_keys      │
├──────────────┤    ├──────────────────┤
│ id (PK)      │    │ id (PK)          │
│ name         │    │ user_id (FK)─────┼──► users.id
│ title        │    │ name             │
│ content      │    │ key              │
│ channel_types│    │ prefix           │
│ variables    │    │ permissions(JSON)│
│ created_at   │    │ rate_limit       │
│ updated_at   │    │ usage_count      │
└──────────────┘    │ enabled          │
                    │ expires_at       │
                    │ last_used_at     │
                    │ created_at       │
                    │ updated_at       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ api_usage_logs   │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ api_key_id (FK)  │
                    │ endpoint         │
                    │ method           │
                    │ status_code      │
                    │ success          │
                    │ response_time    │
                    │ ip               │
                    │ user_agent       │
                    │ request_body     │
                    │ error_message    │
                    │ created_at       │
                    └──────────────────┘
```

---

## 資料維護

### 清理過期資料

```sql
-- 刪除 30 天前的 API 使用紀錄
DELETE FROM api_usage_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 刪除舊的訊息結果
DELETE FROM message_results 
WHERE sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 備份資料庫

```bash
# Docker 環境
docker compose exec mariadb mysqldump -u notifyhub -pnotifyhub_db_2024 notifyhub > backup.sql

# 還原
docker compose exec -T mariadb mysql -u notifyhub -pnotifyhub_db_2024 notifyhub < backup.sql
```

---

*最後更新：2024-12-26*
