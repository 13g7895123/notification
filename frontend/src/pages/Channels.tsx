import { useState, useEffect, useCallback } from 'react';
import {
    Settings2,
    Plus,
    Edit2,
    Trash2,
    TestTube2,
    MessageCircle,
    Send as SendIcon,
    X,
    Check,
    ClipboardList,
    Activity,
    Terminal,
    Globe,
    Calendar,
    Copy,
    ChevronRight,
    Loader2,
    Users,
    Hash
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationChannel, ChannelType, LineConfig, TelegramConfig } from '../types';
import { format } from 'date-fns';
import { toast, confirm } from '../utils/alert';
import { useEscapeKey } from '../hooks/useEscapeKey';

export function Channels() {
    const { channels, addChannel, updateChannel, deleteChannel, toggleChannel, testChannel } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [viewingChannelId, setViewingChannelId] = useState<string | null>(null);

    const handleAddChannel = () => {
        setEditingChannel(null);
        setShowModal(true);
    };

    const handleEditChannel = (channel: NotificationChannel) => {
        setEditingChannel(channel);
        setShowModal(true);
    };

    const handleTestChannel = async (id: string) => {
        setTestingId(id);
        const success = await testChannel(id);
        setTestingId(null);

        if (success) {
            toast.success('測試訊息發送成功！');
        } else {
            toast.error('測試訊息發送失敗，請檢查渠道設定');
        }
    };

    const handleDeleteChannel = async (channel: NotificationChannel) => {
        const confirmed = await confirm.delete(channel.name);
        if (confirmed) {
            deleteChannel(channel.id);
            toast.success(`渠道「${channel.name}」已刪除`);
        }
    };

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <Settings2 size={22} />
                        </div>
                        通知渠道
                    </h1>
                    <p className="mt-1 text-text-muted">管理 LINE 和 Telegram 通知渠道設定</p>
                </div>
                <button
                    className="btn bg-linear-to-br from-color-primary to-color-primary-dark text-white hover:shadow-glow flex items-center gap-sm"
                    onClick={handleAddChannel}
                >
                    <Plus size={18} />
                    新增渠道
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {[
                    { type: 'line', label: 'LINE', icon: MessageCircle, desc: '透過 Messaging API 發送', color: 'color-line', bg: 'bg-color-line/10' },
                    { type: 'telegram', label: 'Telegram', icon: SendIcon, desc: '透過 Bot API 發送', color: 'color-telegram', bg: 'bg-color-telegram/10' }
                ].map((item) => (
                    <div key={item.type} className="card relative flex items-center gap-lg overflow-hidden border border-border-color bg-bg-card p-lg backdrop-blur-md">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} text-${item.color}`}>
                            <item.icon size={28} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-700 text-text-primary">{item.label}</h3>
                            <p className="text-[0.85rem] text-text-muted">{item.desc}</p>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-800 opacity-20 text-text-muted">
                            {channels.filter(c => c.type === item.type).length}
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-md lg:grid-cols-2 xl:grid-cols-3">
                {channels.length === 0 ? (
                    <div className="card col-span-full py-20 text-center">
                        <span className="mb-4 block text-5xl">📡</span>
                        <h3 className="text-xl font-600 text-text-secondary">尚無通知渠道</h3>
                        <p className="mt-2 text-text-muted">點擊「新增渠道」按鈕來設定您的第一個通知渠道</p>
                    </div>
                ) : (
                    channels.map((channel, index) => (
                        <div
                            key={channel.id}
                            className={`card group flex flex-col border border-border-color bg-bg-card transition-all hover:border-color-primary hover:shadow-glow animate-slide-up ${!channel.enabled ? 'opacity-60 saturate-50' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between border-b border-border-color-light p-md">
                                <span className={`flex items-center gap-sm rounded-full px-3 py-1 text-[0.7rem] font-700 tracking-wider ${channel.type === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>
                                    {channel.type === 'line' ? <MessageCircle size={14} /> : <SendIcon size={14} />}
                                    {channel.type.toUpperCase()}
                                </span>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input type="checkbox" className="peer sr-only" checked={channel.enabled} onChange={() => toggleChannel(channel.id)} />
                                    <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                            </div>

                            <div className="flex-1 p-lg">
                                <h3 className="mb-md text-xl font-700 text-text-primary">{channel.name}</h3>
                                <div className="space-y-3">
                                    {channel.type === 'line' ? (
                                        <LineConfigDisplay config={channel.config as LineConfig} />
                                    ) : (
                                        <TelegramConfigDisplay config={channel.config as TelegramConfig} />
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto border-t border-border-color-light p-md">
                                <div className="mb-md flex items-center justify-between text-[0.7rem] text-text-muted">
                                    <span>建立於 {format(new Date(channel.createdAt), 'yyyy/MM/dd')}</span>
                                    <span>更新於 {format(new Date(channel.updatedAt), 'yyyy/MM/dd')}</span>
                                </div>
                                <div className="flex items-center justify-end gap-sm">
                                    <button
                                        className="btn h-9 w-9 p-0 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                                        onClick={() => handleTestChannel(channel.id)}
                                        disabled={!channel.enabled || testingId === channel.id}
                                        title="測試發送"
                                    >
                                        {testingId === channel.id ? <Loader2 size={18} className="animate-spin" /> : <TestTube2 size={18} />}
                                    </button>
                                    <button
                                        className="btn h-9 w-9 p-0 text-text-secondary hover:bg-bg-tertiary"
                                        onClick={() => handleEditChannel(channel)}
                                        title="編輯"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {channel.type === 'line' && (
                                        <>
                                            <button className="btn h-9 w-9 p-0 text-text-secondary hover:bg-bg-tertiary" onClick={() => { setViewingChannelId(channel.id); setShowUsersModal(true); }} title="人員清單"><Users size={18} /></button>
                                            <button className="btn h-9 w-9 p-0 text-text-secondary hover:bg-bg-tertiary" onClick={() => { setViewingChannelId(channel.id); setShowLogsModal(true); }} title="Webhook 記錄"><ClipboardList size={18} /></button>
                                        </>
                                    )}
                                    <button
                                        className="btn h-9 w-9 p-0 text-color-error/70 hover:bg-color-error/10 hover:text-color-error"
                                        onClick={() => handleDeleteChannel(channel)}
                                        title="刪除"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            {showModal && <ChannelModal channel={editingChannel} onClose={() => setShowModal(false)} onSave={(data: NotificationChannel) => { editingChannel ? updateChannel(editingChannel.id, data) : addChannel(data); setShowModal(false); }} />}
            {showUsersModal && viewingChannelId && <ChannelUsersModal channelId={viewingChannelId} onClose={() => { setShowUsersModal(false); setViewingChannelId(null); }} />}
            {showLogsModal && viewingChannelId && <ChannelLogsModal channelId={viewingChannelId} onClose={() => { setShowLogsModal(false); setViewingChannelId(null); }} />}
        </div>
    );
}

function LineConfigDisplay({ config }: { config: LineConfig }) {
    return (
        <div className="space-y-2 text-[0.8rem]">
            <div className="flex justify-between font-500"><span className="text-text-muted">Token:</span><span className="font-mono text-text-secondary">{maskString(config.channelAccessToken)}</span></div>
            <div className="flex justify-between font-500"><span className="text-text-muted">Secret:</span><span className="font-mono text-text-secondary">{maskString(config.channelSecret)}</span></div>
        </div>
    );
}

function TelegramConfigDisplay({ config }: { config: TelegramConfig }) {
    return (
        <div className="space-y-2 text-[0.8rem]">
            <div className="flex justify-between font-500"><span className="text-text-muted">Token:</span><span className="font-mono text-text-secondary">{maskString(config.botToken)}</span></div>
            <div className="flex justify-between font-500"><span className="text-text-muted">Chat ID:</span><span className="font-mono text-text-secondary">{config.chatId}</span></div>
        </div>
    );
}

function ChannelModal({ channel, onClose, onSave }: any) {
    const [type, setType] = useState<ChannelType>(channel?.type || 'line');
    const [name, setName] = useState(channel?.name || '');
    const [enabled, setEnabled] = useState(channel?.enabled ?? true);
    const [channelAccessToken, setChannelAccessToken] = useState(channel?.type === 'line' ? (channel.config as LineConfig).channelAccessToken : '');
    const [channelSecret, setChannelSecret] = useState(channel?.type === 'line' ? (channel.config as LineConfig).channelSecret : '');
    const [webhookKey] = useState(channel?.webhookKey || '');
    const [botToken, setBotToken] = useState(channel?.type === 'telegram' ? (channel.config as TelegramConfig).botToken : '');
    const [chatId, setChatId] = useState(channel?.type === 'telegram' ? (channel.config as TelegramConfig).chatId : '');
    const [parseMode] = useState(channel?.type === 'telegram' ? (channel.config as TelegramConfig).parseMode || 'HTML' : 'HTML');
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">{channel ? '編輯渠道' : '新增渠道'}</h2>
                    <button className="text-text-muted hover:text-text-primary" onClick={onClose}><X size={24} /></button>
                </div>
                <form className="max-h-[80vh] overflow-y-auto p-lg" onSubmit={(e) => { e.preventDefault(); onSave({ type, name, enabled, config: type === 'line' ? { channelAccessToken, channelSecret } : { botToken, chatId, parseMode } }); }}>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[0.875rem] font-600 text-text-secondary">渠道類型</label>
                            <div className="flex gap-md">
                                {['line', 'telegram'].map((t) => (
                                    <button key={t} type="button" className={`flex flex-1 items-center justify-center gap-sm rounded-lg border p-3 font-600 transition-all ${type === t ? 'border-color-primary bg-color-primary/10 text-text-primary shadow-glow' : 'border-border-color bg-bg-tertiary text-text-muted opacity-50'}`} onClick={() => !channel && setType(t as any)} disabled={!!channel}>
                                        {t === 'line' ? <MessageCircle size={18} /> : <SendIcon size={18} />}
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group"><label className="input-label">渠道名稱</label><input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="例如: 主要通知" /></div>

                        {type === 'line' ? (
                            <>
                                {channel && <div className="flex flex-col gap-2"><label className="input-label">Webhook URL</label><div className="flex gap-sm"><input readOnly className="input flex-1 font-mono text-xs bg-bg-tertiary" value={`${apiUrl.replace('/api', '')}/api/webhook/line?key=${webhookKey}`} /><button type="button" className="btn btn-secondary px-4" onClick={() => { navigator.clipboard.writeText(`${apiUrl.replace('/api', '')}/api/webhook/line?key=${webhookKey}`); toast.success('已複製'); }}>複製</button></div></div>}
                                <div className="input-group"><label className="input-label">Access Token</label><input className="input font-mono text-[0.8rem]" value={channelAccessToken} onChange={e => setChannelAccessToken(e.target.value)} required /></div>
                                <div className="input-group"><label className="input-label">Channel Secret</label><input className="input font-mono text-[0.8rem]" value={channelSecret} onChange={e => setChannelSecret(e.target.value)} required /></div>
                            </>
                        ) : (
                            <><div className="input-group"><label className="input-label">Bot Token</label><input className="input font-mono text-[0.8rem]" value={botToken} onChange={e => setBotToken(e.target.value)} required /></div><div className="input-group"><label className="input-label">Chat ID</label><input className="input font-mono text-[0.8rem]" value={chatId} onChange={e => setChatId(e.target.value)} required /></div></>
                        )}

                        <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/50 p-md">
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" className="peer sr-only" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                                <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                            <span className="font-600 text-text-secondary">啟用此渠道</span>
                        </div>
                    </div>
                    <div className="sticky bottom-0 mt-8 flex gap-md border-t border-border-color-light bg-bg-secondary pt-md">
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary flex-1">儲存</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ChannelUsersModal({ channelId, onClose }: any) {
    const { getChannelUsers } = useNotification();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

    useEffect(() => {
        getChannelUsers(channelId).then((data: any) => { setUsers(data || []); setLoading(false); });
    }, [channelId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-2xl rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in overflow-hidden">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">人員清單</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-0">
                    {loading ? <div className="flex py-20 justify-center"><Loader2 className="animate-spin text-color-primary" /></div> : users.length === 0 ? <div className="py-20 text-center text-text-muted">尚無人員資料</div> : (
                        <div className="divide-y divide-border-color-light">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center gap-lg p-lg hover:bg-bg-tertiary/30">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-color bg-linear-to-br from-color-primary/20 to-color-accent/20">
                                        {user.pictureUrl ? <img src={user.pictureUrl} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-700 text-color-primary">{user.displayName?.charAt(0)}</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-sm">
                                            <span className="font-700 text-text-primary">{user.displayName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[0.65rem] font-700 ${user.status === 'active' ? 'bg-success/20 text-color-success-light' : 'bg-error/20 text-color-error-light'}`}>{user.status === 'active' ? '活躍' : '封鎖'}</span>
                                        </div>
                                        <p className="truncate font-mono text-[0.7rem] text-text-muted mt-1">{user.providerId}</p>
                                    </div>
                                    <span className="text-[0.7rem] text-text-muted">{format(new Date(user.createdAt), 'yyyy/MM/dd')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChannelLogsModal({ channelId, onClose }: any) {
    const { getChannelWebhookLogs } = useNotification();
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState<string | null>(null);

    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

    useEffect(() => {
        getChannelWebhookLogs(channelId).then((data: any) => {
            const sortedLogs = (data || []).sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setLogs(sortedLogs);
            setLoading(false);
            if (sortedLogs[0]) setSelectedLog(sortedLogs[0]);
        });
    }, [channelId]);

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopying(type);
        toast.success('已複製到剪貼簿');
        setTimeout(() => setCopying(null), 2000);
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-color-success bg-color-success/10 border-color-success';
        if (status >= 400) return 'text-color-error bg-color-error/10 border-color-error';
        return 'text-color-warning bg-color-warning/10 border-color-warning';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative flex h-[90vh] w-[95vw] max-w-6xl overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-heavy animate-scale-in">
                {/* List Pane */}
                <div className="flex w-[320px] flex-col border-r border-border-color-light bg-bg-tertiary/20">
                    <div className="border-b border-border-color-light p-lg bg-bg-tertiary/30">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="flex items-center gap-2 font-900 text-text-primary uppercase tracking-tighter">
                                <Activity size={18} className="text-color-primary" />
                                Webhook Logs
                            </h3>
                            {!loading && <span className="bg-bg-tertiary px-2 py-0.5 rounded-full text-[0.6rem] font-800 text-text-muted">{logs.length} Entries</span>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted opacity-50">
                                <Loader2 size={32} className="animate-spin" />
                                <span className="text-xs font-700 italic">LOGGING DATA...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-lg text-center gap-2 opacity-40">
                                <Terminal size={40} />
                                <span className="text-sm font-800 italic uppercase">No logs found</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-color-light/30">
                                {logs.map(log => (
                                    <div
                                        key={log.id}
                                        className={`group relative cursor-pointer border-l-4 p-lg transition-all duration-300 ${selectedLog?.id === log.id
                                            ? 'bg-color-primary/10 border-color-primary'
                                            : 'bg-transparent border-transparent hover:bg-bg-tertiary/30'
                                            }`}
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col gap-1">
                                                <div className={`inline-flex items-center self-start rounded-md border px-1.5 py-0.5 text-[0.65rem] font-900 italic tracking-widest leading-none ${getStatusColor(log.responseStatus)}`}>
                                                    {log.method} {log.responseStatus}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[0.65rem] text-text-muted font-600">
                                                    <Globe size={10} />
                                                    {log.ipAddress}
                                                </div>
                                            </div>
                                            <span className="text-[0.6rem] text-text-muted font-800 tabular-nums opacity-60">
                                                {format(new Date(log.createdAt), 'HH:mm:ss')}
                                            </span>
                                        </div>
                                        {selectedLog?.id === log.id && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 translate-x-1 opacity-100 transition-all group-hover:translate-x-0">
                                                <ChevronRight size={16} className="text-color-primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Pane */}
                <div className="flex flex-1 flex-col overflow-hidden bg-bg-secondary/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-border-color-light p-lg bg-bg-tertiary/10">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-900 text-text-primary uppercase tracking-tighter italic leading-none mb-1">Log Intelligence</h2>
                            <p className="text-[0.65rem] text-text-muted font-700 tracking-wider flex items-center gap-1">
                                <Hash size={10} /> {selectedLog?.id || 'NO-SELECTION'}
                            </p>
                        </div>
                        <button
                            className="bg-bg-tertiary/50 hover:bg-error/20 p-2 rounded-full transition-all text-text-muted hover:text-color-error"
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
                        {selectedLog ? (
                            <div className="space-y-8 animate-fade-in">
                                {/* Overview Card */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div className="flex flex-col p-lg rounded-xl bg-bg-tertiary/20 border border-border-color-light/30 shadow-sm transition-all hover:bg-bg-tertiary/30">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 rounded-lg bg-color-primary/20 text-color-primary">
                                                <Calendar size={16} />
                                            </div>
                                            <span className="text-xs font-900 text-text-secondary uppercase tracking-widest">Metadata</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label className="text-[0.6rem] text-text-muted uppercase font-800">Precise Timestamp</label>
                                                <span className="text-sm font-700 text-text-primary tabular-nums">{format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[0.6rem] text-text-muted uppercase font-800">Origin IP Address</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-700 text-text-primary font-mono">{selectedLog.ipAddress}</span>
                                                    <span className="bg-success/10 text-color-success px-1.5 py-0.5 rounded text-[0.6rem] font-800 border border-color-success/20">VERIFIED</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col p-lg rounded-xl bg-bg-tertiary/20 border border-border-color-light/30 shadow-sm transition-all hover:bg-bg-tertiary/30">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 rounded-lg bg-color-accent/20 text-color-accent">
                                                <Activity size={16} />
                                            </div>
                                            <span className="text-xs font-900 text-text-secondary uppercase tracking-widest">Performance</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label className="text-[0.6rem] text-text-muted uppercase font-800">Endpoint Access</label>
                                                <span className="text-sm font-900 text-color-accent italic truncate">{selectedLog.url || '/api/webhook/line'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[0.6rem] text-text-muted uppercase font-800">HTTP Status Code</label>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-md font-900 ${selectedLog.responseStatus < 300 ? 'text-color-success' : 'text-color-error'}`}>{selectedLog.responseStatus}</span>
                                                    <span className="text-[0.65rem] text-text-muted font-700 uppercase">{selectedLog.responseStatus < 300 ? 'Execution Confirmed' : 'Execution Failed'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payload & Response */}
                                {[
                                    {
                                        label: 'Incoming Payload',
                                        icon: <Terminal size={14} />,
                                        data: selectedLog.payload,
                                        type: 'payload',
                                        accent: 'border-color-primary/30'
                                    },
                                    {
                                        label: 'System Response',
                                        icon: <Activity size={14} />,
                                        data: selectedLog.responseBody,
                                        type: 'response',
                                        accent: selectedLog.responseStatus < 300 ? 'border-color-success/30' : 'border-color-error/30'
                                    }
                                ].map((section) => (
                                    <div key={section.type} className={`flex flex-col rounded-xl border bg-bg-tertiary/10 overflow-hidden ${section.accent}`}>
                                        <div className="flex items-center justify-between p-lg bg-bg-tertiary/20 border-b border-border-color-light/20">
                                            <div className="flex items-center gap-2">
                                                <div className="text-text-muted">{section.icon}</div>
                                                <span className="text-xs font-900 text-text-primary uppercase tracking-widest italic">{section.label}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(tryFormatJson(section.data), section.type)}
                                                className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-1.5 text-[0.65rem] font-800 text-text-secondary hover:text-color-primary transition-all border border-border-color hover:border-color-primary"
                                            >
                                                {copying === section.type ? <><Check size={12} className="text-color-success" /> COPIED</> : <><Copy size={12} /> COPY RAW</>}
                                            </button>
                                        </div>
                                        <div className="p-lg bg-bg-tertiary/5">
                                            <pre className="custom-scrollbar max-h-[400px] overflow-auto font-mono text-[0.75rem] leading-relaxed text-text-secondary whitespace-pre opacity-90">
                                                {tryFormatJson(section.data)}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center opacity-30 gap-4">
                                <Terminal size={64} className="animate-pulse" />
                                <span className="text-xl font-900 italic uppercase tracking-[0.2em]">Select Trace Data</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function maskString(s: any) {
    if (typeof s !== 'string') return '-';
    if (s.length <= 10) return s;
    return `${s.substring(0, 6)}...${s.substring(s.length - 4)}`;
}

function tryFormatJson(data: any): string {
    if (!data) return '-';
    try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data;
        return JSON.stringify(obj, null, 2);
    } catch { return String(data); }
}
