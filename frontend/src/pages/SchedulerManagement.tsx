import { useState, useEffect } from 'react';
import {
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Terminal,
    RefreshCw,
    Server,
    Database,
    Cpu
} from 'lucide-react';
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import './SchedulerManagement.css';

interface SchedulerCheck {
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
}

interface SchedulerLog {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    context?: any;
}

interface SchedulerStatus {
    status: 'running' | 'stopped' | 'error';
    lastRun: string;
    nextRun: string;
    daemonStatus: string;
    checks: SchedulerCheck[];
}

export function SchedulerManagement() {
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [logs, setLogs] = useState<SchedulerLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSchedulerData = async () => {
        setIsLoading(true);
        try {
            // Mocking API call
            // In real implementation, this would be:
            // const statusRes = await fetch('/api/scheduler/status');
            // const logsRes = await fetch('/api/scheduler/logs');
            
            setTimeout(() => {
                setStatus({
                    status: 'running',
                    lastRun: new Date().toISOString(),
                    nextRun: new Date(Date.now() + 60000).toISOString(),
                    daemonStatus: 'active',
                    checks: [
                        { name: '資料庫連線', status: 'ok', message: '已連線' },
                        { name: '隊列工作者 (Queue Worker)', status: 'ok', message: '3 個工作者運行中' },
                        { name: '排程任務 (Cron Job)', status: 'ok', message: '上次執行於 1 分鐘前' },
                        { name: 'Redis 快取', status: 'ok', message: '已連線' }
                    ]
                });

                setLogs([
                    { timestamp: new Date().toISOString(), level: 'info', message: '開始執行排程任務: ProcessScheduledMessages' },
                    { timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: '成功處理 3 則排程訊息' },
                    { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: '開始執行排程任務: CheckSchedulerStatus' },
                    { timestamp: new Date(Date.now() - 65000).toISOString(), level: 'info', message: '排程器健康檢查完成' },
                    { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warning', message: '隊列工作者回應較慢 (250ms)' }
                ]);
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to fetch scheduler data', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedulerData();
        const interval = setInterval(fetchSchedulerData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="scheduler-page">
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Activity size={22} />
                        </div>
                        排程器管理
                    </h1>
                    <p className="page-description">
                        監控伺服器排程器狀態、執行日誌與系統健康檢查
                    </p>
                </div>
                <div className="page-actions">
                    <button 
                        className={`btn btn-secondary ${isLoading ? 'loading' : ''}`} 
                        onClick={fetchSchedulerData}
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        重新整理
                    </button>
                </div>
            </div>

            <div className="scheduler-grid">
                {/* 狀態概覽 */}
                <div className="scheduler-main">
                    <div className="status-cards">
                        <div className="status-card card">
                            <div className="status-card-icon running">
                                <Server size={24} />
                            </div>
                            <div className="status-card-info">
                                <span className="status-card-label">排程器狀態</span>
                                <span className="status-card-value">
                                    {status?.status === 'running' ? '運行中' : '已停止'}
                                    <span className="status-indicator online"></span>
                                </span>
                            </div>
                        </div>
                        <div className="status-card card">
                            <div className="status-card-icon last-run">
                                <Clock size={24} />
                            </div>
                            <div className="status-card-info">
                                <span className="status-card-label">上次執行</span>
                                <span className="status-card-value">
                                    {status ? safeFormatDate(status.lastRun, DateFormats.TIME_ONLY) : '--:--'}
                                </span>
                            </div>
                        </div>
                        <div className="status-card card">
                            <div className="status-card-icon next-run">
                                <RefreshCw size={24} />
                            </div>
                            <div className="status-card-info">
                                <span className="status-card-label">下次執行</span>
                                <span className="status-card-value">
                                    {status ? safeFormatDate(status.nextRun, DateFormats.TIME_ONLY) : '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 詳細檢測 */}
                    <div className="checks-section card">
                        <div className="section-header">
                            <h3 className="section-title">
                                <Cpu size={18} />
                                系統詳細檢測
                            </h3>
                        </div>
                        <div className="checks-list">
                            {status?.checks.map((check, index) => (
                                <div key={index} className="check-item">
                                    <div className={`check-status-icon ${check.status}`}>
                                        {check.status === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div className="check-info">
                                        <span className="check-name">{check.name}</span>
                                        <span className="check-message">{check.message}</span>
                                    </div>
                                    <div className={`check-badge ${check.status}`}>
                                        {check.status.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 執行日誌 */}
                <div className="scheduler-logs card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <Terminal size={18} />
                            執行日誌 (Recent Logs)
                        </h3>
                    </div>
                    <div className="logs-console">
                        {logs.length === 0 ? (
                            <div className="logs-empty">尚無日誌紀錄</div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className={`log-line ${log.level}`}>
                                    <span className="log-time">[{safeFormatDate(log.timestamp, 'HH:mm:ss')}]</span>
                                    <span className="log-level">{log.level.toUpperCase()}</span>
                                    <span className="log-message">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
