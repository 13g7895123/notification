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
        enableScheduler,
        disableScheduler,
        runSchedulerNow,
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

    const handleEnable = async () => {
        setIsProcessing(true);
        try {
            const success = await enableScheduler();
            if (success) {
                toast.success('排程器已啟用');
                await fetchSchedulerData();
            } else {
                toast.error('排程器啟用失敗');
            }
        } catch (err) {
            console.error('Enable scheduler error', err);
            toast.error('啟用過程中發生錯誤');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDisable = async () => {
        const confirmed = await confirm.danger(
            '停用後，所有排程訊息將暫停發送。確定要停用嗎？',
            '確定要停用排程器嗎？'
        );

        if (!confirmed) return;

        setIsProcessing(true);
        try {
            const success = await disableScheduler();
            if (success) {
                toast.success('排程器已停用');
                await fetchSchedulerData();
            } else {
                toast.error('排程器停用失敗');
            }
        } catch (err) {
            console.error('Disable scheduler error', err);
            toast.error('停用過程中發生錯誤');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRunNow = async () => {
        setIsProcessing(true);
        try {
            const success = await runSchedulerNow();
            if (success) {
                toast.success('排程任務已觸發，請稍後查看日誌');
                setTimeout(fetchSchedulerData, 3000);
            } else {
                toast.error('任務觸發失敗');
            }
        } catch (err) {
            console.error('Run now error', err);
            toast.error('觸發過程中發生錯誤');
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
                toast.success('設定已保存成功！修改將在下次任務執行時生效。');
                await fetchSchedulerData();
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
                                    <span className="status-text">
                                        {status?.enabled ? (status?.status === 'running' ? '運行中' : '已啟用') : '已停用'}
                                    </span>
                                    <span className={`scheduler-status-indicator ${status?.enabled ? 'online' : 'offline'}`}></span>
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
                                onClick={handleEnable}
                                disabled={status?.enabled || isProcessing}
                            >
                                <Play size={18} />
                                啟用排程
                            </button>
                            <button
                                className="control-btn stop"
                                onClick={handleDisable}
                                disabled={!status?.enabled || isProcessing}
                            >
                                <Square size={18} />
                                停用排程
                            </button>
                            <button
                                className="control-btn trigger"
                                onClick={handleRunNow}
                                disabled={!status?.enabled || isProcessing}
                            >
                                <RefreshCw size={18} className={isProcessing ? 'animate-spin' : ''} />
                                立即執行
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
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, heartbeatInterval: Number(e.target.value) } : null)}
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
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, taskCheckInterval: Number(e.target.value) } : null)}
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
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, heartbeatTimeout: Number(e.target.value) } : null)}
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
