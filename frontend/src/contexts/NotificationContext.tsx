import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
    NotificationChannel,
    NotificationMessage,
    NotificationLog,
    NotificationTemplate,
    NotificationStats,
    ChannelType,
    MessageStatus,
    ApiKey,
    ApiUsageLog,
    ApiStats,
    ApiPermission
} from '../types';

// 生成 API Key
function generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'nk_';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 模擬數據
const mockChannels: NotificationChannel[] = [
    {
        id: '1',
        type: 'line',
        name: 'LINE 主要通知',
        enabled: true,
        config: {
            channelAccessToken: 'mock-token-xxx',
            channelSecret: 'mock-secret-xxx',
            userId: 'U1234567890'
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-20')
    },
    {
        id: '2',
        type: 'telegram',
        name: 'Telegram 警報群組',
        enabled: true,
        config: {
            botToken: '123456:ABC-DEF',
            chatId: '-1001234567890',
            parseMode: 'HTML'
        },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-12-18')
    },
    {
        id: '3',
        type: 'line',
        name: 'LINE 開發測試',
        enabled: false,
        config: {
            channelAccessToken: 'dev-token-xxx',
            channelSecret: 'dev-secret-xxx',
        },
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-11-10')
    }
];

const mockMessages: NotificationMessage[] = [
    {
        id: '1',
        title: '系統維護通知',
        content: '系統將於今晚 23:00 進行例行維護，預計維護時間 2 小時。',
        channelIds: ['1', '2'],
        status: 'sent',
        sentAt: new Date('2024-12-20T14:30:00'),
        createdAt: new Date('2024-12-20T14:25:00'),
        results: [
            { channelId: '1', channelName: 'LINE 主要通知', channelType: 'line', success: true, sentAt: new Date('2024-12-20T14:30:00') },
            { channelId: '2', channelName: 'Telegram 警報群組', channelType: 'telegram', success: true, sentAt: new Date('2024-12-20T14:30:01') }
        ]
    },
    {
        id: '2',
        title: '新功能上線',
        content: '我們推出了全新的通知管理功能，歡迎體驗！',
        channelIds: ['1'],
        status: 'sent',
        sentAt: new Date('2024-12-19T10:00:00'),
        createdAt: new Date('2024-12-19T09:55:00'),
        results: [
            { channelId: '1', channelName: 'LINE 主要通知', channelType: 'line', success: true, sentAt: new Date('2024-12-19T10:00:00') }
        ]
    },
    {
        id: '3',
        title: '緊急警報測試',
        content: '這是一則緊急警報測試訊息，請忽略。',
        channelIds: ['2'],
        status: 'failed',
        createdAt: new Date('2024-12-18T16:20:00'),
        results: [
            { channelId: '2', channelName: 'Telegram 警報群組', channelType: 'telegram', success: false, sentAt: new Date('2024-12-18T16:20:05'), error: 'Bot was blocked by the user' }
        ]
    },
    {
        id: '4',
        title: '排程通知',
        content: '這是一則預約發送的通知。',
        channelIds: ['1', '2'],
        status: 'scheduled',
        scheduledAt: new Date('2024-12-25T09:00:00'),
        createdAt: new Date('2024-12-20T11:00:00')
    }
];

const mockLogs: NotificationLog[] = [
    {
        id: '1',
        messageId: '1',
        channelId: '1',
        channelType: 'line',
        channelName: 'LINE 主要通知',
        title: '系統維護通知',
        content: '系統將於今晚 23:00 進行例行維護，預計維護時間 2 小時。',
        status: 'success',
        sentAt: new Date('2024-12-20T14:30:00'),
        responseTime: 245
    },
    {
        id: '2',
        messageId: '1',
        channelId: '2',
        channelType: 'telegram',
        channelName: 'Telegram 警報群組',
        title: '系統維護通知',
        content: '系統將於今晚 23:00 進行例行維護，預計維護時間 2 小時。',
        status: 'success',
        sentAt: new Date('2024-12-20T14:30:01'),
        responseTime: 189
    },
    {
        id: '3',
        messageId: '2',
        channelId: '1',
        channelType: 'line',
        channelName: 'LINE 主要通知',
        title: '新功能上線',
        content: '我們推出了全新的通知管理功能，歡迎體驗！',
        status: 'success',
        sentAt: new Date('2024-12-19T10:00:00'),
        responseTime: 312
    },
    {
        id: '4',
        messageId: '3',
        channelId: '2',
        channelType: 'telegram',
        channelName: 'Telegram 警報群組',
        title: '緊急警報測試',
        content: '這是一則緊急警報測試訊息，請忽略。',
        status: 'failed',
        sentAt: new Date('2024-12-18T16:20:05'),
        error: 'Bot was blocked by the user',
        responseTime: 1523
    }
];

const mockTemplates: NotificationTemplate[] = [
    {
        id: '1',
        name: '系統維護通知',
        title: '系統維護通知',
        content: '系統將於 {{date}} {{time}} 進行維護，預計維護時間 {{duration}}。造成不便敬請見諒。',
        channelTypes: ['line', 'telegram'],
        variables: ['date', 'time', 'duration'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-01')
    },
    {
        id: '2',
        name: '緊急警報',
        title: '⚠️ 緊急警報',
        content: '{{message}}\n\n發生時間：{{timestamp}}\n嚴重程度：{{severity}}',
        channelTypes: ['line', 'telegram'],
        variables: ['message', 'timestamp', 'severity'],
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-11-15')
    },
    {
        id: '3',
        name: '歡迎訊息',
        title: '歡迎加入！',
        content: '親愛的 {{name}}，歡迎加入我們的通知服務！',
        channelTypes: ['line'],
        variables: ['name'],
        createdAt: new Date('2024-05-10'),
        updatedAt: new Date('2024-05-10')
    }
];

const mockStats: NotificationStats = {
    totalSent: 1247,
    totalSuccess: 1198,
    totalFailed: 49,
    successRate: 96.1,
    byChannel: [
        { channelId: '1', channelName: 'LINE 主要通知', channelType: 'line', sent: 823, success: 801, failed: 22 },
        { channelId: '2', channelName: 'Telegram 警報群組', channelType: 'telegram', sent: 424, success: 397, failed: 27 },
    ],
    recentActivity: [
        { date: '2024-12-14', sent: 45, success: 43, failed: 2 },
        { date: '2024-12-15', sent: 52, success: 50, failed: 2 },
        { date: '2024-12-16', sent: 38, success: 37, failed: 1 },
        { date: '2024-12-17', sent: 61, success: 58, failed: 3 },
        { date: '2024-12-18', sent: 49, success: 46, failed: 3 },
        { date: '2024-12-19', sent: 55, success: 54, failed: 1 },
        { date: '2024-12-20', sent: 42, success: 41, failed: 1 },
    ]
};

// Mock API Keys
const mockApiKeys: ApiKey[] = [
    {
        id: '1',
        name: '生產環境 API',
        key: 'nk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        prefix: 'nk_prod_a1b2...o5p6',
        permissions: ['send', 'read_channels', 'read_logs', 'read_stats'],
        rateLimit: 100,
        enabled: true,
        lastUsedAt: new Date('2024-12-20T15:30:00'),
        usageCount: 2547,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-01')
    },
    {
        id: '2',
        name: '測試環境 API',
        key: 'nk_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
        prefix: 'nk_test_x1y2...l5m6',
        permissions: ['send', 'read_channels'],
        rateLimit: 50,
        enabled: true,
        lastUsedAt: new Date('2024-12-19T10:00:00'),
        usageCount: 156,
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
    },
    {
        id: '3',
        name: '舊版 API (已停用)',
        key: 'nk_old_deprecated_key_12345678',
        prefix: 'nk_old_depr...5678',
        permissions: ['send'],
        rateLimit: 10,
        enabled: false,
        expiresAt: new Date('2024-06-01'),
        usageCount: 89,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
    }
];

// Mock API Usage Logs
const mockApiUsageLogs: ApiUsageLog[] = [
    {
        id: '1',
        apiKeyId: '1',
        apiKeyName: '生產環境 API',
        endpoint: '/api/v1/send',
        method: 'POST',
        statusCode: 200,
        requestBody: { title: '系統通知', content: '測試訊息', channelIds: ['1', '2'] },
        ipAddress: '192.168.1.100',
        userAgent: 'curl/7.68.0',
        responseTime: 245,
        success: true,
        createdAt: new Date('2024-12-20T15:30:00')
    },
    {
        id: '2',
        apiKeyId: '1',
        apiKeyName: '生產環境 API',
        endpoint: '/api/v1/channels',
        method: 'GET',
        statusCode: 200,
        ipAddress: '192.168.1.100',
        userAgent: 'axios/1.6.0',
        responseTime: 45,
        success: true,
        createdAt: new Date('2024-12-20T15:28:00')
    },
    {
        id: '3',
        apiKeyId: '2',
        apiKeyName: '測試環境 API',
        endpoint: '/api/v1/send',
        method: 'POST',
        statusCode: 400,
        requestBody: { content: '缺少標題' },
        ipAddress: '10.0.0.50',
        userAgent: 'PostmanRuntime/7.32.0',
        responseTime: 12,
        success: false,
        errorMessage: 'Missing required field: title',
        createdAt: new Date('2024-12-20T14:15:00')
    },
    {
        id: '4',
        apiKeyId: '1',
        apiKeyName: '生產環境 API',
        endpoint: '/api/v1/send',
        method: 'POST',
        statusCode: 200,
        requestBody: { title: '警報通知', content: '伺服器負載過高', channelTypes: ['telegram'] },
        ipAddress: '192.168.1.101',
        userAgent: 'python-requests/2.28.0',
        responseTime: 312,
        success: true,
        createdAt: new Date('2024-12-20T12:00:00')
    },
    {
        id: '5',
        apiKeyId: '1',
        apiKeyName: '生產環境 API',
        endpoint: '/api/v1/stats',
        method: 'GET',
        statusCode: 200,
        ipAddress: '192.168.1.100',
        userAgent: 'axios/1.6.0',
        responseTime: 89,
        success: true,
        createdAt: new Date('2024-12-20T10:00:00')
    },
    {
        id: '6',
        apiKeyId: '3',
        apiKeyName: '舊版 API (已停用)',
        endpoint: '/api/v1/send',
        method: 'POST',
        statusCode: 401,
        ipAddress: '203.0.113.50',
        userAgent: 'unknown',
        responseTime: 5,
        success: false,
        errorMessage: 'API key is disabled',
        createdAt: new Date('2024-12-19T20:00:00')
    }
];

const mockApiStats: ApiStats = {
    totalRequests: 3892,
    successfulRequests: 3654,
    failedRequests: 238,
    avgResponseTime: 156,
    requestsByEndpoint: [
        { endpoint: '/api/v1/send', count: 2847, avgResponseTime: 245 },
        { endpoint: '/api/v1/channels', count: 523, avgResponseTime: 45 },
        { endpoint: '/api/v1/stats', count: 312, avgResponseTime: 89 },
        { endpoint: '/api/v1/logs', count: 210, avgResponseTime: 120 }
    ],
    requestsByDay: [
        { date: '2024-12-14', count: 452, success: 438, failed: 14 },
        { date: '2024-12-15', count: 523, success: 501, failed: 22 },
        { date: '2024-12-16', count: 389, success: 375, failed: 14 },
        { date: '2024-12-17', count: 612, success: 589, failed: 23 },
        { date: '2024-12-18', count: 478, success: 456, failed: 22 },
        { date: '2024-12-19', count: 534, success: 512, failed: 22 },
        { date: '2024-12-20', count: 398, success: 385, failed: 13 }
    ]
};

interface NotificationContextType {
    // 通知渠道
    channels: NotificationChannel[];
    addChannel: (channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateChannel: (id: string, updates: Partial<NotificationChannel>) => void;
    deleteChannel: (id: string) => void;
    toggleChannel: (id: string) => void;
    testChannel: (id: string) => Promise<boolean>;

    // 訊息
    messages: NotificationMessage[];
    sendMessage: (message: Omit<NotificationMessage, 'id' | 'createdAt' | 'status' | 'results'>) => Promise<void>;
    deleteMessage: (id: string) => void;

    // 日誌
    logs: NotificationLog[];

    // 模板
    templates: NotificationTemplate[];
    addTemplate: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
    deleteTemplate: (id: string) => void;

    // 統計
    stats: NotificationStats;

    // API 金鑰
    apiKeys: ApiKey[];
    addApiKey: (apiKey: Omit<ApiKey, 'id' | 'key' | 'prefix' | 'usageCount' | 'createdAt' | 'updatedAt'>) => string;
    updateApiKey: (id: string, updates: Partial<ApiKey>) => void;
    deleteApiKey: (id: string) => void;
    toggleApiKey: (id: string) => void;
    regenerateApiKey: (id: string) => string;

    // API 使用紀錄
    apiUsageLogs: ApiUsageLog[];
    apiStats: ApiStats;

    // UI 狀態
    isLoading: boolean;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [channels, setChannels] = useState<NotificationChannel[]>(mockChannels);
    const [messages, setMessages] = useState<NotificationMessage[]>(mockMessages);
    const [logs, setLogs] = useState<NotificationLog[]>(mockLogs);
    const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
    const [stats] = useState<NotificationStats>(mockStats);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
    const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsageLog[]>(mockApiUsageLogs);
    const [apiStats] = useState<ApiStats>(mockApiStats);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // 渠道操作
    const addChannel = useCallback((channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newChannel: NotificationChannel = {
            ...channel,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setChannels(prev => [...prev, newChannel]);
    }, []);

    const updateChannel = useCallback((id: string, updates: Partial<NotificationChannel>) => {
        setChannels(prev => prev.map(ch =>
            ch.id === id ? { ...ch, ...updates, updatedAt: new Date() } : ch
        ));
    }, []);

    const deleteChannel = useCallback((id: string) => {
        setChannels(prev => prev.filter(ch => ch.id !== id));
    }, []);

    const toggleChannel = useCallback((id: string) => {
        setChannels(prev => prev.map(ch =>
            ch.id === id ? { ...ch, enabled: !ch.enabled, updatedAt: new Date() } : ch
        ));
    }, []);

    const testChannel = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        return Math.random() > 0.2;
    }, []);

    // 訊息操作
    const sendMessage = useCallback(async (message: Omit<NotificationMessage, 'id' | 'createdAt' | 'status' | 'results'>) => {
        setIsLoading(true);

        const newMessage: NotificationMessage = {
            ...message,
            id: Date.now().toString(),
            createdAt: new Date(),
            status: message.scheduledAt ? 'scheduled' : 'sending'
        };

        setMessages(prev => [newMessage, ...prev]);

        if (!message.scheduledAt) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const results = message.channelIds.map(chId => {
                const channel = channels.find(c => c.id === chId);
                const success = Math.random() > 0.1;
                return {
                    channelId: chId,
                    channelName: channel?.name || 'Unknown',
                    channelType: channel?.type || 'line' as ChannelType,
                    success,
                    sentAt: new Date(),
                    error: success ? undefined : 'Mock error'
                };
            });

            const allSuccess = results.every(r => r.success);
            const allFailed = results.every(r => !r.success);
            const status: MessageStatus = allSuccess ? 'sent' : allFailed ? 'failed' : 'partial';

            setMessages(prev => prev.map(m =>
                m.id === newMessage.id
                    ? { ...m, status, sentAt: new Date(), results }
                    : m
            ));

            const newLogs: NotificationLog[] = results.map((r, idx) => ({
                id: `${Date.now()}-${idx}`,
                messageId: newMessage.id,
                channelId: r.channelId,
                channelType: r.channelType,
                channelName: r.channelName,
                title: message.title,
                content: message.content,
                status: r.success ? 'success' : 'failed',
                sentAt: r.sentAt,
                error: r.error,
                responseTime: Math.floor(Math.random() * 500) + 100
            }));

            setLogs(prev => [...newLogs, ...prev]);
        }

        setIsLoading(false);
    }, [channels]);

    const deleteMessage = useCallback((id: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    }, []);

    // 模板操作
    const addTemplate = useCallback((template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTemplate: NotificationTemplate = {
            ...template,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setTemplates(prev => [...prev, newTemplate]);
    }, []);

    const updateTemplate = useCallback((id: string, updates: Partial<NotificationTemplate>) => {
        setTemplates(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        ));
    }, []);

    const deleteTemplate = useCallback((id: string) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
    }, []);

    // API 金鑰操作
    const addApiKey = useCallback((apiKey: Omit<ApiKey, 'id' | 'key' | 'prefix' | 'usageCount' | 'createdAt' | 'updatedAt'>): string => {
        const key = generateApiKey();
        const newApiKey: ApiKey = {
            ...apiKey,
            id: Date.now().toString(),
            key,
            prefix: key.slice(0, 12) + '...' + key.slice(-4),
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setApiKeys(prev => [...prev, newApiKey]);
        return key;
    }, []);

    const updateApiKey = useCallback((id: string, updates: Partial<ApiKey>) => {
        setApiKeys(prev => prev.map(k =>
            k.id === id ? { ...k, ...updates, updatedAt: new Date() } : k
        ));
    }, []);

    const deleteApiKey = useCallback((id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    const toggleApiKey = useCallback((id: string) => {
        setApiKeys(prev => prev.map(k =>
            k.id === id ? { ...k, enabled: !k.enabled, updatedAt: new Date() } : k
        ));
    }, []);

    const regenerateApiKey = useCallback((id: string): string => {
        const newKey = generateApiKey();
        setApiKeys(prev => prev.map(k =>
            k.id === id ? {
                ...k,
                key: newKey,
                prefix: newKey.slice(0, 12) + '...' + newKey.slice(-4),
                updatedAt: new Date()
            } : k
        ));
        return newKey;
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                channels,
                addChannel,
                updateChannel,
                deleteChannel,
                toggleChannel,
                testChannel,
                messages,
                sendMessage,
                deleteMessage,
                logs,
                templates,
                addTemplate,
                updateTemplate,
                deleteTemplate,
                stats,
                apiKeys,
                addApiKey,
                updateApiKey,
                deleteApiKey,
                toggleApiKey,
                regenerateApiKey,
                apiUsageLogs,
                apiStats,
                isLoading,
                sidebarCollapsed,
                toggleSidebar
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}
