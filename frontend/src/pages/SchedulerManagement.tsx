import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Terminal,
    RefreshCw,
    Server,
    Cpu,
    Play,
    Square,
    RotateCw
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import type { SchedulerStatus, SchedulerLog } from '../types';
import { toast, confirm } from '../utils/alert';
import './SchedulerManagement.css';

export function SchedulerManagement() {
    const {
        fetchSchedulerStatus,
        fetchSchedulerLogs,
        startScheduler,
        stopScheduler,
        restartScheduler
    } = useNotification();
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [logs, setLogs] = useState<SchedulerLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
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

    const handleStart = async () => {
        setIsProcessing(true);
        try {
            const success = await startScheduler();
            if (success) {
                toast.success('排程器已啟動');
                await fetchSchedulerData();
            } else {
                toast.error('排程器啟動失敗');
            }
        } catch (err) {
            console.error('Start scheduler error', err);
            toast.error('啟動過程中發生錯誤');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStop = async () => {
        const confirmed = await confirm.danger(
            '停止後，所有排程訊息將暫停發送，直到重新啟動排程器。確定要停止嗎？',
            '確定要停止排程器嗎？'
        );

        if (!confirmed) return;

        setIsProcessing(true);
        try {
            const success = await stopScheduler();
            if (success) {
                toast.success('排程器已停止');
                await fetchSchedulerData();
            } else {
                toast.error('排程器停止失敗');
            }
        } catch (err) {
            console.error('Stop scheduler error', err);
            toast.error('停止過程中發生錯誤');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestart = async () => {
        const confirmed = await confirm.action(
            '重啟排程器會短暫中斷服務。確定要繼續嗎？',
            '重啟排程器',
            '確定重啟'
        );

        if (!confirmed) return;

        setIsProcessing(true);
        try {
            const success = await restartScheduler();
            if (success) {
                toast.success('排程器已重啟');
                // 延遲一點點再抓資料，讓後端有時間啟動
                setTimeout(fetchSchedulerData, 2000);
            } else {
                toast.error('排程器重啟失敗');
            }
        } catch (err) {
            console.error('Restart scheduler error', err);
            toast.error('重啟過程中發生錯誤');
        } finally {
            setIsProcessing(false);
        }
    };

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

                    {/* 排程器控制面板 */}
                    <div className="control-section card">
                        <div className="section-header">
                            <h3 className="section-title">
                                <RotateCw size={18} />
                                排程器控制
                            </h3>
                        </div>
                        <div className="control-buttons">
                            <button
                                className="control-btn start"
                                onClick={handleStart}
                                disabled={status?.status === 'running' || isProcessing}
                            >
                                <Play size={18} />
                                啟動排程
                            </button>
                            <button
                                className="control-btn stop"
                                onClick={handleStop}
                                disabled={status?.status !== 'running' || isProcessing}
                            >
                                <Square size={18} />
                                停止排程
                            </button>
                            <button
                                className="control-btn restart"
                                onClick={handleRestart}
                                disabled={isProcessing}
                            >
                                <RotateCw size={18} className={isProcessing ? 'animate-spin' : ''} />
                                重啟排程
                            </button>
                        </div>
                        <div className="control-warning">
                            <AlertCircle size={14} />
                            <span>⚠️ 停止排程器將暫停所有自動派發的排程訊息通知。</span>
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
