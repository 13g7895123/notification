import { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, Play, Square, RefreshCw, Info } from 'lucide-react';
import { api } from '../utils/api';

interface WebSocketServiceStatus {
    service_running: boolean;
    websocket_port: string;
    internal_port: string;
    websocket_port_listening: boolean;
    internal_port_listening: boolean;
    pid: number | null;
    process_info: {
        pid: number;
        cpu: string;
        mem: string;
        start_time: string;
        command: string;
    } | null;
    active_connections: number;
    total_connections: number;
    server_time: string;
    last_connection_at?: string;
    health: {
        status: 'healthy' | 'unhealthy';
        checks: Array<{
            name: string;
            status: 'ok' | 'error' | 'warning';
            message: string;
        }>;
    };
}

export function WebSocketServiceMonitor() {
    const [status, setStatus] = useState<WebSocketServiceStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const fetchStatus = async () => {
        try {
            setError(null);
            const data = await api.get<WebSocketServiceStatus>('/system/websocket/status');
            setStatus(data);
        } catch (err: any) {
            setError(err.message || '無法獲取 WebSocket 服務狀態');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!confirm('確定要啟動 WebSocket 服務嗎？')) return;
        
        setActionLoading(true);
        try {
            await api.post('/system/websocket/start');
            await fetchStatus();
            alert('WebSocket 服務已啟動');
        } catch (err: any) {
            alert(err.message || '啟動失敗');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStop = async () => {
        if (!confirm('確定要停止 WebSocket 服務嗎？這將中斷所有現有連線。')) return;
        
        setActionLoading(true);
        try {
            await api.post('/system/websocket/stop');
            await fetchStatus();
            alert('WebSocket 服務已停止');
        } catch (err: any) {
            alert(err.message || '停止失敗');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestart = async () => {
        if (!confirm('確定要重啟 WebSocket 服務嗎？')) return;
        
        setActionLoading(true);
        try {
            await api.post('/system/websocket/restart');
            await fetchStatus();
            alert('WebSocket 服務已重啟');
        } catch (err: any) {
            alert(err.message || '重啟失敗');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // 每 10 秒自動刷新
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="service-monitor-card">
                <div className="card-header">
                    <h3><Activity className="icon" /> WebSocket 服務監控</h3>
                </div>
                <div className="card-body text-center">
                    <div className="loader"></div>
                    <p>正在載入服務狀態...</p>
                </div>
            </div>
        );
    }

    if (error || !status) {
        return (
            <div className="service-monitor-card">
                <div className="card-header">
                    <h3><Activity className="icon" /> WebSocket 服務監控</h3>
                </div>
                <div className="card-body">
                    <div className="error-message">
                        <AlertTriangle className="icon" />
                        <p>{error || '無法載入服務狀態'}</p>
                        <button onClick={fetchStatus} className="btn-sm btn-primary">
                            重試
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isHealthy = status.health.status === 'healthy';

    return (
        <div className="service-monitor-card">
            {/* 標題和操作按鈕 */}
            <div className="card-header">
                <h3>
                    <Activity className="icon" /> 
                    WebSocket 服務監控
                </h3>
                <div className="header-actions">
                    <button 
                        onClick={fetchStatus} 
                        className="btn-icon"
                        disabled={actionLoading}
                        title="刷新狀態"
                    >
                        <RefreshCw className={actionLoading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            <div className="card-body">
                {/* 整體狀態指示器 */}
                <div className={`service-status ${isHealthy ? 'healthy' : 'unhealthy'}`}>
                    {isHealthy ? (
                        <Wifi className="status-icon" />
                    ) : (
                        <WifiOff className="status-icon" />
                    )}
                    <div className="status-info">
                        <h4>{isHealthy ? '服務正常運行' : '服務異常'}</h4>
                        <p className="status-subtitle">
                            {status.service_running ? '已啟動' : '未啟動'} | 
                            {status.active_connections} 活躍連線 / {status.total_connections} 總連線
                        </p>
                    </div>
                </div>

                {/* 健康檢查項目 */}
                <div className="health-checks">
                    {status.health.checks.map((check, index) => (
                        <div key={index} className={`health-check-item ${check.status}`}>
                            <div className="check-status">
                                {check.status === 'ok' && <div className="status-dot success"></div>}
                                {check.status === 'error' && <div className="status-dot error"></div>}
                                {check.status === 'warning' && <div className="status-dot warning"></div>}
                            </div>
                            <div className="check-content">
                                <strong>{check.name}</strong>
                                <span className="check-message">{check.message}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 快速統計 */}
                <div className="quick-stats">
                    <div className="stat-item">
                        <span className="stat-label">WebSocket 端口</span>
                        <span className="stat-value">{status.websocket_port}</span>
                        <span className={`stat-badge ${status.websocket_port_listening ? 'success' : 'error'}`}>
                            {status.websocket_port_listening ? '監聽中' : '未監聽'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">內部推送端口</span>
                        <span className="stat-value">{status.internal_port}</span>
                        <span className={`stat-badge ${status.internal_port_listening ? 'success' : 'error'}`}>
                            {status.internal_port_listening ? '監聽中' : '未監聽'}
                        </span>
                    </div>
                    {status.pid && (
                        <div className="stat-item">
                            <span className="stat-label">進程 ID</span>
                            <span className="stat-value">{status.pid}</span>
                        </div>
                    )}
                </div>

                {/* 詳細信息（可折疊） */}
                {status.process_info && (
                    <div className="details-section">
                        <button 
                            className="details-toggle"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            <Info className="icon" />
                            {showDetails ? '隱藏' : '顯示'}詳細信息
                        </button>
                        
                        {showDetails && (
                            <div className="process-details">
                                <div className="detail-row">
                                    <span className="detail-label">CPU 使用率：</span>
                                    <span className="detail-value">{status.process_info.cpu}%</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">記憶體使用率：</span>
                                    <span className="detail-value">{status.process_info.mem}%</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">啟動時間：</span>
                                    <span className="detail-value">{status.process_info.start_time}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">命令：</span>
                                    <span className="detail-value command">{status.process_info.command}</span>
                                </div>
                                {status.last_connection_at && (
                                    <div className="detail-row">
                                        <span className="detail-label">最後連線：</span>
                                        <span className="detail-value">{status.last_connection_at}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 控制按鈕 */}
                <div className="service-controls">
                    {!status.service_running ? (
                        <button 
                            onClick={handleStart}
                            disabled={actionLoading}
                            className="btn btn-success"
                        >
                            <Play className="icon" />
                            啟動服務
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleRestart}
                                disabled={actionLoading}
                                className="btn btn-warning"
                            >
                                <RefreshCw className="icon" />
                                重啟服務
                            </button>
                            <button 
                                onClick={handleStop}
                                disabled={actionLoading}
                                className="btn btn-danger"
                            >
                                <Square className="icon" />
                                停止服務
                            </button>
                        </>
                    )}
                </div>

                {/* 最後更新時間 */}
                <div className="last-update">
                    最後更新：{status.server_time}
                </div>
            </div>

            <style>{`
                .service-monitor-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 24px;
                }

                .card-header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .card-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon {
                    background: transparent;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: #f3f4f6;
                }

                .btn-icon:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .card-body {
                    padding: 20px;
                }

                .service-status {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .service-status.healthy {
                    background: #ecfdf5;
                    border: 1px solid #10b981;
                }

                .service-status.unhealthy {
                    background: #fef2f2;
                    border: 1px solid #ef4444;
                }

                .status-icon {
                    width: 48px;
                    height: 48px;
                }

                .service-status.healthy .status-icon {
                    color: #10b981;
                }

                .service-status.unhealthy .status-icon {
                    color: #ef4444;
                }

                .status-info h4 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .status-subtitle {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .health-checks {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .health-check-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border-left: 3px solid transparent;
                }

                .health-check-item.ok {
                    border-left-color: #10b981;
                }

                .health-check-item.error {
                    border-left-color: #ef4444;
                    background: #fef2f2;
                }

                .health-check-item.warning {
                    border-left-color: #f59e0b;
                    background: #fffbeb;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-top: 3px;
                }

                .status-dot.success {
                    background: #10b981;
                }

                .status-dot.error {
                    background: #ef4444;
                }

                .status-dot.warning {
                    background: #f59e0b;
                }

                .check-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .check-content strong {
                    font-size: 14px;
                    font-weight: 600;
                }

                .check-message {
                    font-size: 13px;
                    color: #6b7280;
                }

                .quick-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-item {
                    padding: 16px;
                    background: #f9fafb;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-label {
                    font-size: 13px;
                    color: #6b7280;
                }

                .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                }

                .stat-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-top: 4px;
                    width: fit-content;
                }

                .stat-badge.success {
                    background: #d1fae5;
                    color: #065f46;
                }

                .stat-badge.error {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .details-section {
                    margin-bottom: 24px;
                }

                .details-toggle {
                    background: transparent;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    transition: all 0.2s;
                    width: 100%;
                    justify-content: center;
                }

                .details-toggle:hover {
                    background: #f3f4f6;
                }

                .process-details {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .detail-row {
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .detail-row:last-child {
                    border-bottom: none;
                }

                .detail-label {
                    font-weight: 500;
                    color: #6b7280;
                    min-width: 140px;
                }

                .detail-value {
                    color: #111827;
                    flex: 1;
                }

                .detail-value.command {
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }

                .service-controls {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-success {
                    background: #10b981;
                    color: white;
                }

                .btn-success:hover:not(:disabled) {
                    background: #059669;
                }

                .btn-warning {
                    background: #f59e0b;
                    color: white;
                }

                .btn-warning:hover:not(:disabled) {
                    background: #d97706;
                }

                .btn-danger {
                    background: #ef4444;
                    color: white;
                }

                .btn-danger:hover:not(:disabled) {
                    background: #dc2626;
                }

                .last-update {
                    text-align: center;
                    font-size: 13px;
                    color: #9ca3af;
                }

                .error-message {
                    text-align: center;
                    padding: 40px 20px;
                }

                .error-message .icon {
                    width: 48px;
                    height: 48px;
                    color: #ef4444;
                    margin: 0 auto 16px;
                }

                .error-message p {
                    color: #6b7280;
                    margin-bottom: 16px;
                }

                .loader {
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid #3b82f6;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                .text-center {
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
