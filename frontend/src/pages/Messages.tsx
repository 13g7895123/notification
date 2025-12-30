import { useState } from 'react';
import {
    MessageSquare,
    Search,
    Filter,
    Trash2,
    Eye,
    X,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationMessage, MessageStatus } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';

export function Messages() {
    const { messages, deleteMessage } = useNotification();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');
    const [selectedMessage, setSelectedMessage] = useState<NotificationMessage | null>(null);

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = msg.title.toLowerCase().includes(search.toLowerCase()) || msg.content.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (msg: NotificationMessage) => {
        const confirmed = await confirm.delete(msg.title);
        if (confirmed) { deleteMessage(msg.id); toast.success('訊息已刪除'); }
    };

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light"><MessageSquare size={22} /></div>訊息管理</h1>
                    <p className="mt-1 text-text-muted">檢視和管理所有通知訊息</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card flex flex-col gap-md md:flex-row md:items-center border border-border-color bg-bg-card p-md shadow-lg">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" className="input pl-12" placeholder="搜尋訊息標題或內容..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                    <Filter size={16} className="text-text-muted" />
                    <select className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="all">所有狀態</option>
                        <option value="sent">已發送</option>
                        <option value="scheduled">已排程</option>
                        <option value="sending">發送中</option>
                        <option value="failed">失敗</option>
                        <option value="partial">部分成功</option>
                    </select>
                </div>
                <div className="text-[0.75rem] font-600 text-text-muted px-2">共 {filteredMessages.length} 則</div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-md">
                {filteredMessages.length === 0 ? (
                    <div className="card py-20 text-center opacity-50"><span className="text-4xl block mb-2">📭</span><p>沒有符合條件的訊息</p></div>
                ) : (
                    filteredMessages.map((msg, idx) => (
                        <div key={msg.id} className="card group relative flex flex-col md:flex-row md:items-center gap-md border border-border-color bg-bg-card p-lg hover:border-color-primary transition-all animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${getStatusColor(msg.status)}`} />
                            <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                                <div className="flex items-center gap-md">
                                    <h3 className="truncate text-lg font-700 text-text-primary leading-tight">{msg.title}</h3>
                                    <StatusBadge status={msg.status} />
                                </div>
                                <p className="line-clamp-2 text-sm text-text-secondary leading-relaxed">{msg.content}</p>
                                <div className="flex flex-wrap items-center gap-sm mt-1">
                                    <div className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-3 py-1 text-[0.7rem] text-text-muted font-500">
                                        <Clock size={12} />
                                        {msg.status === 'scheduled' ? `預計 ${format(new Date(msg.scheduledAt!), 'MM/dd HH:mm')}` : format(new Date(msg.sentAt || msg.createdAt), 'MM/dd HH:mm')}
                                    </div>
                                    <div className="flex gap-1">
                                        {msg.results?.map((r, i) => <span key={i} className={`h-1.5 w-4 rounded-full ${r.success ? 'bg-color-success' : 'bg-color-error'}`} title={`${r.channelName}: ${r.success ? '成功' : '失敗'}`} />)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-sm md:border-l md:border-border-color-light md:pl-lg">
                                <button className="btn h-10 w-10 p-0 text-text-secondary hover:bg-bg-tertiary" onClick={() => setSelectedMessage(msg)}><Eye size={18} /></button>
                                <button className="btn h-10 w-10 p-0 text-color-error/70 hover:bg-color-error/10 hover:text-color-error" onClick={() => handleDelete(msg)}><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {selectedMessage && <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
        </div>
    );
}

function StatusBadge({ status }: { status: MessageStatus }) {
    const config: any = {
        sent: { icon: CheckCircle, label: '已發送', class: 'bg-success/20 text-color-success-light' },
        failed: { icon: XCircle, label: '發送失敗', class: 'bg-error/20 text-color-error-light' },
        partial: { icon: AlertCircle, label: '部分成功', class: 'bg-warning/20 text-color-warning-light' },
        scheduled: { icon: Clock, label: '已排程', class: 'bg-info/20 text-color-info-light' },
        sending: { icon: Loader2, label: '發送中', class: 'bg-primary/20 text-color-primary-light animate-pulse' }
    };
    const c = config[status] || config.sent;
    return <span className={`flex items-center gap-xs rounded-full px-2.5 py-0.5 text-[0.65rem] font-800 tracking-wide ${c.class}`}>{status === 'sending' ? <c.icon size={12} className="animate-spin" /> : <c.icon size={12} />}{c.label}</span>;
}

function getStatusColor(status: MessageStatus) {
    switch (status) {
        case 'sent': return 'bg-color-success';
        case 'failed': return 'bg-color-error';
        case 'partial': return 'bg-color-warning';
        case 'scheduled': return 'bg-color-info';
        case 'sending': return 'bg-color-primary';
        default: return 'bg-text-muted';
    }
}

function MessageDetailModal({ message, onClose }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">訊息詳情</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto p-lg space-y-8">
                    <div className="flex flex-col gap-2"><label className="text-[0.8rem] font-700 text-text-muted uppercase tracking-wider">標題</label><p className="text-lg font-600 text-text-primary">{message.title}</p></div>
                    <div className="flex flex-col gap-2"><label className="text-[0.8rem] font-700 text-text-muted uppercase tracking-wider">內容</label><pre className="whitespace-pre-wrap rounded-lg bg-bg-tertiary p-lg font-sans text-[0.95rem] text-text-secondary leading-relaxed border border-border-color/30">{message.content}</pre></div>
                    <div className="grid grid-cols-2 gap-md py-4 border-y border-border-color-light/50">
                        <div className="flex flex-col gap-1"><span className="text-[0.7rem] text-text-muted">狀態</span><StatusBadge status={message.status} /></div>
                        <div className="flex flex-col gap-1"><span className="text-[0.7rem] text-text-muted">時間</span><div className="font-600 text-text-secondary text-sm">{format(new Date(message.sentAt || message.createdAt), 'yyyy/MM/dd HH:mm:ss')}</div></div>
                    </div>
                    {message.results?.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <label className="text-[0.8rem] font-700 text-text-muted uppercase tracking-wider">發送統計</label>
                            <div className="flex flex-col gap-sm">
                                {message.results.map((r: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between rounded-lg bg-bg-tertiary/20 p-md border border-border-color/30">
                                        <div className="flex items-center gap-md">
                                            <div className={`rounded px-1.5 py-0.5 text-[0.6rem] font-900 ${r.channelType === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>{r.channelType.toUpperCase()}</div>
                                            <span className="text-sm font-600 text-text-primary">{r.channelName}</span>
                                        </div>
                                        {r.success ? <CheckCircle className="text-color-success" size={18} /> : (
                                            <div className="flex items-center gap-md">
                                                <span className="text-[0.7rem] text-color-error/70">{r.error}</span>
                                                <XCircle className="text-color-error" size={18} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
