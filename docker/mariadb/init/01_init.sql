-- ===========================================
-- NotifyHub 資料庫初始化
-- ===========================================

-- 使用 UTF8MB4 以支援 Emoji
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===========================================
-- 使用者表
-- ===========================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `avatar` VARCHAR(500) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_at` DATETIME NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_email` (`email`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 通知渠道表
-- ===========================================
CREATE TABLE IF NOT EXISTS `channels` (
    `id` VARCHAR(36) NOT NULL,
    `type` ENUM('line', 'telegram') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `config` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 通知訊息表
-- ===========================================
CREATE TABLE IF NOT EXISTS `messages` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('pending', 'scheduled', 'sending', 'sent', 'partial', 'failed') NOT NULL DEFAULT 'pending',
    `channel_ids` JSON NOT NULL,
    `scheduled_at` DATETIME NULL,
    `sent_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `user_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 訊息發送結果表
-- ===========================================
CREATE TABLE IF NOT EXISTS `message_results` (
    `id` VARCHAR(36) NOT NULL,
    `message_id` VARCHAR(36) NOT NULL,
    `channel_id` VARCHAR(36) NOT NULL,
    `success` TINYINT(1) NOT NULL,
    `error` TEXT NULL,
    `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_channel_id` (`channel_id`),
    FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 訊息模板表
-- ===========================================
CREATE TABLE IF NOT EXISTS `templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `channel_types` JSON NOT NULL,
    `variables` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- API 金鑰表
-- ===========================================
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `key` VARCHAR(64) NOT NULL UNIQUE,
    `prefix` VARCHAR(20) NOT NULL,
    `permissions` JSON NOT NULL,
    `rate_limit` INT NOT NULL DEFAULT 60,
    `usage_count` INT NOT NULL DEFAULT 0,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `expires_at` DATETIME NULL,
    `last_used_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_key` (`key`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_enabled` (`enabled`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- API 使用紀錄表
-- ===========================================
CREATE TABLE IF NOT EXISTS `api_usage_logs` (
    `id` VARCHAR(36) NOT NULL,
    `api_key_id` VARCHAR(36) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `status_code` INT NOT NULL,
    `success` TINYINT(1) NOT NULL,
    `response_time` INT NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(500) NULL,
    `request_body` JSON NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_api_key_id` (`api_key_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_endpoint` (`endpoint`),
    FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 插入預設管理員帳號
-- 密碼: admin123 (使用 password_hash)
-- ===========================================
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'admin@notifyhub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'User', 'user@notifyhub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'active');

-- 密碼都是 password，生產環境請務必更改！
