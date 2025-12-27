# 🗄️ NotifyHub 資料庫結構

## 資料表總覽

| 資料表名稱 | 說明 | 主要欄位 |
|------------|------|----------|
| `users` | 使用者帳號 | id (AUTO_INCREMENT), username, email, password, role |
| `channels` | 通知渠道 | id (AUTO_INCREMENT), type, name, enabled, config |
| `messages` | 通知訊息 | id (AUTO_INCREMENT), title, content, status, channel_ids |
| `message_results` | 訊息發送結果 | id (AUTO_INCREMENT), message_id, channel_id, success |
| `templates` | 訊息模板 | id (AUTO_INCREMENT), name, title, content, variables |
| `api_keys` | API 金鑰 | id (AUTO_INCREMENT), name, key, permissions, rate_limit |
| `api_usage_logs` | API 使用紀錄 | id (AUTO_INCREMENT), api_key_id, endpoint, method, status_code |

---

## 資料表詳細結構

### users 使用者

```sql
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','user') DEFAULT 'user',
  `status` ENUM('active','inactive') DEFAULT 'active',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_status` (`status`)
);
```

### channels 通知渠道

```sql
CREATE TABLE `channels` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` ENUM('line', 'telegram') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `enabled` TINYINT(1) DEFAULT 1,
  `config` JSON NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('pending','scheduled','sending','sent','partial','failed') 
           DEFAULT 'pending',
  `channel_ids` JSON NOT NULL,
  `scheduled_at` DATETIME DEFAULT NULL,
  `sent_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_user_id` (`user_id`),
  KEY `idx_messages_status` (`status`),
  KEY `idx_messages_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
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
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `message_id` INT UNSIGNED NOT NULL,
  `channel_id` INT UNSIGNED NOT NULL,
  `success` TINYINT(1) NOT NULL DEFAULT 0,
  `error` TEXT DEFAULT NULL,
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_results_message_id` (`message_id`),
  KEY `idx_results_channel_id` (`channel_id`),
  KEY `idx_results_sent_at` (`sent_at`),
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE CASCADE
);
```

### templates 訊息模板

```sql
CREATE TABLE `templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `channel_types` JSON DEFAULT NULL,
  `variables` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `key` VARCHAR(64) NOT NULL UNIQUE,
  `prefix` VARCHAR(20) NOT NULL,
  `permissions` JSON NOT NULL,
  `rate_limit` INT DEFAULT 60,
  `usage_count` INT DEFAULT 0,
  `enabled` TINYINT(1) DEFAULT 1,
  `expires_at` DATETIME DEFAULT NULL,
  `last_used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `idx_api_keys_user_id` (`user_id`),
  KEY `idx_api_keys_enabled` (`enabled`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
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
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `api_key_id` INT UNSIGNED NOT NULL,
  `endpoint` VARCHAR(255) NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `status_code` INT NOT NULL,
  `success` TINYINT(1) NOT NULL DEFAULT 0,
  `response_time` INT DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `request_body` JSON DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_api_key_id` (`api_key_id`),
  KEY `idx_logs_endpoint` (`endpoint`),
  KEY `idx_logs_created_at` (`created_at`),
  FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE
);
```

---

## 索引說明

### 效能優化索引

| 資料表 | 索引名稱 | 欄位 | 用途 |
|--------|----------|------|------|
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
│ id (PK, AI)  │         │ id (PK, AI)  │
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
│ id (PK, AI)      │◄───┤ message_id (FK)  │
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
│ id (PK, AI)  │    │ id (PK, AI)      │
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
                    │ id (PK, AI)      │
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

> **PK:** Primary Key, **AI:** AUTO_INCREMENT, **FK:** Foreign Key, **UK:** Unique Key

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
