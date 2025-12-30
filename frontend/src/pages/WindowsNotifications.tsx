import { useState, useEffect, useCallback } from 'react';
import {
    Monitor,
    RefreshCw,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Trash2,
    GitBranch,
    GitCommit,
    Eye,
    EyeOff,
    HelpCircle,
    Filter,
    Copy,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { api } from '../utils/api';
import type { WindowsNotification, WindowsNotificationStats, WindowsNotificationStatus } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';

interface PaginatedResponse {
    notifications: WindowsNotification[];
    total: number;
    page: number;
    limit: number;
}

const STATUS_CONFIG: Record<WindowsNotificationStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: '待處理', color: 'color-warning', icon: Clock },
    delivered: { label: '已送達', color: 'color-primary', icon: CheckCircle },
    read: { label: '已讀', color: 'color-success', icon: Eye },
    dismissed: { label: '已忽略', color: 'text-text-muted', icon: EyeOff },
    expired: { label: '已過期', color: 'color-error', icon: XCircle },
};

export function WindowsNotifications() {
    const [notifications, setNotifications] = useState<WindowsNotification[]>([]);
    const [stats, setStats] = useState<WindowsNotificationStats | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchNotifications = useCallback(async () => {
        try {
            const params: Record<string, string | number | boolean> = { page, limit };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            const data = await api.get<PaginatedResponse>('/notifications/windows', params);
            setNotifications(data.notifications);
            setTotal(data.total);
        } catch (error) { console.error(error); }
    }, [page, search, statusFilter, typeFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.get<WindowsNotificationStats>('/notifications/windows/stats');
            setStats(data);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await Promise.all([fetchNotifications(), fetchStats()]);
            setIsLoading(false);
        };
        load();
    }, [page, search, statusFilter, typeFilter, fetchNotifications, fetchStats]);

    const handleRefresh = async () => {
        setIsLoading(true);
        await Promise.all([fetchNotifications(), fetchStats()]);
        setIsLoading(false);
        toast.success('已更新數據');
    };

    const handleStatusChange = async (id: string, status: WindowsNotificationStatus) => {
        try {
            await api.patch(`/notifications/windows/${id}/status`, { status });
            toast.success('狀態已更新');
            fetchNotifications();
            fetchStats();
        } catch (error) { toast.error('更新失敗'); }
    };

    const handleDelete = async (notification: WindowsNotification) => {
        if (await confirm.delete(`通知「${notification.title}」`)) {
            try {
                await api.delete(`/notifications/windows/${notification.id}`);
                toast.success('通知已刪除');
                fetchNotifications();
                fetchStats();
            } catch (error) { toast.error('刪除失敗'); }
        }
    };

    const handleExpire = async () => {
        if (await confirm.action('確定要將超過 24 小時的待處理通知標記為過期嗎？', '標記過期')) {
            try {
                const data = await api.post<{ expired_count: number }>('/notifications/windows/expire');
                toast.success(`已將 ${data.expired_count} 筆通知標記為過期`);
                handleRefresh();
            } catch (error) { toast.error('操作失敗'); }
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <Monitor size={22} />
                        </div>
                        Windows 桌面通知
                    </h1>
                    <p className="mt-1 text-text-muted">監控與管理透過 CI/CD 發送到 Windows 客戶端的桌面通知</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowHelpModal(true)}><HelpCircle size={18} />API 指南</button>
                    <button className="btn btn-secondary flex items-center gap-2" onClick={handleExpire}><XCircle size={18} />自動過期</button>
                    <button className="btn btn-primary flex items-center gap-2" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        重新整理
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 gap-md md:grid-cols-5">
                    {[
                        { label: '總通知數', value: stats.total, icon: Monitor, color: 'primary' },
                        { label: '等待推送', value: stats.pending, icon: Clock, color: 'warning' },
                        { label: '成功送達', value: stats.delivered, icon: CheckCircle, color: 'primary' },
                        { label: '用戶已讀', value: stats.read, icon: Eye, color: 'success' },
                        { label: '今日新增', value: stats.today, icon: AlertCircle, color: 'accent' }
                    ].map((item, i) => (
                        <div key={i} className="card flex flex-col gap-1 border border-border-color bg-bg-card p-md shadow-lg">
                            <div className="flex items-center justify-between mb-1">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-color-${item.color}/20 text-color-${item.color}`}>
                                    <item.icon size={18} />
                                </div>
                                <span className="text-xl font-800 text-text-primary leading-none">{item.value.toLocaleString()}</span>
                            </div>
                            <span className="text-[0.6rem] font-700 text-text-muted uppercase tracking-widest">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="card flex flex-col gap-md lg:flex-row lg:items-center border border-border-color bg-bg-card p-md shadow-lg">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" className="input pl-12" placeholder="搜尋標題、專案或分之..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div className="flex gap-md">
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <Filter size={16} className="text-text-muted" />
                        <select className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">所有狀態</option>
                            <option value="pending">待處理</option>
                            <option value="delivered">已送達</option>
                            <option value="read">已讀</option>
                            <option value="dismissed">已忽略</option>
                            <option value="expired">已過期</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <select className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none min-w-[100px]" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                            <option value="">所有類型</option>
                            <option value="cicd">CI / CD</option>
                            <option value="system">系統</option>
                            <option value="custom">自訂</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col gap-md">
                {isLoading ? (
                    <div className="card flex h-40 flex-col items-center justify-center gap-md border border-border-color bg-bg-card opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-color-primary" />
                        <span className="text-sm font-700 uppercase tracking-widest italic">同步數據中...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="card py-20 text-center border border-border-color bg-bg-card/50">
                        <span className="text-4xl block mb-4">📭</span>
                        <h3 className="text-lg font-700 text-text-secondary uppercase">暫無任何通知紀錄</h3>
                        <p className="text-sm text-text-muted mt-2 lowercase">NO NOTIFICATIONS FOUND MATCHING CRITERIA</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-md">
                            {notifications.map((n, idx) => {
                                const cfg = STATUS_CONFIG[n.status];
                                const Icon = cfg.icon;
                                return (
                                    <div key={n.id} className="card group border border-border-color bg-bg-card transition-all hover:border-color-primary/50 hover:bg-bg-card/80 animate-slide-up overflow-hidden" style={{ animationDelay: `${idx * 20}ms` }}>
                                        <div className="flex flex-col md:flex-row md:items-center p-md px-lg gap-lg">
                                            <div className="flex flex-1 flex-col gap-2 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-900 border ${n.type === 'cicd' ? 'border-color-primary/30 text-color-primary-light bg-color-primary/5' : 'border-color-accent/30 text-color-accent-light'}`}>{n.type.toUpperCase()}</span>
                                                    <h3 className="text-sm font-800 text-text-primary truncate">{n.title}</h3>
                                                    <span className={`ml-auto md:ml-0 inline-flex items-center gap-1 text-[0.65rem] font-800 uppercase ${cfg.color}`}>
                                                        <Icon size={12} /> {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-text-muted font-600">
                                                    <span className="flex items-center gap-1.5"><GitBranch size={12} /> {n.repo}{n.branch && ` @ ${n.branch}`}</span>
                                                    {n.commit_sha && <span className="flex items-center gap-1.5"><GitCommit size={12} /> {n.commit_sha.substring(0, 8)}</span>}
                                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {format(new Date(n.created_at), 'MM/dd HH:mm:ss')}</span>
                                                </div>
                                                <p className="text-sm text-text-secondary leading-relaxed bg-bg-tertiary/20 p-2 rounded border border-border-color-light/20 mt-1">{n.message}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-border-color-light/30 pt-3 md:pt-0 md:pl-6">
                                                <div className="flex gap-2">
                                                    {n.status === 'pending' && (<><button className="btn btn-sm btn-ghost h-8 px-3 text-xs" onClick={() => handleStatusChange(n.id, 'delivered')}><CheckCircle size={14} /> 送達</button><button className="btn btn-sm btn-ghost h-8 px-3 text-xs" onClick={() => handleStatusChange(n.id, 'dismissed')}><EyeOff size={14} /> 忽略</button></>)}
                                                    {n.status === 'delivered' && (<button className="btn btn-sm btn-ghost h-8 px-3 text-xs" onClick={() => handleStatusChange(n.id, 'read')}><Eye size={14} /> 標記已讀</button>)}
                                                </div>
                                                <div className="flex gap-2">
                                                    {n.action_url && (<a href={n.action_url} target="_blank" rel="noopener noreferrer" className="btn h-8 w-8 p-0 text-color-primary hover:bg-color-primary/10" title="Link"><ExternalLink size={16} /></a>)}
                                                    <button className="btn h-8 w-8 p-0 text-color-error/60 hover:bg-error/10 hover:text-color-error" onClick={() => handleDelete(n)} title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border-color-light/30 pt-8 px-lg">
                                <span className="text-xs font-700 text-text-muted uppercase tracking-widest italic leading-none">Showing {notifications.length} of {total} items</span>
                                <div className="flex items-center gap-4">
                                    <button className="btn btn-secondary h-10 w-10 p-0 rounded-full disabled:opacity-30" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={20} /></button>
                                    <span className="text-sm font-900 text-text-primary tracking-tighter tabular-nums">{page} / {totalPages}</span>
                                    <button className="btn btn-secondary h-10 w-10 p-0 rounded-full disabled:opacity-30" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={20} /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Help Modal */}
            {showHelpModal && <IntegrationHelpModal onClose={() => setShowHelpModal(false)} />}
        </div>
    );
}

function IntegrationHelpModal({ onClose }: any) {
    const [copiedSec, setCopiedSec] = useState<string | null>(null);
    const copy = (text: string, sec: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSec(sec);
        toast.success('已複製到剪貼簿');
        setTimeout(() => setCopiedSec(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-md backdrop-blur-xl">
            <div className="absolute inset-0 bg-bg-overlay/60" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-color-primary/30 bg-bg-secondary shadow-glow animate-scale-in flex flex-col">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg bg-bg-tertiary/10">
                    <h2 className="text-xl font-900 text-text-primary uppercase tracking-tighter">Windows 通知集成指南</h2>
                    <button className="text-text-muted hover:text-text-primary" onClick={onClose}><X size={28} /></button>
                </div>
                <div className="overflow-y-auto p-lg space-y-10 custom-scrollbar">
                    {/* Send Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-l-4 border-color-primary pl-4">
                            <div>
                                <h3 className="text-lg font-900 text-text-primary uppercase leading-tight italic">發送通知 (CI / CD 整合)</h3>
                                <p className="text-sm text-text-muted mt-1">在 Pipeline 中調用 API 以推送到 Windows 桌面</p>
                            </div>
                            <button className="btn btn-sm btn-ghost" onClick={() => copy(`POST ${window.location.origin}/api/notifications/windows`, 'p1')}>
                                {copiedSec === 'p1' ? <Check size={14} className="text-color-success" /> : <Copy size={14} />}
                                <span className="ml-2 font-900 tracking-tighter">{copiedSec === 'p1' ? 'COPIED' : 'COPY API'}</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <div className="space-y-4">
                                <div className="rounded border border-border-color/30 bg-bg-tertiary/50 p-4 font-mono text-xs">
                                    <div className="flex items-center gap-3 mb-2"><span className="text-color-primary font-900">POST</span> <span className="text-text-secondary truncate">/api/notifications/windows</span></div>
                                    <div className="text-text-muted"><span className="text-color-primary opacity-60">Auth:</span> X-API-Key: YOUR_API_KEY</div>
                                </div>
                                <div className="rounded border border-border-color-light/50 bg-bg-tertiary/20 overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-bg-tertiary/40 border-b border-border-color-light/30 text-[0.6rem] font-900 uppercase"><tr><th className="px-4 py-2">Param</th><th className="px-4 py-2">Req</th><th className="px-4 py-2">Desc</th></tr></thead>
                                        <tbody className="divide-y divide-border-color-light/10">
                                            {[{ n: 'title', r: 'Y', d: '通知標題' }, { n: 'message', r: 'Y', d: '詳細訊息內容' }, { n: 'repo', r: 'Y', d: 'user/repo' }, { n: 'action_url', r: 'N', d: '跳轉鏈接' }].map((p, i) => (
                                                <tr key={i}><td className="px-4 py-2 font-mono text-color-primary-light">{p.n}</td><td className="px-4 py-2 text-text-muted">{p.r}</td><td className="px-4 py-2 text-text-secondary">{p.d}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="relative group overflow-hidden rounded-xl border border-border-color shadow-lg">
                                <div className="absolute top-4 right-4"><button onClick={() => copy('curl ...', 'curl')} className="text-text-muted hover:text-white transition-colors"><Copy size={16} /></button></div>
                                <div className="bg-bg-tertiary px-4 py-2 text-[0.65rem] font-900 uppercase tracking-widest text-text-muted border-b border-border-color/50 flex items-center justify-between"><span>CURL Example</span></div>
                                <pre className="p-4 font-mono text-[0.7rem] text-text-secondary leading-relaxed bg-[#0a0a0f] overflow-x-auto">
                                    {`curl -X POST ${window.location.origin}/api/notifications/windows \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "title": "Build Pass",
    "message": "master build success",
    "repo": "user/app",
    "branch": "master",
    "action_url": "https://..."
  }'`}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-linear-to-r from-transparent via-border-color to-transparent" />

                    {/* Pending Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-l-4 border-color-accent pl-4">
                            <div>
                                <h3 className="text-lg font-900 text-text-primary uppercase leading-tight italic">接收通知 (Client 整合)</h3>
                                <p className="text-sm text-text-muted mt-1">Windows 客戶端應輪詢以下接口</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <div className="p-lg rounded-xl border border-border-color bg-bg-tertiary/20 flex flex-col gap-4">
                                <h4 className="text-[0.7rem] font-900 text-text-muted uppercase tracking-widest border-b border-border-color/30 pb-2">1. 獲取待處理訊息</h4>
                                <div className="flex items-center gap-2 rounded bg-bg-tertiary p-3 font-mono text-xs">
                                    <span className="text-color-accent font-900">GET</span>
                                    <span className="text-text-secondary truncate">/api/notifications/windows/pending</span>
                                </div>
                                <p className="text-xs text-text-muted italic leading-relaxed">回傳最近 50 筆狀態為 'pending' 的通知。客戶端成功獲取並彈出通知後，應發送 PATCH 請求更新狀態為 'delivered'。</p>
                            </div>
                            <div className="p-lg rounded-xl border border-border-color bg-bg-tertiary/20 flex flex-col gap-4">
                                <h4 className="text-[0.7rem] font-900 text-text-muted uppercase tracking-widest border-b border-border-color/30 pb-2">2. 更新訊息狀態</h4>
                                <div className="flex items-center gap-2 rounded bg-bg-tertiary p-3 font-mono text-xs">
                                    <span className="text-color-primary font-900">PATCH</span>
                                    <span className="text-text-secondary truncate">/api/notifications/windows/:id/status</span>
                                </div>
                                <pre className="rounded bg-[#0a0a0f] p-3 font-mono text-[0.7rem] text-color-primary-light">
                                    {`{
  "status": "delivered" | "read"
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-lg border-t border-border-color-light/30 flex justify-center bg-bg-tertiary/10">
                    <button className="btn btn-primary h-12 w-full max-w-[200px] text-md font-900 italic shadow-glow uppercase" onClick={onClose}>Understood</button>
                </div>
            </div>
        </div>
    );
}
