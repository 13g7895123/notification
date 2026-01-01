import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Terminal,
    RefreshCw,
    Server,
    Cpu
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import type { SchedulerStatus, SchedulerLog } from '../types';
import './SchedulerManagement.css';

export function SchedulerManagement() {
    const { fetchSchedulerStatus, fetchSchedulerLogs } = useNotification();
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [logs, setLogs] = useState<SchedulerLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSchedulerData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [statusData, logsData] = await Promise.all([
                fetchSchedulerStatus(),
                fetchSchedulerLogs(50)
            ]);

            setStatus(statusData);
            setLogs(logsData);
        } catch (err) {
            console.error('Failed to fetch scheduler data', err);
            setError('無法載入排程器數據');
        } finally {
            setIsLoading(false);
        }
    }, [fetchSchedulerStatus, fetchSchedulerLogs]);

    useEffect(() => {
        fetchSchedulerData();
        const interval = setInterval(fetchSchedulerData, 30000);
        return () => clearInterval(interval);
    }, [fetchSchedulerData]);

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
                    {error && (
                        <div className="error-message card">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="status-cards">
                        <div className="status-card card">
                            <div className="status-card-icon running">
                                <Server size={24} />
                            </div>
                            <div className="status-card-info">
                                <span className="status-card-label">排程器狀態</span>
                                <span className="status-card-value">
                                    <span className="status-text">{status?.status === 'running' ? '運行中' : '已停止'}</span>
                                    <span className="scheduler-status-indicator online"></span>
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
                                    {status ? safeFormatDate(status.lastRun, DateFormats.TIME) : '--:--'}
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
                                    {status ? safeFormatDate(status.nextRun, DateFormats.TIME) : '--:--'}
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
