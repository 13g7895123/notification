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
import { safeFormatDate, safeFormatDateSimple, DateFormats } from '../utils/dateUtils';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { toast } from '../utils/alert';
import './Dashboard.css';

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
            // 延遲 3 秒後重新檢查狀態
            setTimeout(fetchSystemStatus, 3000);
        } catch (error) {
            console.error('Start scheduler failed:', error);
            toast.error('啟動失敗，請查看後端日誌');
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 30000); // 每 30 秒自動更新
        return () => clearInterval(interval);
    }, []);

    if (isLoading || !stats) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p>正在載入統計數據...</p>
            </div>
        );
    }

    const recentMessages = messages.slice(0, 5);
    const recentApiLogs = apiUsageLogs.slice(0, 6);
    const recentLogs = logs.slice(0, 6);

    return (
        <div className="dashboard">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <LayoutDashboard size={22} />
                        </div>
                        儀表板
                    </h1>
                    <p className="page-description">
                        通知系統運作概況與統計數據
                    </p>
                </div>

                {/* 系統狀態檢查按鈕 */}
                <div className="system-status-checks">
                    {systemStatus && !systemStatus.scheduler_running && (
                        <button
                            className="btn-start-scheduler"
                            onClick={handleStartScheduler}
                            disabled={isRefreshing}
                        >
                            <Play size={14} />
                            啟動排程
                        </button>
                    )}

                    {systemStatus ? (
                        <div className={`status-badge ${systemStatus.scheduler_running ? 'running' : 'stopped'}`} onClick={fetchSystemStatus} title="點擊立即重新整理">
                            <div className="status-badge-icon">
                                <Activity size={14} />
                            </div>
                            <div className="status-badge-text">
                                <span className="status-label">排程器:</span>
                                <span className="status-value">
                                    {systemStatus.scheduler_running ? '正在運行' : '已停止'}
                                </span>
                            </div>
                            {systemStatus.last_heartbeat && (
                                <div className="status-tooltip">
                                    最後心跳: {systemStatus.last_heartbeat}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="status-badge unknown" onClick={fetchSystemStatus} style={{ cursor: 'pointer' }}>
                            <Activity size={14} />
                            <div className="status-badge-text">
                                <span className="status-value">點擊檢查狀態</span>
                            </div>
                        </div>
                    )}
                    <button
                        className={`btn-refresh-status ${isRefreshing ? 'spinning' : ''}`}
                        onClick={fetchSystemStatus}
                        title="立即檢查系統狀態"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="stats-grid dashboard-stats-grid">
                <div className="card stat-card">
                    <div className="stat-header">
                        <div className="stat-icon sent">
                            <Send size={20} />
                        </div>
                        <div className="stat-change positive">
                            <ArrowUpRight size={14} />
                            <span>+12.5%</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.totalSent.toLocaleString()}</div>
                    <div className="stat-label">總發送數</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-header">
                        <div className="stat-icon success">
                            <CheckCircle size={20} />
                        </div>
                        <div className="stat-change positive">
                            <ArrowUpRight size={14} />
                            <span>+2.3%</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.totalSuccess.toLocaleString()}</div>
                    <div className="stat-label">成功發送</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-header">
                        <div className="stat-icon failed">
                            <XCircle size={20} />
                        </div>
                        <div className="stat-change negative">
                            <ArrowDownRight size={14} />
                            <span>-8.1%</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.totalFailed}</div>
                    <div className="stat-label">發送失敗</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-header">
                        <div className="stat-icon windows">
                            <Monitor size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{stats.windowsStats?.total || 0}</div>
                    <div className="stat-label">桌面通知數</div>
                    <div className="stat-meta">
                        今日新增: {stats.windowsStats?.today || 0}
                    </div>
                </div>
            </div>

            {/* 主內容區 */}
            <div className="dashboard-content">
                {/* 渠道狀態 */}
                <div className="card channel-status-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Zap size={18} />
                            渠道狀態
                        </h2>
                    </div>
                    <div className="channel-list">
                        {channels.map((channel, index) => (
                            <div
                                key={channel.id}
                                className="channel-item animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="channel-info">
                                    <div className={`channel-type-badge ${channel.type}`}>
                                        {channel.type.toUpperCase()}
                                    </div>
                                    <span className="channel-name">{channel.name}</span>
                                </div>
                                <div className={`channel-status ${channel.enabled ? 'online' : 'offline'}`}>
                                    <span className="status-dot" />
                                    {channel.enabled ? '運作中' : '已停用'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 近期活動圖表 */}
                <div className="card activity-chart-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <TrendingUp size={18} />
                            近 7 日發送趨勢
                        </h2>
                    </div>
                    <div className="activity-chart">
                        {stats.recentActivity.map((day, index) => {
                            const maxSent = Math.max(...stats.recentActivity.map(d => d.sent), 1);
                            const successHeight = maxSent > 0 ? (day.success / maxSent) * 100 : 0;
                            const failedHeight = maxSent > 0 ? (day.failed / maxSent) * 100 : 0;
                            return (
                                <div
                                    key={day.date}
                                    className="chart-bar-container"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="chart-bar-wrapper">
                                        <div
                                            className="chart-bar success-bar"
                                            style={{ height: `${successHeight}%` }}
                                        />
                                        <div
                                            className="chart-bar failed-bar"
                                            style={{
                                                height: `${failedHeight}%`,
                                                bottom: `${successHeight}%`
                                            }}
                                        />
                                    </div>
                                    <span className="chart-label">
                                        {safeFormatDateSimple(day.date, DateFormats.SHORT_DATE)}
                                    </span>
                                    <span className="chart-value">{day.sent}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot success" />
                            成功
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot failed" />
                            失敗
                        </div>
                    </div>
                </div>
            </div>

            {/* 最近發送 & 日誌 */}
            <div className="dashboard-bottom">
                {/* 最近訊息 */}
                <div className="card recent-messages-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <MessageSquare size={18} />
                            最近發送
                        </h2>
                    </div>
                    <div className="recent-list">
                        {recentMessages.length === 0 ? (
                            <div className="empty-state">暫無發送紀錄</div>
                        ) : (
                            recentMessages.map((msg, index) => (
                                <div
                                    key={msg.id}
                                    className="recent-item animate-slide-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="recent-item-content">
                                        <h4 className="recent-item-title">{msg.title}</h4>
                                        <p className="recent-item-desc">{msg.content}</p>
                                    </div>
                                    <div className="recent-item-meta">
                                        <span className={`badge badge-${getStatusBadge(msg.status)}`}>
                                            {getStatusText(msg.status)}
                                        </span>
                                        <span className="recent-item-time">
                                            {msg.sentAt
                                                ? safeFormatDate(msg.sentAt, DateFormats.SHORT_DATETIME)
                                                : msg.scheduledAt
                                                    ? `預定 ${safeFormatDate(msg.scheduledAt, DateFormats.SHORT_DATETIME)}`
                                                    : '-'
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* API 使用紀錄 */}
                <div className="card logs-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Activity size={18} />
                            API 使用紀錄
                        </h2>
                    </div>
                    <div className="logs-list">
                        {recentApiLogs.length === 0 ? (
                            <div className="empty-state">暫無使用紀錄</div>
                        ) : (
                            recentApiLogs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className="log-item animate-slide-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`log-status-indicator ${log.success ? 'success' : 'failed'}`} />
                                    <div className="log-content">
                                        <div className="log-header">
                                            <span className={`badge badge-sm ${log.method === 'GET' ? 'badge-info' : 'badge-primary'}`}>
                                                {log.method}
                                            </span>
                                            <span className="log-channel-name">
                                                {log.apiKeyName || 'Unknown Key'}
                                            </span>
                                        </div>
                                        <div className="log-title" title={log.endpoint}>
                                            {log.endpoint}
                                        </div>
                                    </div>
                                    <div className="log-meta">
                                        <span className={`badge badge-sm ${log.success ? 'badge-success' : 'badge-error'}`}>
                                            {log.statusCode}
                                        </span>
                                        <div className="log-bottom-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                            <span className="log-response-time">
                                                {log.responseTime}ms
                                            </span>
                                            <span className="log-time">
                                                {safeFormatDate(log.createdAt, DateFormats.TIME)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 發送日誌 */}
                <div className="card logs-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Zap size={18} />
                            最新日誌
                        </h2>
                    </div>
                    <div className="logs-list">
                        {recentLogs.map((log, index) => (
                            <div
                                key={log.id}
                                className="log-item animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`log-status-indicator ${log.status}`} />
                                <div className="log-content">
                                    <div className="log-header">
                                        <span className={`badge badge-${log.channelType}`}>
                                            {log.channelType.toUpperCase()}
                                        </span>
                                        <span className="log-channel-name">{log.channelName}</span>
                                    </div>
                                    <p className="log-title">{log.title}</p>
                                </div>
                                <div className="log-meta">
                                    <span className="log-time">
                                        {safeFormatDateSimple(log.sentAt, DateFormats.TIME)}
                                    </span>
                                    {log.responseTime && (
                                        <span className="log-response-time">{log.responseTime}ms</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusBadge(status: string): string {
    switch (status) {
        case 'sent': return 'success';
        case 'failed': return 'error';
        case 'partial': return 'warning';
        case 'scheduled': return 'info';
        case 'sending': return 'info';
        default: return 'info';
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case 'sent': return '已發送';
        case 'failed': return '失敗';
        case 'partial': return '部分成功';
        case 'scheduled': return '已排程';
        case 'sending': return '發送中';
        case 'pending': return '待發送';
        default: return status;
    }
}
