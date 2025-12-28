// Windows 通知類型
export type WindowsNotificationType = 'cicd' | 'system' | 'custom';
export type WindowsNotificationStatus = 'pending' | 'delivered' | 'read' | 'dismissed' | 'expired';
export type WindowsNotificationPriority = 'low' | 'normal' | 'high';

// Windows 通知
export interface WindowsNotification {
    id: string;
    type: WindowsNotificationType;
    title: string;
    message: string;
    repo: string;
    branch?: string;
    commit_sha?: string;
    status: WindowsNotificationStatus;
    priority: WindowsNotificationPriority;
    icon?: string;
    action_url?: string;
    metadata?: Record<string, unknown>;
    delivered_at?: string;
    read_at?: string;
    created_at: string;
    updated_at: string;
}

// Windows 通知統計
export interface WindowsNotificationStats {
    total: number;
    pending: number;
    delivered: number;
    read: number;
    dismissed: number;
    expired: number;
    today: number;
    trends: { date: string; count: number }[];
}

// 通知渠道類型
export type ChannelType = 'line' | 'telegram';

// 通知渠道設定
export interface NotificationChannel {
    id: string;
    type: ChannelType;
    name: string;
    enabled: boolean;
    config: LineConfig | TelegramConfig;
    webhookKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

// LINE Bot 設定
export interface LineConfig {
    channelAccessToken: string;
    channelSecret: string;
    targetId?: string;
}

// Telegram Bot 設定
export interface TelegramConfig {
    botToken: string;
    chatId: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

// 訊息發送狀態
export type MessageStatus = 'pending' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed';

// 通知訊息
export interface NotificationMessage {
    id: string;
    title: string;
    content: string;
    channelIds: string[];
    channelOptions?: Record<string, { type: 'all' | 'selected'; users?: string[] }>;
    status: MessageStatus;
    scheduledAt?: Date;
    sentAt?: Date;
    createdAt: Date;
    results?: SendResult[];
}

// 發送結果
export interface SendResult {
    channelId: string;
    channelName: string;
    channelType: ChannelType;
    success: boolean;
    sentAt: Date;
    error?: string;
    responseData?: Record<string, unknown>;
}

// 發送記錄
export interface NotificationLog {
    id: string;
    messageId: string;
    channelId: string;
    channelType: ChannelType;
    channelName: string;
    title: string;
    content: string;
    status: 'success' | 'failed';
    sentAt: Date;
    error?: string;
    responseTime?: number;
}

// 通知模板
export interface NotificationTemplate {
    id: string;
    name: string;
    title: string;
    content: string;
    channelTypes: ChannelType[];
    variables: string[];
    createdAt: Date;
    updatedAt: Date;
}

// 統計數據
export interface NotificationStats {
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    successRate: number;
    byChannel: {
        channelId: string;
        channelName: string;
        channelType: ChannelType;
        sent: number;
        success: number;
        failed: number;
    }[];
    recentActivity: {
        date: string;
        sent: number;
        success: number;
        failed: number;
    }[];
    windowsStats?: {
        total: number;
        pending: number;
        today: number;
        trends: { date: string; count: number }[];
    };
}

export interface ChannelUser {
    id: number;
    channelId: number;
    providerId: string;
    displayName: string | null;
    pictureUrl: string | null;
    status: 'active' | 'blocked';
    createdAt: string;
    updatedAt: string;
}

export interface WebhookLog {
    id: number;
    channelId: number;
    method: string;
    url: string;
    headers: string | null;
    payload: string | null;
    responseStatus: number | null;
    responseBody: string | null;
    ipAddress: string;
    createdAt: string;
}

// 用戶
export interface User {
    id: string;
    username: string;
    displayName?: string;
    email: string;
    role: 'admin' | 'user';
    avatar?: string;
}

// API 金鑰
export interface ApiKey {
    id: string;
    name: string;
    key: string;
    prefix: string; // 顯示用的前綴
    permissions: ApiPermission[];
    rateLimit: number; // 每分鐘請求限制
    enabled: boolean;
    expiresAt?: Date;
    lastUsedAt?: Date;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// API 權限
export type ApiPermission = 'send' | 'read_channels' | 'read_logs' | 'read_stats';

// API 使用紀錄
export interface ApiUsageLog {
    id: string;
    apiKeyId: string;
    apiKeyName: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    statusCode: number;
    requestBody?: Record<string, unknown>;
    responseBody?: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
    responseTime: number; // 毫秒
    success: boolean;
    errorMessage?: string;
    createdAt: Date;
}

// API 統計
export interface ApiStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    requestsByEndpoint: {
        endpoint: string;
        count: number;
        avgResponseTime: number;
    }[];
    requestsByDay: {
        date: string;
        count: number;
        success: number;
        failed: number;
    }[];
}

// API 請求/回應類型
export interface ApiSendNotificationRequest {
    title: string;
    content: string;
    channelIds?: string[];
    channelTypes?: ChannelType[];
    scheduledAt?: string;
}

export interface ApiSendNotificationResponse {
    success: boolean;
    messageId?: string;
    results?: {
        channelId: string;
        channelName: string;
        success: boolean;
        error?: string;
    }[];
    error?: string;
}
