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
    Copy,
    Check,
    RefreshCw,
    Eye,
    X,
    Globe,
    Monitor,
    AlertCircle,
    Terminal
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { ApiUsageLog } from '../types';
import { format } from 'date-fns';
import { toast } from '../utils/alert';
import { useEscapeKey } from '../hooks/useEscapeKey';

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <RefreshCw className={className} size={size} />;
}

export function ApiUsage() {
    const { apiUsageLogs, apiStats, apiKeys, fetchApiUsage, isLoading } = useNotification();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [keyFilter, setKeyFilter] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<ApiUsageLog | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchApiUsage();
    }, [fetchApiUsage]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchApiUsage();
        setTimeout(() => setIsRefreshing(false), 500);
    }, [fetchApiUsage]);

    if (isLoading || !apiStats) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-md">
                <Loader2 className="h-10 w-10 animate-spin text-color-primary" />
                <p className="text-text-muted animate-pulse">正在載入 API 使用紀錄...</p>
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
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <Activity size={22} />
                        </div>
                        API 使用紀錄
                    </h1>
                    <p className="mt-1 text-text-muted">監控 API 請求與使用情況</p>
                </div>
                <button
                    className={`btn btn-secondary flex items-center gap-2 ${isRefreshing ? 'opacity-50' : ''}`}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    重新整理
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
                {[
                    { label: '總請求數', value: apiStats.totalRequests.toLocaleString(), icon: BarChart3, color: 'primary' },
                    { label: '成功請求', value: apiStats.successfulRequests.toLocaleString(), icon: CheckCircle, color: 'success' },
                    { label: '失敗請求', value: apiStats.failedRequests, icon: XCircle, color: 'error' },
                    { label: '平均延遲', value: `${apiStats.avgResponseTime}ms`, icon: Clock, color: 'accent' }
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
                {/* Endpoint Breakdown */}
                <div className="card flex flex-col border border-border-color bg-bg-card shadow-lg p-0">
                    <div className="flex items-center gap-md border-b border-border-color-light p-lg">
                        <TrendingUp className="text-color-primary" size={20} />
                        <h3 className="text-lg font-700 text-text-primary">端點使用統計</h3>
                    </div>
                    <div className="flex flex-col gap-lg p-lg">
                        {apiStats.requestsByEndpoint.map((ep, index) => {
                            const maxCount = Math.max(...apiStats.requestsByEndpoint.map(e => e.count));
                            const percentage = (ep.count / maxCount) * 100;
                            return (
                                <div key={ep.endpoint} className="flex flex-col gap-2 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <code className="text-xs font-mono text-text-primary truncate">{ep.endpoint}</code>
                                            <span className="text-[0.7rem] text-text-muted">{ep.count.toLocaleString()} 次 • 平均 {ep.avgResponseTime}ms</span>
                                        </div>
                                        <span className="text-[0.7rem] font-700 text-text-secondary">{Math.round((ep.count / apiStats.totalRequests) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-color-primary to-color-accent rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Trend */}
                <div className="card flex flex-col border border-border-color bg-bg-card shadow-lg p-0">
                    <div className="flex items-center gap-md border-b border-border-color-light p-lg">
                        <BarChart3 className="text-color-primary" size={20} />
                        <h3 className="text-lg font-700 text-text-primary">近 7 日請求趨勢</h3>
                    </div>
                    <div className="flex flex-1 items-end justify-between gap-2 p-lg min-h-[240px]">
                        {apiStats.requestsByDay.map((day, index) => {
                            const maxCount = Math.max(...apiStats.requestsByDay.map(d => d.count), 1);
                            const successHeight = (day.success / maxCount) * 100;
                            const failedHeight = (day.failed / maxCount) * 100;
                            return (
                                <div key={day.date} className="flex flex-1 flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="relative flex w-full max-w-[24px] flex-col-reverse gap-0.5" style={{ height: '160px' }}>
                                        <div className="w-full rounded-t bg-color-success/60 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all hover:opacity-100 opacity-80" style={{ height: `${successHeight}%` }} title={`成功: ${day.success}`} />
                                        <div className="w-full rounded-b bg-color-error/60 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all hover:opacity-100 opacity-80" style={{ height: `${failedHeight}%` }} title={`失敗: ${day.failed}`} />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[0.65rem] font-700 text-text-muted">{format(new Date(day.date), 'MM/dd')}</span>
                                        <span className="text-[0.6rem] font-800 text-text-secondary">{day.count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-lg border-t border-border-color-light py-4 px-lg text-[0.7rem] font-600 uppercase tracking-widest">
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-color-success" />成功</div>
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-color-error" />失敗</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card flex flex-col gap-md lg:flex-row lg:items-center border border-border-color bg-bg-card p-md shadow-lg">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" className="input pl-12" placeholder="搜尋端點或金鑰名稱..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-md overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <Filter size={16} className="text-text-muted" />
                        <select className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                            <option value="all">所有狀態</option>
                            <option value="success">成功</option>
                            <option value="failed">失敗</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <select className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none min-w-[120px]" value={keyFilter} onChange={e => setKeyFilter(e.target.value)}>
                            <option value="all">所有金鑰</option>
                            {apiKeys.map(key => <option key={key.id} value={key.id}>{key.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="hidden lg:block text-[0.75rem] font-600 text-text-muted px-2 whitespace-nowrap">顯示 {filteredLogs.length} 筆</div>
            </div>

            {/* Table */}
            <div className="card h-full min-h-[400px] border border-border-color bg-bg-card p-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="py-20 text-center opacity-50">
                            <span className="text-4xl block mb-2">📊</span>
                            <p>沒有符合條件的紀錄</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-color bg-bg-tertiary/20">
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">時間</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">金鑰</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">端點</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">狀態</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">回應時間</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest">IP</th>
                                    <th className="px-lg py-md"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color-light/50">
                                {filteredLogs.map((log, idx) => (
                                    <tr key={log.id} className="hover:bg-bg-tertiary/10 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 15}ms` }}>
                                        <td className="px-lg py-md whitespace-nowrap font-mono text-xs text-text-secondary italic">
                                            {format(new Date(log.createdAt), 'MM/dd HH:mm:ss')}
                                        </td>
                                        <td className="px-lg py-md">
                                            <span className="text-sm font-700 text-text-primary px-2 py-1 rounded bg-bg-secondary border border-border-color/20">{log.apiKeyName}</span>
                                        </td>
                                        <td className="px-lg py-md">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-sm px-1.5 py-0.5 text-[0.6rem] font-900 border ${log.method === 'POST' ? 'border-color-primary/40 text-color-primary bg-color-primary/5' : 'border-color-accent/40 text-color-accent bg-color-accent/5'}`}>{log.method}</span>
                                                <code className="text-xs font-mono text-text-secondary">{log.endpoint}</code>
                                            </div>
                                        </td>
                                        <td className="px-lg py-md">
                                            <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-xs font-800 ${log.success ? 'bg-success/20 text-color-success' : 'bg-error/20 text-color-error'}`}>{log.statusCode}</span>
                                        </td>
                                        <td className="px-lg py-md font-mono text-xs text-text-muted">{log.responseTime}ms</td>
                                        <td className="px-lg py-md font-mono text-xs text-text-muted italic">{log.ipAddress}</td>
                                        <td className="px-lg py-md text-right">
                                            <button className="btn h-8 w-8 p-0 text-text-muted hover:bg-bg-tertiary hover:text-text-primary" onClick={() => setSelectedLog(log)}><Eye size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}

function LogDetailModal({ log, onClose }: any) {
    const [copying, setCopying] = useState<string | null>(null);
    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

    const tryFormatJson = (data: any): string => {
        if (!data) return '-';
        try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data;
            return JSON.stringify(obj, null, 2);
        } catch { return String(data); }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopying(type);
        toast.success('已複製到剪貼簿');
        setTimeout(() => setCopying(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-heavy animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg bg-bg-tertiary/10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-900 text-text-primary uppercase tracking-tighter italic leading-none mb-1">API Request Trace</h2>
                        <p className="text-[0.65rem] text-text-muted font-700 tracking-wider flex items-center gap-1 uppercase">
                            <Activity size={10} className="text-color-primary" /> Session Intelligence Data
                        </p>
                    </div>
                    <button
                        className="bg-bg-tertiary/50 hover:bg-error/20 p-2 rounded-full transition-all text-text-muted hover:text-color-error"
                        onClick={onClose}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto p-lg custom-scrollbar bg-bg-secondary/40">
                    <div className="space-y-8 animate-fade-in">
                        {/* Meta Data Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                            <div className="p-lg rounded-xl bg-bg-tertiary/20 border border-border-color-light/30 shadow-sm col-span-1 md:col-span-2">
                                <div className="flex items-center gap-2 mb-4 text-color-primary">
                                    <Globe size={16} />
                                    <span className="text-xs font-900 text-text-secondary uppercase tracking-widest leading-none">Transmission Interface</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">Endpoint</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-bg-tertiary px-1.5 py-0.5 rounded text-[0.65rem] font-900 border border-border-color/30 leading-none">{log.method}</span>
                                            <span className="text-sm font-700 text-text-primary truncate font-mono">{log.endpoint}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">Origin IP</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm font-700 text-text-primary font-mono">{log.ipAddress}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">Browser / Client Agent</label>
                                        <div className="mt-1 flex items-center gap-2 bg-bg-tertiary/50 p-2 rounded-lg border border-border-color/20 overflow-hidden">
                                            <Monitor size={12} className="shrink-0 text-text-muted" />
                                            <span className="text-[0.65rem] font-600 text-text-muted truncate">{log.userAgent}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-lg rounded-xl bg-bg-tertiary/20 border border-border-color-light/30 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center gap-2 mb-4 text-color-accent">
                                    <Activity size={16} />
                                    <span className="text-xs font-900 text-text-secondary uppercase tracking-widest leading-none">Response Metrics</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">Status</label>
                                        <span className={`text-md font-900 italic ${log.success ? 'text-color-success' : 'text-color-error'}`}>{log.statusCode}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">Latency</label>
                                        <span className="text-md font-900 italic text-color-accent">{log.responseTime}ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[0.6rem] text-text-muted uppercase font-800">API Key Source</label>
                                        <span className="text-sm font-700 text-text-primary">{log.apiKeyName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message if exists */}
                        {log.errorMessage && (
                            <div className="group relative overflow-hidden rounded-xl border border-error/30 bg-error/10 p-lg shadow-inner">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                                    <AlertCircle size={48} className="text-color-error" />
                                </div>
                                <label className="text-[0.6rem] text-color-error uppercase font-900 tracking-[0.2em] mb-2 block">Anomaly Detected</label>
                                <p className="font-mono text-sm text-text-primary relative z-10">{log.errorMessage}</p>
                            </div>
                        )}

                        {/* Payload & Response Blocks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            {[
                                { label: 'Request Payload', data: log.requestBody, id: 'req', icon: <Terminal size={12} /> },
                                { label: 'Response Body', data: log.responseBody, id: 'res', icon: <Activity size={12} /> }
                            ].map(block => (
                                <div key={block.id} className="flex flex-col rounded-xl border border-border-color-light/30 bg-bg-tertiary/10 overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between p-lg bg-bg-tertiary/20 border-b border-border-color-light/20">
                                        <div className="flex items-center gap-2">
                                            <div className="text-text-muted">{block.icon}</div>
                                            <span className="text-[0.65rem] font-900 text-text-primary uppercase tracking-widest italic">{block.label}</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(tryFormatJson(block.data), block.id)}
                                            className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-1.5 text-[0.65rem] font-800 text-text-secondary hover:text-color-primary transition-all border border-border-color hover:border-color-primary"
                                        >
                                            {copying === block.id ? <><Check size={10} className="text-color-success" /> COPIED</> : <><Copy size={10} /> COPY</>}
                                        </button>
                                    </div>
                                    <div className="p-lg bg-bg-tertiary/5">
                                        <pre className="custom-scrollbar h-[250px] overflow-auto font-mono text-[0.7rem] leading-relaxed text-text-secondary whitespace-pre opacity-90">
                                            {block.data ? tryFormatJson(block.data) : (
                                                <span className="italic opacity-40">-- EMPTY DATA SET --</span>
                                            )}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
