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
    Monitor
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import './Dashboard.css';

export function Dashboard() {
    const { stats, messages, channels, logs, isLoading } = useNotification();

    if (isLoading || !stats) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p>正在載入統計數據...</p>
            </div>
        );
    }

    const recentMessages = messages.slice(0, 5);
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
                                        {format(new Date(day.date), 'MM/dd')}
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
                        {recentMessages.map((msg, index) => (
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
                                            ? format(new Date(msg.sentAt), 'MM/dd HH:mm', { locale: zhTW })
                                            : msg.scheduledAt
                                                ? `預定 ${format(new Date(msg.scheduledAt), 'MM/dd HH:mm', { locale: zhTW })}`
                                                : '-'
                                        }
                                    </span>
                                </div>
                            </div>
                        ))}
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
                                        {format(new Date(log.sentAt), 'HH:mm:ss')}
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
