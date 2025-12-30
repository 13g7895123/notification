import { useState, useEffect } from 'react';
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

export function Logs() {
    const { logs, fetchStats } = useNotification();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);
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
            時間: format(new Date(log.sentAt), 'yyyy-MM-dd HH:mm:ss'),
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
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <History size={22} />
                        </div>
                        發送紀錄
                    </h1>
                    <p className="mt-1 text-text-muted">檢視所有通知的發送紀錄與結果</p>
                </div>
                <button
                    className="btn btn-secondary flex items-center gap-2"
                    onClick={handleExport}
                >
                    <Download size={18} />
                    匯出紀錄
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
                {[
                    { label: '總紀錄數', value: logs.length, icon: RefreshCw, color: 'primary' },
                    { label: '成功', value: successCount, icon: CheckCircle, color: 'success' },
                    { label: '失敗', value: failedCount, icon: XCircle, color: 'error' },
                    { label: '成功率', value: `${successRate}%`, icon: CheckCircle, color: 'accent' }
                ].map((item, i) => (
                    <div key={i} className="card flex items-center gap-md border border-border-color bg-bg-card p-md shadow-lg">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-color-${item.color}/20 text-color-${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-700 text-text-primary leading-tight">{item.value}</span>
                            <span className="text-[0.7rem] font-600 text-text-muted uppercase tracking-wider">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card flex flex-col gap-md lg:flex-row lg:items-center border border-border-color bg-bg-card p-md shadow-lg">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        className="input pl-12"
                        placeholder="搜尋紀錄標題或渠道..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-md">
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <Filter size={16} className="text-text-muted" />
                        <select
                            className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">所有狀態</option>
                            <option value="success">成功</option>
                            <option value="failed">失敗</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <select
                            className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none"
                            value={channelFilter}
                            onChange={e => setChannelFilter(e.target.value as any)}
                        >
                            <option value="all">所有渠道</option>
                            <option value="line">LINE</option>
                            <option value="telegram">Telegram</option>
                        </select>
                    </div>
                </div>
                <div className="text-[0.75rem] font-600 text-text-muted px-2">顯示 {filteredLogs.length} 筆</div>
            </div>

            {/* Table */}
            <div className="card h-full min-h-[400px] border border-border-color bg-bg-card p-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="py-20 text-center opacity-50">
                            <span className="text-4xl block mb-2">📋</span>
                            <p>沒有符合條件的紀錄</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-color bg-bg-tertiary/20">
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider">時間</th>
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider">渠道</th>
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider">標題</th>
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider">狀態</th>
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider text-right">回應時間</th>
                                    <th className="px-lg py-md text-[0.75rem] font-700 text-text-muted uppercase tracking-wider">錯誤訊息</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color-light/50">
                                {filteredLogs.map((log, idx) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-bg-tertiary/10 transition-colors animate-slide-up"
                                        style={{ animationDelay: `${idx * 15}ms` }}
                                    >
                                        <td className="px-lg py-md whitespace-nowrap font-mono text-xs text-text-secondary">
                                            {format(new Date(log.sentAt), 'MM/dd HH:mm:ss', { locale: zhTW })}
                                        </td>
                                        <td className="px-lg py-md">
                                            <div className="flex items-center gap-3">
                                                <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-900 ${log.channelType === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>
                                                    {log.channelType.toUpperCase()}
                                                </span>
                                                <span className="text-sm font-600 text-text-primary truncate max-w-[120px]">{log.channelName}</span>
                                            </div>
                                        </td>
                                        <td className="px-lg py-md min-w-[200px]">
                                            <span className="text-sm text-text-secondary">{log.title}</span>
                                        </td>
                                        <td className="px-lg py-md whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-700 ${log.status === 'success' ? 'bg-success/20 text-color-success-light' : 'bg-error/20 text-color-error-light'}`}>
                                                {log.status === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {log.status === 'success' ? '成功' : '失敗'}
                                            </span>
                                        </td>
                                        <td className="px-lg py-md text-right font-mono text-xs text-text-muted whitespace-nowrap">
                                            {log.responseTime ? `${log.responseTime}ms` : '-'}
                                        </td>
                                        <td className="px-lg py-md max-w-xs">
                                            {log.error ? (
                                                <p className="truncate text-xs text-color-error/70" title={log.error}>
                                                    {log.error}
                                                </p>
                                            ) : (
                                                <span className="text-text-muted/30">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
