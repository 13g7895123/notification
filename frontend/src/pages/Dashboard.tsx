import {
    LayoutDashboard,
    Send,
    CheckCircle,
    XCircle,
    TrendingUp,
    MessageSquare,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Monitor,
    RefreshCw,
    Activity,
    Play
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { toast } from '../utils/alert';

interface SystemStatus {
    scheduler_running: boolean;
    last_heartbeat: string | null;
    heartbeat_diff: number | null;
    server_time: string;
    timezone: string;
}

export function Dashboard() {
    const { stats, messages, channels, logs, apiUsageLogs, isLoading } = useNotification();
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSystemStatus = async () => {
        setIsRefreshing(true);
        try {
            const data = await api.get<SystemStatus>('/system/status');
            setSystemStatus(data);
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStartScheduler = async () => {
        setIsRefreshing(true);
        try {
            await api.post('/system/scheduler/start');
            toast.success('啟動指令已發送');
            setTimeout(fetchSystemStatus, 3000);
        } catch (error) {
            console.error('Start scheduler failed:', error);
            toast.error('啟動失敗，請查看後端日誌');
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading || !stats) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-md">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-color-primary border-t-transparent"></div>
                <p className="text-text-secondary">正在載入統計數據...</p>
            </div>
        );
    }

    const recentMessages = messages.slice(0, 5);
    const recentApiLogs = apiUsageLogs.slice(0, 6);
    const recentLogs = logs.slice(0, 6);

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <LayoutDashboard size={22} />
                        </div>
                        儀表板
                        {systemStatus && (
                            <div className={`flex items-center gap-xs rounded-full px-3 py-1 text-[0.7rem] font-600 ${systemStatus.scheduler_running ? 'bg-success/20 text-color-success-light' : 'bg-error/20 text-color-error-light'}`}>
                                <Activity size={12} className={systemStatus.scheduler_running ? 'animate-pulse' : ''} />
                                <span>{systemStatus.scheduler_running ? '系統排程運作中' : '系統排程已停止'}</span>
                            </div>
                        )}
                    </h1>
                    <p className="mt-1 text-text-muted">通知系統運作概況與統計數據</p>
                </div>

                <div className="flex items-center gap-md">
                    {systemStatus && !systemStatus.scheduler_running && (
                        <button
                            className="btn bg-linear-to-br from-color-primary to-color-primary-dark text-white hover:shadow-glow"
                            onClick={handleStartScheduler}
                            disabled={isRefreshing}
                        >
                            <Play size={14} />
                            啟動排程
                        </button>
                    )}

                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-secondary p-1">
                        {systemStatus ? (
                            <div className="flex items-center gap-sm px-3 py-1 cursor-pointer" onClick={fetchSystemStatus}>
                                <Activity size={14} className={systemStatus.scheduler_running ? 'text-color-success' : 'text-color-error'} />
                                <span className="text-[0.85rem] font-500 text-text-secondary">
                                    排程器: <span className={systemStatus.scheduler_running ? 'text-color-success-light' : 'text-color-error-light'}>{systemStatus.scheduler_running ? '正在運行' : '已停止'}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-sm px-3 py-1 cursor-pointer" onClick={fetchSystemStatus}>
                                <Activity size={14} className="text-text-muted" />
                                <span className="text-[0.85rem] text-text-muted">檢查中...</span>
                            </div>
                        )}
                        <button
                            className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary ${isRefreshing ? 'animate-spin' : ''}`}
                            onClick={fetchSystemStatus}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: '總發送數', value: stats.totalSent, icon: Send, color: 'primary', trend: '+12.5%', pos: true },
                    { label: '成功發送', value: stats.totalSuccess, icon: CheckCircle, color: 'success', trend: '+2.3%', pos: true },
                    { label: '發送失敗', value: stats.totalFailed, icon: XCircle, color: 'error', trend: '-8.1%', pos: false },
                    { label: '桌面通知數', value: stats.windowsStats?.total || 0, icon: Monitor, color: 'accent', meta: `今日: ${stats.windowsStats?.today || 0}` }
                ].map((item, i) => (
                    <div key={i} className="card group flex flex-col gap-sm overflow-hidden border border-border-color bg-bg-card p-lg backdrop-blur-md transition-all hover:border-color-primary hover:shadow-glow translate-y-0 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-md bg-color-${item.color}/20 text-color-${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            {item.trend && (
                                <div className={`flex items-center gap-xs text-[0.75rem] font-600 ${item.pos ? 'text-color-success' : 'text-color-error'}`}>
                                    {item.pos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    <span>{item.trend}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-3xl font-700 text-text-primary">{item.value.toLocaleString()}</div>
                        <div className="text-[0.875rem] text-text-secondary">{item.label}</div>
                        {item.meta && <div className="text-[0.75rem] text-text-muted">{item.meta}</div>}
                    </div>
                ))}
            </div>

            {/* Content Mid */}
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-5">
                {/* 渠道狀態 */}
                <div className="card lg:col-span-2">
                    <div className="mb-md flex items-center justify-between border-b border-border-color-light pb-md">
                        <h2 className="flex items-center gap-md text-lg font-600 text-text-primary">
                            <Zap size={18} className="text-color-warning" />
                            渠道狀態
                        </h2>
                    </div>
                    <div className="flex flex-col gap-sm">
                        {channels.map((channel, index) => (
                            <div key={channel.id} className="flex items-center justify-between rounded-md border border-border-color/50 bg-bg-tertiary/30 p-md animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex items-center gap-md">
                                    <div className={`rounded-sm px-2 py-0.5 text-[0.65rem] font-700 tracking-wider ${channel.type === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>
                                        {channel.type.toUpperCase()}
                                    </div>
                                    <span className="text-[0.9rem] font-500 text-text-primary">{channel.name}</span>
                                </div>
                                <div className={`flex items-center gap-sm text-[0.8rem] ${channel.enabled ? 'text-color-success' : 'text-text-muted'}`}>
                                    <div className={`h-2 w-2 rounded-full ${channel.enabled ? 'bg-color-success animate-pulse shadow-[0_0_8px_var(--color-success)]' : 'bg-text-muted opacity-50'}`} />
                                    {channel.enabled ? '運作中' : '已停用'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 發送趨勢 */}
                <div className="card lg:col-span-3">
                    <div className="mb-md flex items-center justify-between border-b border-border-color-light pb-md">
                        <h2 className="flex items-center gap-md text-lg font-600 text-text-primary">
                            <TrendingUp size={18} className="text-color-primary-light" />
                            近 7 日發送趨勢
                        </h2>
                    </div>
                    <div className="flex h-48 items-end justify-between gap-md px-md py-md">
                        {stats.recentActivity.map((day) => {
                            const maxSent = Math.max(...stats.recentActivity.map(d => d.sent), 1);
                            const successHeight = (day.success / maxSent) * 100;
                            const failedHeight = (day.failed / maxSent) * 100;
                            return (
                                <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-sm">
                                    <div className="relative w-8 flex-1 overflow-hidden rounded-t-sm bg-bg-tertiary">
                                        <div className="absolute bottom-0 w-full bg-color-success transition-all duration-500" style={{ height: `${successHeight}%` }} />
                                        <div className="absolute w-full bg-color-error transition-all duration-500" style={{ height: `${failedHeight}%`, bottom: `${successHeight}%` }} />
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 flex-col items-center rounded-md bg-bg-secondary p-2 shadow-lg group-hover:flex z-10 w-24">
                                            <span className="text-[0.7rem] text-text-muted">{day.date}</span>
                                            <span className="text-[0.8rem] font-600 text-color-success-light">成功: {day.success}</span>
                                            <span className="text-[0.8rem] font-600 text-color-error-light">失敗: {day.failed}</span>
                                        </div>
                                    </div>
                                    <span className="text-[0.7rem] text-text-muted">{format(new Date(day.date), 'MM/dd')}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-md flex justify-center gap-lg border-t border-border-color-light pt-md">
                        <div className="flex items-center gap-sm text-[0.75rem] text-text-muted">
                            <div className="h-2.5 w-2.5 rounded-full bg-color-success" /> 成功
                        </div>
                        <div className="flex items-center gap-sm text-[0.75rem] text-text-muted">
                            <div className="h-2.5 w-2.5 rounded-full bg-color-error" /> 失敗
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 gap-lg xl:grid-cols-3">
                {/* 最近發送 */}
                <div className="card">
                    <div className="mb-md flex items-center justify-between border-b border-border-color-light pb-md">
                        <h2 className="flex items-center gap-md text-lg font-600 text-text-primary">
                            <MessageSquare size={18} className="text-color-accent" />
                            最近發送
                        </h2>
                    </div>
                    <div className="flex flex-col gap-md">
                        {recentMessages.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center text-text-muted italic">暫無發送紀錄</div>
                        ) : (
                            recentMessages.map((msg, index) => (
                                <div key={msg.id} className="flex flex-col gap-2 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="truncate text-sm font-600 text-text-primary">{msg.title}</h4>
                                        <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-600 ${getStatusClass(msg.status)}`}>
                                            {getStatusText(msg.status)}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-[0.8rem] text-text-secondary leading-relaxed">{msg.content}</p>
                                    <div className="text-[0.7rem] text-text-muted">
                                        {msg.sentAt ? format(new Date(msg.sentAt), 'MM/dd HH:mm', { locale: zhTW }) : '待發送'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* API Logs */}
                <div className="card">
                    <div className="mb-md flex items-center justify-between border-b border-border-color-light pb-md">
                        <h2 className="flex items-center gap-md text-lg font-600 text-text-primary">
                            <Activity size={18} className="text-color-primary-light" />
                            API 使用紀錄
                        </h2>
                    </div>
                    <div className="flex flex-col gap-sm">
                        {recentApiLogs.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center text-text-muted italic">暫無紀錄</div>
                        ) : (
                            recentApiLogs.map((log, index) => (
                                <div key={log.id} className="flex items-center gap-md rounded-md bg-bg-tertiary/20 p-sm border border-border-color/30 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${log.success ? 'bg-color-success' : 'bg-color-error'}`} />
                                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                                        <div className="flex items-center gap-sm">
                                            <span className={`rounded-sm px-1.5 py-0.5 text-[0.6rem] font-800 ${log.method === 'GET' ? 'bg-color-info/20 text-color-info-light' : 'bg-color-primary/20 text-color-primary-light'}`}>{log.method}</span>
                                            <span className="truncate text-[0.75rem] font-600 text-text-secondary">{log.apiKeyName}</span>
                                        </div>
                                        <span className="truncate text-[0.7rem] font-mono text-text-muted" title={log.endpoint}>{log.endpoint}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[0.7rem] font-700 ${log.success ? 'text-color-success' : 'text-color-error'}`}>{log.statusCode}</span>
                                        <span className="text-[0.65rem] text-text-muted">{log.responseTime}ms</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 通知日誌 */}
                <div className="card">
                    <div className="mb-md flex items-center justify-between border-b border-border-color-light pb-md">
                        <h2 className="flex items-center gap-md text-lg font-600 text-text-primary">
                            <Zap size={18} className="text-color-warning" />
                            最新發送日誌
                        </h2>
                    </div>
                    <div className="flex flex-col gap-sm">
                        {recentLogs.map((log, index) => (
                            <div key={log.id} className="flex items-center gap-md rounded-md bg-bg-tertiary/20 p-sm border border-border-color/30 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${log.status === 'success' ? 'bg-color-success' : 'bg-color-error'}`} />
                                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                                    <div className="flex items-center gap-sm">
                                        <span className={`rounded-sm px-1.5 py-0.5 text-[0.6rem] font-800 ${log.channelType === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>{log.channelType.toUpperCase()}</span>
                                        <span className="truncate text-[0.75rem] font-600 text-text-secondary">{log.channelName}</span>
                                    </div>
                                    <span className="truncate text-[0.7rem] text-text-muted">{log.title}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-[0.65rem] text-text-muted">
                                    <span>{format(new Date(log.sentAt), 'HH:mm:ss')}</span>
                                    {log.responseTime && <span>{log.responseTime}ms</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusClass(status: string): string {
    switch (status) {
        case 'sent': return 'bg-success/20 text-color-success-light';
        case 'failed': return 'bg-error/20 text-color-error-light';
        case 'partial': return 'bg-warning/20 text-color-warning-light';
        default: return 'bg-info/20 text-color-info-light';
    }
}

function getStatusText(status: string): string {
    const texts: Record<string, string> = {
        sent: '已發送', failed: '失敗', partial: '部分成功',
        scheduled: '已排程', sending: '發送中', pending: '待發送'
    };
    return texts[status] || status;
}
