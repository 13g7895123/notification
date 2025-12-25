import { useState } from 'react';
import {
    History,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Download,
    RefreshCw
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import './Logs.css';

export function Logs() {
    const { logs } = useNotification();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [channelFilter, setChannelFilter] = useState<'all' | 'line' | 'telegram'>('all');

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase()) ||
            log.channelName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        const matchesChannel = channelFilter === 'all' || log.channelType === channelFilter;
        return matchesSearch && matchesStatus && matchesChannel;
    });

    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : 0;

    const handleExport = () => {
        const data = filteredLogs.map(log => ({
            時間: format(log.sentAt, 'yyyy-MM-dd HH:mm:ss'),
            渠道類型: log.channelType.toUpperCase(),
            渠道名稱: log.channelName,
            標題: log.title,
            狀態: log.status === 'success' ? '成功' : '失敗',
            回應時間: log.responseTime ? `${log.responseTime}ms` : '-',
            錯誤訊息: log.error || '-'
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notification-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="logs-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <History size={22} />
                        </div>
                        發送紀錄
                    </h1>
                    <p className="page-description">
                        檢視所有通知的發送紀錄與結果
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={18} />
                        匯出紀錄
                    </button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="logs-stats">
                <div className="stat-mini-card">
                    <div className="stat-mini-icon total">
                        <RefreshCw size={18} />
                    </div>
                    <div className="stat-mini-content">
                        <span className="stat-mini-value">{logs.length}</span>
                        <span className="stat-mini-label">總紀錄數</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-mini-icon success">
                        <CheckCircle size={18} />
                    </div>
                    <div className="stat-mini-content">
                        <span className="stat-mini-value">{successCount}</span>
                        <span className="stat-mini-label">成功</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-mini-icon failed">
                        <XCircle size={18} />
                    </div>
                    <div className="stat-mini-content">
                        <span className="stat-mini-value">{failedCount}</span>
                        <span className="stat-mini-label">失敗</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-mini-icon rate">
                        <CheckCircle size={18} />
                    </div>
                    <div className="stat-mini-content">
                        <span className="stat-mini-value">{successRate}%</span>
                        <span className="stat-mini-label">成功率</span>
                    </div>
                </div>
            </div>

            {/* 篩選 */}
            <div className="logs-filters card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜尋紀錄..."
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
                        value={channelFilter}
                        onChange={e => setChannelFilter(e.target.value as 'all' | 'line' | 'telegram')}
                    >
                        <option value="all">所有渠道</option>
                        <option value="line">LINE</option>
                        <option value="telegram">Telegram</option>
                    </select>
                </div>

                <div className="filter-stats">
                    <span>顯示 {filteredLogs.length} 筆</span>
                </div>
            </div>

            {/* 紀錄表格 */}
            <div className="table-container card">
                {filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 className="empty-state-title">沒有紀錄</h3>
                        <p className="empty-state-description">
                            {search || statusFilter !== 'all' || channelFilter !== 'all'
                                ? '嘗試調整篩選條件'
                                : '尚無發送紀錄'}
                        </p>
                    </div>
                ) : (
                    <table className="table logs-table">
                        <thead>
                            <tr>
                                <th>時間</th>
                                <th>渠道</th>
                                <th>標題</th>
                                <th>狀態</th>
                                <th>回應時間</th>
                                <th>錯誤訊息</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => (
                                <tr
                                    key={log.id}
                                    className="animate-slide-up"
                                    style={{ animationDelay: `${index * 20}ms` }}
                                >
                                    <td className="font-mono">
                                        {format(log.sentAt, 'MM/dd HH:mm:ss', { locale: zhTW })}
                                    </td>
                                    <td>
                                        <div className="channel-cell">
                                            <span className={`channel-type-tag ${log.channelType}`}>
                                                {log.channelType.toUpperCase()}
                                            </span>
                                            <span className="channel-name-text">{log.channelName}</span>
                                        </div>
                                    </td>
                                    <td className="title-cell">
                                        <span className="log-title-text">{log.title}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${log.status}`}>
                                            {log.status === 'success' ? (
                                                <><CheckCircle size={14} /> 成功</>
                                            ) : (
                                                <><XCircle size={14} /> 失敗</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="font-mono response-time">
                                        {log.responseTime ? `${log.responseTime}ms` : '-'}
                                    </td>
                                    <td className="error-cell">
                                        {log.error ? (
                                            <span className="error-text" title={log.error}>
                                                {log.error}
                                            </span>
                                        ) : (
                                            <span className="no-error">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
