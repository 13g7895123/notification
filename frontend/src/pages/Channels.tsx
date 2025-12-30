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
    Loader2,
    Users
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

    const getRelativeTime = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return `${diffSec} 秒前`;
        if (diffMin < 60) return `${diffMin} 分鐘前`;
        if (diffHour < 24) return `${diffHour} 小時前`;
        return `${diffDay} 天前`;
    };

    const successCount = logs.filter(l => l.responseStatus >= 200 && l.responseStatus < 300).length;
    const errorCount = logs.filter(l => l.responseStatus >= 400).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative flex h-[90vh] w-[95vw] max-w-6xl overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-heavy animate-scale-in">
                {/* List Pane */}
                <div className="flex w-[340px] flex-col border-r border-border-color-light bg-bg-tertiary/20">
                    {/* Header with Stats */}
                    <div className="border-b border-border-color-light p-lg bg-bg-tertiary/30">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="flex items-center gap-2 font-900 text-text-primary uppercase tracking-tighter text-lg">
                                <div className="p-1.5 rounded-lg bg-color-primary/20">
                                    <Activity size={18} className="text-color-primary" />
                                </div>
                                Webhook 記錄
                            </h3>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Quick Stats */}
                        {!loading && logs.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-bg-tertiary/50 rounded-lg p-2 text-center border border-border-color-light/30">
                                    <div className="text-lg font-900 text-text-primary">{logs.length}</div>
                                    <div className="text-[0.6rem] font-700 text-text-muted uppercase">總計</div>
                                </div>
                                <div className="bg-success/10 rounded-lg p-2 text-center border border-color-success/20">
                                    <div className="text-lg font-900 text-color-success">{successCount}</div>
                                    <div className="text-[0.6rem] font-700 text-color-success uppercase">成功</div>
                                </div>
                                <div className="bg-error/10 rounded-lg p-2 text-center border border-color-error/20">
                                    <div className="text-lg font-900 text-color-error">{errorCount}</div>
                                    <div className="text-[0.6rem] font-700 text-color-error uppercase">失敗</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Log List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                                <Loader2 size={40} className="animate-spin text-color-primary" />
                                <span className="text-sm font-700">載入記錄中...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-lg text-center gap-3 opacity-50">
                                <Terminal size={48} />
                                <div>
                                    <div className="text-md font-800">尚無 Webhook 記錄</div>
                                    <div className="text-xs text-text-muted mt-1">等待 LINE 平台發送事件</div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {logs.map(log => {
                                    const isSuccess = log.responseStatus >= 200 && log.responseStatus < 300;
                                    const isSelected = selectedLog?.id === log.id;
                                    return (
                                        <div
                                            key={log.id}
                                            className={`group relative cursor-pointer rounded-xl p-3 transition-all duration-200 border ${isSelected
                                                ? 'bg-color-primary/15 border-color-primary shadow-glow'
                                                : 'bg-bg-tertiary/30 border-transparent hover:bg-bg-tertiary/50 hover:border-border-color-light'
                                                }`}
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                {/* Status Icon */}
                                                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isSuccess ? 'bg-success/20' : 'bg-error/20'}`}>
                                                    {isSuccess ? (
                                                        <Check size={20} className="text-color-success" />
                                                    ) : (
                                                        <X size={20} className="text-color-error" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-900 ${isSuccess ? 'bg-success/20 text-color-success' : 'bg-error/20 text-color-error'}`}>
                                                            {log.responseStatus}
                                                        </span>
                                                        <span className="text-[0.65rem] font-800 text-text-muted uppercase">{log.method}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[0.7rem] text-text-secondary font-mono truncate">
                                                        <Globe size={11} className="shrink-0 text-text-muted" />
                                                        {log.ipAddress}
                                                    </div>
                                                </div>

                                                {/* Time */}
                                                <div className="shrink-0 text-right">
                                                    <div className="text-[0.6rem] font-800 text-text-muted">{getRelativeTime(log.createdAt)}</div>
                                                    <div className="text-[0.55rem] font-mono text-text-muted/60">{format(new Date(log.createdAt), 'HH:mm:ss')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Pane */}
                <div className="flex flex-1 flex-col overflow-hidden bg-bg-secondary/60">
                    {selectedLog ? (
                        <>
                            {/* Detail Header */}
                            <div className="border-b border-border-color-light p-lg bg-bg-tertiary/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedLog.responseStatus < 300 ? 'bg-success/20' : 'bg-error/20'}`}>
                                            {selectedLog.responseStatus < 300 ? (
                                                <Check size={28} className="text-color-success" />
                                            ) : (
                                                <X size={28} className="text-color-error" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`text-2xl font-900 ${selectedLog.responseStatus < 300 ? 'text-color-success' : 'text-color-error'}`}>
                                                    {selectedLog.responseStatus}
                                                </span>
                                                <span className="text-lg font-700 text-text-primary">{selectedLog.responseStatus < 300 ? '請求成功' : '請求失敗'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-text-muted">
                                                <span className="font-mono">{selectedLog.method}</span>
                                                <span>•</span>
                                                <span>{getRelativeTime(selectedLog.createdAt)}</span>
                                                <span>•</span>
                                                <span className="font-mono text-xs">{selectedLog.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
                                <div className="space-y-6 animate-fade-in">
                                    {/* Info Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color-light/30">
                                            <div className="flex items-center gap-2 mb-2 text-color-primary">
                                                <Calendar size={14} />
                                                <span className="text-[0.65rem] font-800 uppercase tracking-wider">時間戳記</span>
                                            </div>
                                            <div className="text-sm font-700 text-text-primary font-mono">{format(new Date(selectedLog.createdAt), 'yyyy-MM-dd')}</div>
                                            <div className="text-xs text-text-muted font-mono">{format(new Date(selectedLog.createdAt), 'HH:mm:ss.SSS')}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color-light/30">
                                            <div className="flex items-center gap-2 mb-2 text-color-accent">
                                                <Globe size={14} />
                                                <span className="text-[0.65rem] font-800 uppercase tracking-wider">來源 IP</span>
                                            </div>
                                            <div className="text-sm font-700 text-text-primary font-mono">{selectedLog.ipAddress}</div>
                                            <div className="text-xs text-color-success font-700">✓ 已驗證</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color-light/30">
                                            <div className="flex items-center gap-2 mb-2 text-color-warning">
                                                <Activity size={14} />
                                                <span className="text-[0.65rem] font-800 uppercase tracking-wider">請求方法</span>
                                            </div>
                                            <div className="text-sm font-700 text-text-primary">{selectedLog.method}</div>
                                            <div className="text-xs text-text-muted truncate">{selectedLog.url || '/api/webhook/line'}</div>
                                        </div>
                                    </div>

                                    {/* Payload */}
                                    <div className="rounded-xl border border-color-primary/30 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-color-primary/10 border-b border-color-primary/20">
                                            <div className="flex items-center gap-2">
                                                <Terminal size={16} className="text-color-primary" />
                                                <span className="font-800 text-text-primary">請求內容 (Payload)</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(tryFormatJson(selectedLog.payload), 'payload')}
                                                className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-1.5 text-xs font-700 text-text-secondary hover:text-color-primary transition-all border border-border-color hover:border-color-primary"
                                            >
                                                {copying === 'payload' ? <><Check size={12} className="text-color-success" /> 已複製</> : <><Copy size={12} /> 複製</>}
                                            </button>
                                        </div>
                                        <div className="p-4 bg-bg-tertiary/20 max-h-[300px] overflow-auto custom-scrollbar">
                                            <pre className="font-mono text-[0.75rem] leading-relaxed text-text-secondary whitespace-pre">
                                                {tryFormatJson(selectedLog.payload) || '- 無資料 -'}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Response */}
                                    <div className={`rounded-xl border overflow-hidden ${selectedLog.responseStatus < 300 ? 'border-color-success/30' : 'border-color-error/30'}`}>
                                        <div className={`flex items-center justify-between p-4 border-b ${selectedLog.responseStatus < 300 ? 'bg-success/10 border-color-success/20' : 'bg-error/10 border-color-error/20'}`}>
                                            <div className="flex items-center gap-2">
                                                <Activity size={16} className={selectedLog.responseStatus < 300 ? 'text-color-success' : 'text-color-error'} />
                                                <span className="font-800 text-text-primary">系統回應 (Response)</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(tryFormatJson(selectedLog.responseBody), 'response')}
                                                className="flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-1.5 text-xs font-700 text-text-secondary hover:text-color-primary transition-all border border-border-color hover:border-color-primary"
                                            >
                                                {copying === 'response' ? <><Check size={12} className="text-color-success" /> 已複製</> : <><Copy size={12} /> 複製</>}
                                            </button>
                                        </div>
                                        <div className="p-4 bg-bg-tertiary/20 max-h-[300px] overflow-auto custom-scrollbar">
                                            <pre className="font-mono text-[0.75rem] leading-relaxed text-text-secondary whitespace-pre">
                                                {tryFormatJson(selectedLog.responseBody) || '- 無資料 -'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center opacity-40 gap-4">
                            <Terminal size={64} className="animate-pulse text-color-primary" />
                            <div className="text-center">
                                <div className="text-xl font-900 uppercase tracking-wider">選擇一筆記錄</div>
                                <div className="text-sm text-text-muted mt-1">從左側列表選擇以查看詳情</div>
                            </div>
                        </div>
                    )}
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
