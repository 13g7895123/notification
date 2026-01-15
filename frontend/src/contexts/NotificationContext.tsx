import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
    NotificationChannel,
    NotificationMessage,
    NotificationLog,
    NotificationTemplate,
    NotificationStats,
    ApiKey,
    ApiUsageLog,
    ApiStats,
    ChannelUser,
    WebhookLog,
    SchedulerStatus,
    SchedulerLog,
    SchedulerSettings
} from '../types';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    // 通知渠道
    channels: NotificationChannel[];
    fetchChannels: () => Promise<void>;
    addChannel: (channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
    updateChannel: (id: string, updates: Partial<NotificationChannel>) => Promise<boolean>;
    deleteChannel: (id: string) => Promise<boolean>;
    toggleChannel: (id: string) => Promise<boolean>;
    testChannel: (id: string) => Promise<boolean>;
    regenerateChannelWebhook: (id: string) => Promise<string | null>;
    getChannelUsers: (id: string) => Promise<ChannelUser[]>;
    getChannelWebhookLogs: (id: string) => Promise<WebhookLog[]>;

    // 訊息
    messages: NotificationMessage[];
    fetchMessages: (params?: Record<string, string | number | boolean>) => Promise<void>;
    sendMessage: (message: Omit<NotificationMessage, 'id' | 'createdAt' | 'status' | 'results'>) => Promise<boolean>;
    deleteMessage: (id: string) => Promise<boolean>;

    // 日誌 (實際上由 stats 回傳或另外獲取)
    logs: NotificationLog[];

    // 模板
    templates: NotificationTemplate[];
    fetchTemplates: () => Promise<void>;
    addTemplate: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
    updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => Promise<boolean>;
    deleteTemplate: (id: string) => Promise<boolean>;

    // 統計
    stats: NotificationStats | null;
    fetchStats: () => Promise<void>;

    // API 金鑰
    apiKeys: ApiKey[];
    fetchApiKeys: () => Promise<void>;
    addApiKey: (apiKey: Omit<ApiKey, 'id' | 'key' | 'prefix' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
    updateApiKey: (id: string, updates: Partial<ApiKey>) => Promise<boolean>;
    deleteApiKey: (id: string) => Promise<boolean>;
    toggleApiKey: (id: string) => Promise<boolean>;
    regenerateApiKey: (id: string) => Promise<string | null>;

    // API 使用紀錄
    apiUsageLogs: ApiUsageLog[];
    apiStats: ApiStats | null;
    fetchApiUsage: (params?: Record<string, string | number | boolean>) => Promise<void>;

    // 排程器管理
    fetchSchedulerStatus: () => Promise<SchedulerStatus>;
    fetchSchedulerLogs: (limit?: number) => Promise<SchedulerLog[]>;
    enableScheduler: () => Promise<boolean>;
    disableScheduler: () => Promise<boolean>;
    runSchedulerNow: () => Promise<boolean>;
    fetchSchedulerSettings: () => Promise<SchedulerSettings>;
    updateSchedulerSettings: (settings: Partial<SchedulerSettings>) => Promise<boolean>;

    // UI 狀態
    isLoading: boolean;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [channels, setChannels] = useState<NotificationChannel[]>([]);
    const [messages, setMessages] = useState<NotificationMessage[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsageLog[]>([]);
    const [apiStats, setApiStats] = useState<ApiStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // 渠道操作
    const fetchChannels = useCallback(async () => {
        try {
            const data = await api.get<NotificationChannel[]>('/channels');
            setChannels(data || []);
        } catch (error) {
            console.error('Fetch channels failed', error);
        }
    }, []);

    const addChannel = useCallback(async (channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await api.post('/channels', channel);
            await fetchChannels();
            return true;
        } catch (error) {
            console.error('Add channel failed', error);
            return false;
        }
    }, [fetchChannels]);

    const updateChannel = useCallback(async (id: string, updates: Partial<NotificationChannel>) => {
        try {
            await api.put(`/channels/${id}`, updates);
            await fetchChannels();
            return true;
        } catch (error) {
            console.error('Update channel failed', error);
            return false;
        }
    }, [fetchChannels]);

    const deleteChannel = useCallback(async (id: string) => {
        try {
            await api.delete(`/channels/${id}`);
            await fetchChannels();
            return true;
        } catch (error) {
            console.error('Delete channel failed', error);
            return false;
        }
    }, [fetchChannels]);

    const toggleChannel = useCallback(async (id: string) => {
        try {
            await api.put(`/channels/${id}/toggle`);
            await fetchChannels();
            return true;
        } catch (error) {
            console.error('Toggle channel failed', error);
            return false;
        }
    }, [fetchChannels]);

    const testChannel = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            await api.post(`/channels/${id}/test`);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Test channel failed', error);
            setIsLoading(false);
            return false;
        }
    }, []);

    // 訊息操作
    const fetchMessages = useCallback(async (params?: Record<string, string | number | boolean>) => {
        try {
            const data = await api.get<{ messages: NotificationMessage[]; total: number; page: number; limit: number }>('/messages', params);
            // API 返回 { messages: [], total, page, limit }
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Fetch messages failed', error);
        }
    }, []);

    const sendMessage = useCallback(async (message: Omit<NotificationMessage, 'id' | 'createdAt' | 'status' | 'results'>) => {
        setIsLoading(true);
        try {
            await api.post('/messages/send', message);
            await fetchMessages();
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Send message failed', error);
            setIsLoading(false);
            return false;
        }
    }, [fetchMessages]);

    const deleteMessage = useCallback(async (id: string) => {
        try {
            await api.delete(`/messages/${id}`);
            await fetchMessages();
            return true;
        } catch (error) {
            console.error('Delete message failed', error);
            return false;
        }
    }, [fetchMessages]);

    const regenerateChannelWebhook = useCallback(async (id: string): Promise<string | null> => {
        try {
            const data = await api.post<{ webhookKey: string }>(`/channels/${id}/regenerate-key`);
            await fetchChannels();
            return data.webhookKey;
        } catch (error) {
            console.error('Regenerate channel webhook failed', error);
            return null;
        }
    }, [fetchChannels]);

    const getChannelUsers = useCallback(async (id: string): Promise<ChannelUser[]> => {
        try {
            const data = await api.get<ChannelUser[]>(`/channels/${id}/users`);
            return data || [];
        } catch (error) {
            console.error('Get channel users failed', error);
            return [];
        }
    }, []);

    const getChannelWebhookLogs = useCallback(async (id: string): Promise<WebhookLog[]> => {
        try {
            const data = await api.get<WebhookLog[]>(`/channels/${id}/webhook-logs`);
            return data || [];
        } catch (error) {
            console.error('Get channel webhook logs failed', error);
            return [];
        }
    }, []);

    // 模板操作
    const fetchTemplates = useCallback(async () => {
        try {
            const data = await api.get<NotificationTemplate[]>('/templates');
            setTemplates(data || []);
        } catch (error) {
            console.error('Fetch templates failed', error);
        }
    }, []);

    const addTemplate = useCallback(async (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await api.post('/templates', template);
            await fetchTemplates();
            return true;
        } catch (error) {
            console.error('Add template failed', error);
            return false;
        }
    }, [fetchTemplates]);

    const updateTemplate = useCallback(async (id: string, updates: Partial<NotificationTemplate>) => {
        try {
            await api.put(`/templates/${id}`, updates);
            await fetchTemplates();
            return true;
        } catch (error) {
            console.error('Update template failed', error);
            return false;
        }
    }, [fetchTemplates]);

    const deleteTemplate = useCallback(async (id: string) => {
        try {
            await api.delete(`/templates/${id}`);
            await fetchTemplates();
            return true;
        } catch (error) {
            console.error('Delete template failed', error);
            return false;
        }
    }, [fetchTemplates]);

    // 統計操作
    const fetchStats = useCallback(async () => {
        try {
            interface DashboardData extends Omit<NotificationStats, 'recentActivity'> {
                trendData: { date: string; sent: number; success: number; failed: number }[];
                recentLogs?: NotificationLog[];
                recentMessages?: NotificationMessage[];
                windowsStats?: {
                    total: number;
                    pending: number;
                    today: number;
                    trends: { date: string; count: number }[];
                };
            }
            const data = await api.get<DashboardData>('/stats/dashboard');
            // 轉換後端 trendData 為前端 recentActivity
            const formattedStats: NotificationStats = {
                ...data,
                recentActivity: data.trendData || []
            };
            setStats(formattedStats);

            // 同時更新最近日誌與訊息
            if (data.recentLogs) {
                setLogs(data.recentLogs || []);
            }
            if (data.recentMessages) {
                setMessages(data.recentMessages || []);
            }
        } catch (error) {
            console.error('Fetch stats failed', error);
        }
    }, []);

    // API 金鑰操作
    const fetchApiKeys = useCallback(async () => {
        try {
            const data = await api.get<ApiKey[]>('/api-keys');
            setApiKeys(data || []);
        } catch (error) {
            console.error('Fetch API keys failed', error);
        }
    }, []);

    const addApiKey = useCallback(async (apiKey: Omit<ApiKey, 'id' | 'key' | 'prefix' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
        try {
            const data = await api.post<{ key: string }>('/api-keys', apiKey);
            await fetchApiKeys();
            return data.key; // 返回明文金鑰
        } catch (error) {
            console.error('Add API key failed', error);
            return null;
        }
    }, [fetchApiKeys]);

    const updateApiKey = useCallback(async (id: string, updates: Partial<ApiKey>) => {
        try {
            await api.put(`/api-keys/${id}`, updates);
            await fetchApiKeys();
            return true;
        } catch (error) {
            console.error('Update API key failed', error);
            return false;
        }
    }, [fetchApiKeys]);

    const deleteApiKey = useCallback(async (id: string) => {
        try {
            await api.delete(`/api-keys/${id}`);
            await fetchApiKeys();
            return true;
        } catch (error) {
            console.error('Delete API key failed', error);
            return false;
        }
    }, [fetchApiKeys]);

    const toggleApiKey = useCallback(async (id: string) => {
        try {
            await api.put(`/api-keys/${id}/toggle`);
            await fetchApiKeys();
            return true;
        } catch (error) {
            console.error('Toggle API key failed', error);
            return false;
        }
    }, [fetchApiKeys]);

    const regenerateApiKey = useCallback(async (id: string): Promise<string | null> => {
        try {
            const data = await api.put<{ key: string }>(`/api-keys/${id}/regenerate`);
            await fetchApiKeys();
            return data.key;
        } catch (error) {
            console.error('Regenerate API key failed', error);
            return null;
        }
    }, [fetchApiKeys]);

    // API 使用紀錄操作
    const fetchApiUsage = useCallback(async (params?: Record<string, string | number | boolean>) => {
        try {
            const [logsData, statsData] = await Promise.all([
                api.get<{ logs: ApiUsageLog[]; total: number }>('/api-usage/logs', params),
                api.get<ApiStats>('/api-usage/stats', params)
            ]);

            setApiUsageLogs(logsData.logs || []);
            setApiStats(statsData);
        } catch (error) {
            console.error('Fetch API usage failed', error);
        }
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    // 排程器管理
    const fetchSchedulerStatus = useCallback(async () => {
        try {
            const response = await api.get<SchedulerStatus>('/scheduler/status');
            return response;
        } catch (error) {
            console.error('Fetch scheduler status failed', error);
            throw error;
        }
    }, []);

    const fetchSchedulerLogs = useCallback(async (limit: number = 50) => {
        try {
            const response = await api.get<SchedulerLog[]>(`/scheduler/logs?limit=${limit}`);
            return response || [];
        } catch (error) {
            console.error('Fetch scheduler logs failed', error);
            return [];
        }
    }, []);

    const enableScheduler = useCallback(async () => {
        try {
            await api.post('/scheduler/enable');
            return true;
        } catch (error) {
            console.error('Enable scheduler failed', error);
            return false;
        }
    }, []);

    const disableScheduler = useCallback(async () => {
        try {
            await api.post('/scheduler/disable');
            return true;
        } catch (error) {
            console.error('Disable scheduler failed', error);
            return false;
        }
    }, []);

    const runSchedulerNow = useCallback(async () => {
        try {
            await api.post('/scheduler/run-now');
            return true;
        } catch (error) {
            console.error('Run scheduler now failed', error);
            return false;
        }
    }, []);

    const fetchSchedulerSettings = useCallback(async (): Promise<SchedulerSettings> => {
        try {
            const data = await api.get<SchedulerSettings>('/scheduler/settings');
            return data;
        } catch (error) {
            console.error('Fetch scheduler settings failed', error);
            throw error;
        }
    }, []);

    const updateSchedulerSettings = useCallback(async (settings: Partial<SchedulerSettings>) => {
        try {
            await api.post('/scheduler/settings', settings);
            return true;
        } catch (error) {
            console.error('Update scheduler settings failed', error);
            return false;
        }
    }, []);

    // 登入後自動加載基本數據
    // 這裡需要在認證狀態改變時獲取數據，這是合理的 useEffect 使用場景
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (isAuthenticated) {
            // 使用 void 表示我們不關心這些 Promise 的結果
            void fetchChannels();
            void fetchTemplates();
            void fetchStats();
            void fetchApiUsage();
        } else {
            // 清空數據
            setChannels([]);
            setMessages([]);
            setLogs([]);
            setTemplates([]);
            setStats(null);
            setApiKeys([]);
            setApiUsageLogs([]);
            setApiStats(null);
        }
    }, [isAuthenticated, fetchChannels, fetchMessages, fetchTemplates, fetchStats, fetchApiKeys, fetchApiUsage]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <NotificationContext.Provider
            value={{
                channels,
                fetchChannels,
                addChannel,
                updateChannel,
                deleteChannel,
                toggleChannel,
                testChannel,
                regenerateChannelWebhook,
                getChannelUsers,
                getChannelWebhookLogs,
                messages,
                fetchMessages,
                sendMessage,
                deleteMessage,
                logs,
                templates,
                fetchTemplates,
                addTemplate,
                updateTemplate,
                deleteTemplate,
                stats,
                fetchStats,
                apiKeys,
                fetchApiKeys,
                addApiKey,
                updateApiKey,
                deleteApiKey,
                toggleApiKey,
                regenerateApiKey,
                apiUsageLogs,
                apiStats,
                fetchApiUsage,
                fetchSchedulerStatus,
                fetchSchedulerLogs,
                enableScheduler,
                disableScheduler,
                runSchedulerNow,
                fetchSchedulerSettings,
                updateSchedulerSettings,
                isLoading,
                sidebarCollapsed,
                toggleSidebar
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}
