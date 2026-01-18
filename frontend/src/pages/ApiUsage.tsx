import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    BarChart3,
    Eye,
    X,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertTriangle,
    Users,
    MessageSquare,
    Zap
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { ApiUsageLog, WebSocketConnection } from '../types';
import { safeFormatDate, safeFormatDateSimple, DateFormats } from '../utils/dateUtils';
import './ApiUsage.css';

export function ApiUsage() {
    const {
        apiUsageLogs,
        apiStats,
        apiKeys,
        fetchApiUsage,
        wsConnections,
        wsStats,
        fetchWebSocketConnections,
        fetchWebSocketStats,
        isLoading
    } = useNotification();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [keyFilter, setKeyFilter] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<ApiUsageLog | null>(null);
    const [selectedWsConnection, setSelectedWsConnection] = useState<WebSocketConnection | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [wsStatusFilter, setWsStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'error'>('all');

    useEffect(() => {
        fetchApiUsage();
        fetchWebSocketConnections();
        fetchWebSocketStats();
    }, [fetchApiUsage, fetchWebSocketConnections, fetchWebSocketStats]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchApiUsage(),
            fetchWebSocketConnections(),
            fetchWebSocketStats()
        ]);
        setTimeout(() => setIsRefreshing(false), 500);
    }, [fetchApiUsage, fetchWebSocketConnections, fetchWebSocketStats]);

    if (isLoading || !apiStats) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p>正在載入 API 使用紀錄...</p>
            </div>
        );
    }

    const filteredLogs = apiUsageLogs.filter(log => {
        const matchesSearch = log.endpoint.toLowerCase().includes(search.toLowerCase()) ||
            log.apiKeyName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'success' ? log.success : !log.success);
        const matchesKey = keyFilter === 'all' || log.apiKeyId === keyFilter;
        return matchesSearch && matchesStatus && matchesKey;
    });

    return (
        <div className="api-usage-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Activity size={22} />
                        </div>
                        API 使用紀錄
                    </h1>
                    <p className="page-description">
                        監控 API 請求與使用情況
                    </p>
                </div>
            </div>

            {/* WebSocket 連線追蹤區塊 */}
            <div className="websocket-section" style={{ marginBottom: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-primary)'
                    }}>
                        <Wifi size={20} />
                        WebSocket 連線追蹤
                    </h2>
                </div>

                {/* WebSocket 統計卡片 */}
                {wsStats && (
                    <div className="api-usage-stats" style={{ marginBottom: '1.5rem' }}>
                        <div className="usage-stat-card">
                            <div className="usage-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <Users size={20} />
                            </div>
                            <div className="usage-stat-content">
                                <span className="usage-stat-value">{wsStats.activeConnections}</span>
                                <span className="usage-stat-label">目前連線</span>
                            </div>
                        </div>
                        <div className="usage-stat-card">
                            <div className="usage-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                                <BarChart3 size={20} />
                            </div>
                            <div className="usage-stat-content">
                                <span className="usage-stat-value">{wsStats.totalConnections}</span>
                                <span className="usage-stat-label">總連線數</span>
                            </div>
                        </div>
                        <div className="usage-stat-card">
                            <div className="usage-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div className="usage-stat-content">
                                <span className="usage-stat-value">{wsStats.errorConnections}</span>
                                <span className="usage-stat-label">錯誤連線</span>
                            </div>
                        </div>
                        <div className="usage-stat-card">
                            <div className="usage-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                                <MessageSquare size={20} />
                            </div>
                            <div className="usage-stat-content">
                                <span className="usage-stat-value">{wsStats.messageStats.totalSent.toLocaleString()}</span>
                                <span className="usage-stat-label">已發送訊息</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* WebSocket 連線篩選器 */}
                <div className="usage-filters card" style={{ marginBottom: '1rem' }}>
                    <div className="filter-group">
                        <Filter size={16} />
                        <select
                            className="input select"
                            value={wsStatusFilter}
                            onChange={e => setWsStatusFilter(e.target.value as 'all' | 'connected' | 'disconnected' | 'error')}
                        >
                            <option value="all">所有狀態</option>
                            <option value="connected">已連線</option>
                            <option value="disconnected">已斷線</option>
                            <option value="error">錯誤</option>
                        </select>
                    </div>

                    <div className="filter-stats">
                        <span>顯示 {wsConnections.filter(conn => wsStatusFilter === 'all' || conn.status === wsStatusFilter).length} 筆</span>
                    </div>
                </div>

                {/* WebSocket 連線列表 */}
                <div className="table-container card">
                    {wsConnections.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔌</div>
                            <h3 className="empty-state-title">沒有連線紀錄</h3>
                            <p className="empty-state-description">尚無 WebSocket 連線</p>
                        </div>
                    ) : (
                        <table className="table usage-table">
                            <thead>
                                <tr>
                                    <th>連線 ID</th>
                                    <th>IP 位址</th>
                                    <th>狀態</th>
                                    <th>連線時間</th>
                                    <th>最後 Ping</th>
                                    <th>訊息數</th>
                                    <th>錯誤</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {wsConnections
                                    .filter(conn => wsStatusFilter === 'all' || conn.status === wsStatusFilter)
                                    .map((conn, index) => (
                                        <tr key={conn.id} className="animate-slide-up" style={{ animationDelay: `${index * 20}ms` }}>
                                            <td className="font-mono">
                                                <code style={{ fontSize: '0.875rem' }}>{conn.connectionId.substring(0, 12)}...</code>
                                            </td>
                                            <td className="font-mono">{conn.ipAddress}</td>
                                            <td>
                                                <span className={`status-badge ${conn.status === 'connected' ? 'success' :
                                                    conn.status === 'error' ? 'error' :
                                                        'default'
                                                    }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {conn.status === 'connected' && <Wifi size={14} />}
                                                    {conn.status === 'disconnected' && <WifiOff size={14} />}
                                                    {conn.status === 'error' && <AlertTriangle size={14} />}
                                                    {conn.status === 'connected' ? '已連線' : conn.status === 'error' ? '錯誤' : '已斷線'}
                                                </span>
                                            </td>
                                            <td className="font-mono">
                                                {safeFormatDate(conn.connectedAt, DateFormats.SHORT_DATE_FULL_TIME)}
                                            </td>
                                            <td className="font-mono">
                                                {conn.lastPingAt ? safeFormatDate(conn.lastPingAt, DateFormats.SHORT_DATE_FULL_TIME) : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                    <span title="發送">
                                                        <Zap size={14} style={{ display: 'inline', marginRight: '0.25rem', color: 'var(--color-success)' }} />
                                                        {conn.messagesSent}
                                                    </span>
                                                    <span title="接收">
                                                        <MessageSquare size={14} style={{ display: 'inline', marginRight: '0.25rem', color: 'var(--color-info)' }} />
                                                        {conn.messagesReceived}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {conn.errorCount > 0 ? (
                                                    <span className="status-badge error">
                                                        {conn.errorCount} 次
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => setSelectedWsConnection(conn)}
                                                    title="詳情"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* API 使用紀錄標題 */}
            <div className="section-header" style={{ marginBottom: '1.5rem', marginTop: '3rem' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                    <Activity size={20} />
                    API 使用紀錄
                </h2>
            </div>

            {/* 統計卡片 */}
            <div className="api-usage-stats">
                <div className="usage-stat-card">
                    <div className="usage-stat-icon total">
                        <BarChart3 size={20} />
                    </div>
                    <div className="usage-stat-content">
                        <span className="usage-stat-value">{apiStats.totalRequests.toLocaleString()}</span>
                        <span className="usage-stat-label">總請求數</span>
                    </div>
                </div>
                <div className="usage-stat-card">
                    <div className="usage-stat-icon success">
                        <CheckCircle size={20} />
                    </div>
                    <div className="usage-stat-content">
                        <span className="usage-stat-value">{apiStats.successfulRequests.toLocaleString()}</span>
                        <span className="usage-stat-label">成功請求</span>
                    </div>
                </div>
                <div className="usage-stat-card">
                    <div className="usage-stat-icon failed">
                        <XCircle size={20} />
                    </div>
                    <div className="usage-stat-content">
                        <span className="usage-stat-value">{apiStats.failedRequests}</span>
                        <span className="usage-stat-label">失敗請求</span>
                    </div>
                </div>
                <div className="usage-stat-card">
                    <div className="usage-stat-icon time">
                        <Clock size={20} />
                    </div>
                    <div className="usage-stat-content">
                        <span className="usage-stat-value">{apiStats.avgResponseTime}ms</span>
                        <span className="usage-stat-label">平均回應時間</span>
                    </div>
                </div>
            </div>

            {/* 圖表區 */}
            <div className="api-usage-charts">
                {/* 端點統計 */}
                <div className="card endpoint-stats-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <TrendingUp size={18} />
                            端點使用統計
                        </h3>
                    </div>
                    <div className="endpoint-list">
                        {apiStats.requestsByEndpoint.map((ep, index) => {
                            const maxCount = Math.max(...apiStats.requestsByEndpoint.map(e => e.count));
                            const percentage = (ep.count / maxCount) * 100;
                            return (
                                <div key={ep.endpoint} className="endpoint-item animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="endpoint-info">
                                        <code className="endpoint-path">{ep.endpoint}</code>
                                        <div className="endpoint-meta">
                                            <span>{ep.count.toLocaleString()} 次</span>
                                            <span>•</span>
                                            <span>平均 {ep.avgResponseTime}ms</span>
                                        </div>
                                    </div>
                                    <div className="endpoint-bar">
                                        <div className="endpoint-bar-fill" style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 每日請求 */}
                <div className="card daily-stats-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <BarChart3 size={18} />
                            近 7 日請求趨勢
                        </h3>
                    </div>
                    <div className="daily-chart">
                        {apiStats.requestsByDay.map((day, index) => {
                            const maxCount = Math.max(...apiStats.requestsByDay.map(d => d.count));
                            const successHeight = (day.success / maxCount) * 100;
                            const failedHeight = (day.failed / maxCount) * 100;
                            return (
                                <div key={day.date} className="day-bar-container animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="day-bar-wrapper">
                                        <div className="day-bar success" style={{ height: `${successHeight}%` }} />
                                        <div className="day-bar failed" style={{ height: `${failedHeight}%` }} />
                                    </div>
                                    <span className="day-label">{safeFormatDateSimple(day.date, DateFormats.SHORT_DATE)}</span>
                                    <span className="day-count">{day.count}</span>
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

            {/* 篩選器 */}
            <div className="usage-filters card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜尋端點或金鑰名稱..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="input select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'all' | 'success' | 'failed')}
                    >
                        <option value="all">所有狀態</option>
                        <option value="success">成功</option>
                        <option value="failed">失敗</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="input select"
                        value={keyFilter}
                        onChange={e => setKeyFilter(e.target.value)}
                    >
                        <option value="all">所有金鑰</option>
                        {apiKeys.map(key => (
                            <option key={key.id} value={key.id}>{key.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-stats">
                    <span>顯示 {filteredLogs.length} 筆</span>
                </div>

                <button
                    className={`btn btn-secondary refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="重新整理"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
                    重新整理
                </button>
            </div>

            {/* 紀錄表格 */}
            <div className="table-container card">
                {filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3 className="empty-state-title">沒有紀錄</h3>
                        <p className="empty-state-description">
                            {search || statusFilter !== 'all' || keyFilter !== 'all'
                                ? '嘗試調整篩選條件'
                                : '尚無 API 使用紀錄'}
                        </p>
                    </div>
                ) : (
                    <table className="table usage-table">
                        <thead>
                            <tr>
                                <th>時間</th>
                                <th>金鑰</th>
                                <th>端點</th>
                                <th>狀態</th>
                                <th>回應時間</th>
                                <th>IP</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => (
                                <tr key={log.id} className="animate-slide-up" style={{ animationDelay: `${index * 20}ms` }}>
                                    <td className="font-mono">
                                        {safeFormatDate(log.createdAt, DateFormats.SHORT_DATE_FULL_TIME)}
                                    </td>
                                    <td>
                                        <span className="key-name-cell">{log.apiKeyName}</span>
                                    </td>
                                    <td>
                                        <div className="endpoint-cell">
                                            <span className={`method-badge ${log.method.toLowerCase()}`}>
                                                {log.method}
                                            </span>
                                            <code>{log.endpoint}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-code-badge ${log.success ? 'success' : 'error'}`}>
                                            {log.statusCode}
                                        </span>
                                    </td>
                                    <td className="font-mono">
                                        {log.responseTime}ms
                                    </td>
                                    <td className="font-mono ip-cell">
                                        {log.ipAddress}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => setSelectedLog(log)}
                                            title="詳情"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 詳情 Modal */}
            {selectedLog && (
                <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
            )}

            {/* WebSocket 連線詳情 Modal */}
            {selectedWsConnection && (
                <WebSocketConnectionDetailModal connection={selectedWsConnection} onClose={() => setSelectedWsConnection(null)} />
            )}
        </div>
    );
}

function LogDetailModal({ log, onClose }: { log: ApiUsageLog; onClose: () => void }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal log-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>請求詳情</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-row">
                        <span className="detail-label">時間</span>
                        <span className="detail-value font-mono">
                            {safeFormatDate(log.createdAt, DateFormats.FULL)}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">API 金鑰</span>
                        <span className="detail-value">{log.apiKeyName}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">端點</span>
                        <div className="detail-value">
                            <span className={`method-badge ${log.method.toLowerCase()}`}>{log.method}</span>
                            <code>{log.endpoint}</code>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">狀態碼</span>
                        <span className={`status-code-badge ${log.success ? 'success' : 'error'}`}>
                            {log.statusCode}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">回應時間</span>
                        <span className="detail-value font-mono">{log.responseTime}ms</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">IP 位址</span>
                        <span className="detail-value font-mono">{log.ipAddress}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">User Agent</span>
                        <span className="detail-value font-mono text-sm">{log.userAgent}</span>
                    </div>

                    <div className="detail-section">
                        <span className="detail-label">請求內容</span>
                        {log.requestBody ? (
                            <pre className="code-block">
                                {JSON.stringify(log.requestBody, null, 2)}
                            </pre>
                        ) : (
                            <div className="empty-content">無請求內容</div>
                        )}
                    </div>

                    <div className="detail-section">
                        <span className="detail-label">回應內容</span>
                        {log.responseBody ? (
                            <pre className="code-block response-block">
                                {JSON.stringify(log.responseBody, null, 2)}
                            </pre>
                        ) : (
                            <div className="empty-content">無回應內容</div>
                        )}
                    </div>

                    {log.errorMessage && (
                        <div className="detail-section error-section">
                            <span className="detail-label">錯誤訊息</span>
                            <div className="error-message">
                                {log.errorMessage}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function WebSocketConnectionDetailModal({ connection, onClose }: { connection: WebSocketConnection; onClose: () => void }) {
    const duration = connection.disconnectedAt
        ? Math.floor((new Date(connection.disconnectedAt).getTime() - new Date(connection.connectedAt).getTime()) / 1000)
        : Math.floor((new Date().getTime() - new Date(connection.connectedAt).getTime()) / 1000);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal log-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>WebSocket 連線詳情</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-row">
                        <span className="detail-label">連線 ID</span>
                        <span className="detail-value font-mono">{connection.connectionId}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">IP 位址</span>
                        <span className="detail-value font-mono">{connection.ipAddress}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">狀態</span>
                        <span className={`status-badge ${connection.status === 'connected' ? 'success' :
                            connection.status === 'error' ? 'error' :
                                'default'
                            }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {connection.status === 'connected' && <Wifi size={14} />}
                            {connection.status === 'disconnected' && <WifiOff size={14} />}
                            {connection.status === 'error' && <AlertTriangle size={14} />}
                            {connection.status === 'connected' ? '已連線' : connection.status === 'error' ? '錯誤' : '已斷線'}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">連線時間</span>
                        <span className="detail-value font-mono">
                            {safeFormatDate(connection.connectedAt, DateFormats.FULL)}
                        </span>
                    </div>

                    {connection.disconnectedAt && (
                        <div className="detail-row">
                            <span className="detail-label">斷線時間</span>
                            <span className="detail-value font-mono">
                                {safeFormatDate(connection.disconnectedAt, DateFormats.FULL)}
                            </span>
                        </div>
                    )}

                    <div className="detail-row">
                        <span className="detail-label">連線時長</span>
                        <span className="detail-value font-mono">{formatDuration(duration)}</span>
                    </div>

                    {connection.lastPingAt && (
                        <div className="detail-row">
                            <span className="detail-label">最後 Ping</span>
                            <span className="detail-value font-mono">
                                {safeFormatDate(connection.lastPingAt, DateFormats.FULL)}
                            </span>
                        </div>
                    )}

                    <div className="detail-row">
                        <span className="detail-label">發送訊息數</span>
                        <span className="detail-value">
                            <Zap size={16} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-success)' }} />
                            {connection.messagesSent} 則
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">接收訊息數</span>
                        <span className="detail-value">
                            <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-info)' }} />
                            {connection.messagesReceived} 則
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">錯誤次數</span>
                        <span className="detail-value">
                            {connection.errorCount > 0 ? (
                                <span className="status-badge error">{connection.errorCount} 次</span>
                            ) : (
                                <span style={{ color: 'var(--color-success)' }}>無錯誤</span>
                            )}
                        </span>
                    </div>

                    {connection.userAgent && (
                        <div className="detail-row">
                            <span className="detail-label">User Agent</span>
                            <span className="detail-value font-mono text-sm">{connection.userAgent}</span>
                        </div>
                    )}

                    {connection.lastError && (
                        <div className="detail-section error-section">
                            <span className="detail-label">最後錯誤訊息</span>
                            <div className="error-message">
                                {connection.lastError}
                            </div>
                        </div>
                    )}

                    {connection.metadata && Object.keys(connection.metadata).length > 0 && (
                        <div className="detail-section">
                            <span className="detail-label">額外資訊</span>
                            <pre className="code-block">
                                {JSON.stringify(connection.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

