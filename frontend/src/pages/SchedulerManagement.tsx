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
    RotateCw,
    Settings
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import type { SchedulerStatus, SchedulerLog, SchedulerSettings } from '../types';
import { toast, confirm } from '../utils/alert';
import './SchedulerManagement.css';

export function SchedulerManagement() {
    const {
        fetchSchedulerStatus,
        fetchSchedulerLogs,
        startScheduler,
        stopScheduler,
        restartScheduler,
        fetchSchedulerSettings,
        updateSchedulerSettings
    } = useNotification();
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [logs, setLogs] = useState<SchedulerLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<number>(10); // 預設 10 秒
    const [settings, setSettings] = useState<SchedulerSettings | null>(null);
    const [isEditingSettings, setIsEditingSettings] = useState(false);

    const fetchSchedulerData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [statusData, logsData, settingsData] = await Promise.all([
                fetchSchedulerStatus(),
                fetchSchedulerLogs(50),
                fetchSchedulerSettings()
            ]);

            setStatus(statusData);
            setLogs(logsData);
            setSettings(settingsData);
        } catch (err) {
            console.error('Failed to fetch scheduler data', err);
            setError('無法載入排程器數據');
        } finally {
            setIsLoading(false);
        }
    }, [fetchSchedulerStatus, fetchSchedulerLogs, fetchSchedulerSettings]);

    useEffect(() => {
        fetchSchedulerData();
        const interval = setInterval(fetchSchedulerData, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetchSchedulerData, refreshInterval]);

    const handleStart = async () => {
        setIsProcessing(true);
        try {
            const success = await startScheduler();
            if (success) {
                toast.success('排程器已啟動');
                // 延遲 2 秒讓排程器完全啟動
                setTimeout(async () => {
                    await fetchSchedulerData();
                }, 2000);
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
                // 立即刷新，然後再等 2 秒刷新一次確保狀態更新
                await fetchSchedulerData();
                setTimeout(fetchSchedulerData, 2000);
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

    const handleSaveSettings = async () => {
        if (!settings) return;

        setIsProcessing(true);
        try {
            const success = await updateSchedulerSettings(settings);
            if (success) {
                setIsEditingSettings(false);
                
                // 詢問是否立即重啟排程器
                const shouldRestart = await confirm.action(
                    '設定已保存成功！需要重啟排程器才會生效。\n\n是否立即重啟排程器？',
                    '重啟排程器',
                    '立即重啟'
                );

                if (shouldRestart) {
                    const restartSuccess = await restartScheduler();
                    if (restartSuccess) {
                        toast.success('排程器已重啟，新設定已生效');
                        // 延遲 3 秒後刷新狀態
                        setTimeout(fetchSchedulerData, 3000);
                    } else {
                        toast.error('排程器重啟失敗，請手動重啟');
                    }
                } else {
                    toast.success('設定已保存，請記得重啟排程器以套用新設定');
                }
            } else {
                toast.error('設定保存失敗');
            }
        } catch (err) {
            console.error('Save settings error', err);
            toast.error('保存過程中發生錯誤');
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
                    <div className="refresh-control">
                        <label htmlFor="refresh-interval" className="refresh-label">
                            <Clock size={16} />
                            更新頻率：
                        </label>
                        <select
                            id="refresh-interval"
                            className="refresh-select"
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        >
                            <option value={5}>5 秒</option>
                            <option value={10}>10 秒</option>
                            <option value={15}>15 秒</option>
                            <option value={30}>30 秒</option>
                            <option value={60}>60 秒</option>
                        </select>
                    </div>
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

                    {/* 排程器設定 */}
                    <div className="settings-section card">
                        <div className="section-header">
                            <h3 className="section-title">
                                <Settings size={18} />
                                排程器設定
                            </h3>
                            {!isEditingSettings ? (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setIsEditingSettings(true)}
                                >
                                    編輯設定
                                </button>
                            ) : (
                                <div className="settings-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            setIsEditingSettings(false);
                                            fetchSchedulerData();
                                        }}
                                    >
                                        取消
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSaveSettings}
                                        disabled={isProcessing}
                                    >
                                        保存設定
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="settings-form">
                            <div className="setting-item">
                                <label className="setting-label">
                                    <Clock size={16} />
                                    心跳更新間隔
                                </label>
                                <div className="setting-input-group">
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={settings?.heartbeatInterval ?? 10}
                                        onChange={(e) => setSettings(prev => prev ? {...prev, heartbeatInterval: Number(e.target.value)} : null)}
                                        disabled={!isEditingSettings}
                                        min={5}
                                        max={60}
                                    />
                                    <span className="setting-unit">秒</span>
                                </div>
                                <p className="setting-description">
                                    排程器更新心跳檔案的頻率（建議 5-15 秒）
                                </p>
                            </div>

                            <div className="setting-item">
                                <label className="setting-label">
                                    <RefreshCw size={16} />
                                    任務檢查間隔
                                </label>
                                <div className="setting-input-group">
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={settings?.taskCheckInterval ?? 60}
                                        onChange={(e) => setSettings(prev => prev ? {...prev, taskCheckInterval: Number(e.target.value)} : null)}
                                        disabled={!isEditingSettings}
                                        min={10}
                                        max={600}
                                    />
                                    <span className="setting-unit">秒</span>
                                </div>
                                <p className="setting-description">
                                    檢查並執行排程訊息的頻率（建議 30-120 秒）
                                </p>
                            </div>

                            <div className="setting-item">
                                <label className="setting-label">
                                    <AlertCircle size={16} />
                                    心跳超時時間
                                </label>
                                <div className="setting-input-group">
                                    <input
                                        type="number"
                                        className="setting-input"
                                        value={settings?.heartbeatTimeout ?? 150}
                                        onChange={(e) => setSettings(prev => prev ? {...prev, heartbeatTimeout: Number(e.target.value)} : null)}
                                        disabled={!isEditingSettings}
                                        min={30}
                                        max={300}
                                    />
                                    <span className="setting-unit">秒</span>
                                </div>
                                <p className="setting-description">
                                    超過此時間未更新心跳視為已停止（建議 ≥ 心跳間隔 × 10）
                                </p>
                            </div>

                            <div className="setting-note">
                                <AlertCircle size={14} />
                                <span>💡 修改設定後需要重啟排程器才會生效</span>
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
                                    <span className="log-time">[{safeFormatDate(log.timestamp, DateFormats.DATETIME)}]</span>
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
