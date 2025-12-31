import { useState, useEffect } from 'react';
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
    Loader2,
    RefreshCw,
    Users,
    ClipboardList
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationChannel, ChannelType, LineConfig, TelegramConfig } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import './Channels.css';

export function Channels() {
    const { channels, addChannel, updateChannel, deleteChannel, toggleChannel, testChannel } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);
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
        setTestResult(null);
        const success = await testChannel(id);
        setTestResult({ id, success });
        setTestingId(null);

        if (success) {
            toast.success('測試訊息發送成功！');
        } else {
            toast.error('測試訊息發送失敗，請檢查渠道設定');
        }

        setTimeout(() => setTestResult(null), 3000);
    };

    const handleDeleteChannel = async (channel: NotificationChannel) => {
        const confirmed = await confirm.delete(channel.name);
        if (confirmed) {
            deleteChannel(channel.id);
            toast.success(`渠道「${channel.name}」已刪除`);
        }
    };

    return (
        <div className="channels-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Settings2 size={22} />
                        </div>
                        通知渠道
                    </h1>
                    <p className="page-description">
                        管理 LINE 和 Telegram 通知渠道設定
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-lg" onClick={handleAddChannel}>
                        <Plus size={18} />
                        新增渠道
                    </button>
                </div>
            </div>

            {/* 渠道類型說明 */}
            <div className="channel-types">
                <div className="channel-type-card line">
                    <div className="channel-type-icon">
                        <MessageCircle size={24} />
                    </div>
                    <div className="channel-type-info">
                        <h3>LINE</h3>
                        <p>透過 LINE Messaging API 發送通知</p>
                    </div>
                    <span className="channel-type-count">
                        {channels.filter(c => c.type === 'line').length} 個渠道
                    </span>
                </div>
                <div className="channel-type-card telegram">
                    <div className="channel-type-icon">
                        <SendIcon size={24} />
                    </div>
                    <div className="channel-type-info">
                        <h3>Telegram</h3>
                        <p>透過 Telegram Bot API 發送通知</p>
                    </div>
                    <span className="channel-type-count">
                        {channels.filter(c => c.type === 'telegram').length} 個渠道
                    </span>
                </div>
            </div>

            {/* 渠道列表 */}
            <div className="channels-list">
                {channels.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📡</div>
                        <h3 className="empty-state-title">尚無通知渠道</h3>
                        <p className="empty-state-description">
                            點擊「新增渠道」按鈕來設定您的第一個通知渠道
                        </p>
                    </div>
                ) : (
                    channels.map((channel, index) => (
                        <div
                            key={channel.id}
                            className={`channel-card card animate-slide-up ${!channel.enabled ? 'disabled' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="channel-card-header">
                                <div className="channel-card-type">
                                    <span className={`channel-badge ${channel.type}`}>
                                        {channel.type === 'line' ? <MessageCircle size={16} /> : <SendIcon size={16} />}
                                        {channel.type.toUpperCase()}
                                    </span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={channel.enabled}
                                        onChange={() => toggleChannel(channel.id)}
                                    />
                                    <span className="switch-slider" />
                                </label>
                            </div>

                            <div className="channel-card-body">
                                <h3 className="channel-card-name">{channel.name}</h3>
                                <div className="channel-card-config">
                                    {channel.type === 'line' ? (
                                        <LineConfigDisplay config={channel.config as LineConfig} />
                                    ) : (
                                        <TelegramConfigDisplay config={channel.config as TelegramConfig} />
                                    )}
                                </div>
                            </div>

                            <div className="channel-card-footer">
                                <div className="channel-card-meta">
                                    <span>建立於 {format(new Date(channel.createdAt), 'yyyy/MM/dd', { locale: zhTW })}</span>
                                    <span>•</span>
                                    <span>更新於 {format(new Date(channel.updatedAt), 'yyyy/MM/dd', { locale: zhTW })}</span>
                                </div>
                                <div className="channel-card-actions">
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleTestChannel(channel.id)}
                                        disabled={!channel.enabled || testingId === channel.id}
                                        title="測試發送"
                                    >
                                        {testingId === channel.id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : testResult?.id === channel.id ? (
                                            testResult.success ? <Check size={18} className="text-success" /> : <X size={18} className="text-error" />
                                        ) : (
                                            <TestTube2 size={18} />
                                        )}
                                    </button>

                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleEditChannel(channel)}
                                        title="編輯"
                                    >
                                        <Edit2 size={18} />
                                    </button>

                                    {channel.type === 'line' && (
                                        <>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => {
                                                    setViewingChannelId(channel.id);
                                                    setShowUsersModal(true);
                                                }}
                                                title="人員清單"
                                            >
                                                <Users size={18} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => {
                                                    setViewingChannelId(channel.id);
                                                    setShowLogsModal(true);
                                                }}
                                                title="Webhook 記錄"
                                            >
                                                <ClipboardList size={18} />
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className="btn btn-ghost btn-icon text-error"
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

            {showModal && (
                <ChannelModal
                    channel={editingChannel}
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        if (editingChannel) {
                            updateChannel(editingChannel.id, data);
                        } else {
                            addChannel(data as Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>);
                        }
                        setShowModal(false);
                    }}
                />
            )}

            {showUsersModal && viewingChannelId && (
                <ChannelUsersModal
                    channelId={viewingChannelId}
                    onClose={() => {
                        setShowUsersModal(false);
                        setViewingChannelId(null);
                    }}
                />
            )}

            {showLogsModal && viewingChannelId && (
                <ChannelLogsModal
                    channelId={viewingChannelId}
                    onClose={() => {
                        setShowLogsModal(false);
                        setViewingChannelId(null);
                    }}
                />
            )}
        </div>
    );
}

function LineConfigDisplay({ config }: { config: LineConfig }) {
    return (
        <div className="config-display">
            <div className="config-item">
                <span className="config-label">Channel Token</span>
                <span className="config-value font-mono">{maskString(config.channelAccessToken)}</span>
            </div>
            <div className="config-item">
                <span className="config-label">Channel Secret</span>
                <span className="config-value font-mono">{maskString(config.channelSecret)}</span>
            </div>
            {config.targetId && (
                <div className="config-item">
                    <span className="config-label">Target ID</span>
                    <span className="config-value font-mono">{config.targetId}</span>
                </div>
            )}
        </div>
    );
}

function TelegramConfigDisplay({ config }: { config: TelegramConfig }) {
    return (
        <div className="config-display">
            <div className="config-item">
                <span className="config-label">Bot Token</span>
                <span className="config-value font-mono">{maskString(config.botToken)}</span>
            </div>
            <div className="config-item">
                <span className="config-label">Chat ID</span>
                <span className="config-value font-mono">{config.chatId}</span>
            </div>
            {config.parseMode && (
                <div className="config-item">
                    <span className="config-label">Parse Mode</span>
                    <span className="config-value">{config.parseMode}</span>
                </div>
            )}
        </div>
    );
}

interface ChannelModalProps {
    channel: NotificationChannel | null;
    onClose: () => void;
    onSave: (data: Partial<NotificationChannel>) => void;
}

function ChannelModal({ channel, onClose, onSave }: ChannelModalProps) {
    const { regenerateChannelWebhook } = useNotification();
    const [type, setType] = useState<ChannelType>(channel?.type || 'line');
    const [name, setName] = useState(channel?.name || '');
    const [enabled, setEnabled] = useState(channel?.enabled ?? true);

    // LINE config
    const [channelAccessToken, setChannelAccessToken] = useState(
        channel?.type === 'line' ? (channel.config as LineConfig).channelAccessToken : ''
    );
    const [channelSecret, setChannelSecret] = useState(
        channel?.type === 'line' ? (channel.config as LineConfig).channelSecret : ''
    );
    const [webhookKey, setWebhookKey] = useState(channel?.webhookKey || '');
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Telegram config

    // Telegram config
    const [botToken, setBotToken] = useState(
        channel?.type === 'telegram' ? (channel.config as TelegramConfig).botToken : ''
    );
    const [chatId, setChatId] = useState(
        channel?.type === 'telegram' ? (channel.config as TelegramConfig).chatId : ''
    );
    const [parseMode, setParseMode] = useState<'HTML' | 'Markdown' | 'MarkdownV2'>(
        channel?.type === 'telegram' ? (channel.config as TelegramConfig).parseMode || 'HTML' : 'HTML'
    );

    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const config = type === 'line'
            ? { channelAccessToken, channelSecret }
            : { botToken, chatId, parseMode };

        onSave({
            type,
            name,
            enabled,
            config
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{channel ? '編輯渠道' : '新增渠道'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* 渠道類型 */}
                    <div className="input-group">
                        <label className="input-label">渠道類型</label>
                        <div className="type-selector">
                            <button
                                type="button"
                                className={`type-option ${type === 'line' ? 'active' : ''}`}
                                onClick={() => setType('line')}
                                disabled={!!channel}
                            >
                                <MessageCircle size={20} />
                                LINE
                            </button>
                            <button
                                type="button"
                                className={`type-option ${type === 'telegram' ? 'active' : ''}`}
                                onClick={() => setType('telegram')}
                                disabled={!!channel}
                            >
                                <SendIcon size={20} />
                                Telegram
                            </button>
                        </div>
                    </div>

                    {/* 渠道名稱 */}
                    <div className="input-group">
                        <label className="input-label">渠道名稱</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如: LINE 主要通知"
                            required
                        />
                    </div>

                    {/* 渠道設定 */}
                    {type === 'line' ? (
                        <>
                            {channel && (
                                <div className="input-group">
                                    <label className="input-label">Webhook URL (填寫至 LINE Developer 控制台)</label>
                                    <div className="input-wrapper webhook-url-wrapper" style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="input font-mono"
                                            style={{ background: 'var(--bg-tertiary)', fontSize: '0.85rem' }}
                                            value={`${apiUrl.replace('/api', '')}/api/webhook/line?key=${webhookKey || '尚未生成'}`}
                                            readOnly
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                const url = `${apiUrl.replace('/api', '')}/api/webhook/line?key=${webhookKey || ''}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('已複製 Webhook URL');
                                            }}
                                            disabled={!webhookKey}
                                            title="複製 URL"
                                        >
                                            複製
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={async () => {
                                                if (!channel) return;
                                                const confirmed = await window.confirm('確定要重新生成 Webhook Key 嗎？舊的 Key 將會失效，請記得更新 LINE Developer 控制台的設定。');
                                                if (!confirmed) return;

                                                setIsRegenerating(true);
                                                const newKey = await regenerateChannelWebhook(channel.id);
                                                if (newKey) {
                                                    setWebhookKey(newKey);
                                                    toast.success('Webhook Key 已重新生成');
                                                } else {
                                                    toast.error('重新生成失敗');
                                                }
                                                setIsRegenerating(false);
                                            }}
                                            disabled={!channel || isRegenerating}
                                            title="重新生成 Key"
                                        >
                                            {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        </button>
                                    </div>
                                    <p className="input-hint" style={{ marginTop: '4px' }}>
                                        * 此 URL 用於接收來自 LINE 的事件（如加入好友、自動回覆等）。
                                    </p>
                                </div>
                            )}
                            <div className="input-group">
                                <label className="input-label">Channel Access Token</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    value={channelAccessToken}
                                    onChange={e => setChannelAccessToken(e.target.value)}
                                    placeholder="請輸入 LINE Channel Access Token"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Channel Secret</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    value={channelSecret}
                                    onChange={e => setChannelSecret(e.target.value)}
                                    placeholder="請輸入 LINE Channel Secret"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input-group">
                                <label className="input-label">Bot Token</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    value={botToken}
                                    onChange={e => setBotToken(e.target.value)}
                                    placeholder="請輸入 Telegram Bot Token"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Chat ID</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    value={chatId}
                                    onChange={e => setChatId(e.target.value)}
                                    placeholder="請輸入 Chat ID 或 Group ID"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Parse Mode</label>
                                <select
                                    className="input select"
                                    value={parseMode}
                                    onChange={e => setParseMode(e.target.value as 'HTML' | 'Markdown' | 'MarkdownV2')}
                                >
                                    <option value="HTML">HTML</option>
                                    <option value="Markdown">Markdown</option>
                                    <option value="MarkdownV2">MarkdownV2</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* 啟用狀態 */}
                    <div className="input-group">
                        <label className="input-label">啟用狀態</label>
                        <div className="flex items-center gap-md">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                />
                                <span className="switch-slider" />
                            </label>
                            <span className="text-secondary">{enabled ? '已啟用' : '已停用'}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {channel ? '儲存變更' : '新增渠道'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ChannelUsersModal({ channelId, onClose }: { channelId: string; onClose: () => void }) {
    const { getChannelUsers } = useNotification();
    const [users, setUsers] = useState<import('../types').ChannelUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const data = await getChannelUsers(channelId);
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to load users:', error);
                toast.error('無法載入使用者列表');
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, [channelId, getChannelUsers]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>渠道使用者列表</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div className="flex items-center justify-center py-xl">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state py-lg">
                            <div className="text-4xl mb-4">👥</div>
                            <h3 className="text-lg font-semibold mb-2">尚無使用者</h3>
                            <p className="text-secondary">目前尚未捕捉到此渠道的任何使用者</p>
                        </div>
                    ) : (
                        <div className="users-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {users.map((user) => (
                                <div key={user.id} className="user-item-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--border-color-light)' }}>
                                    {/* 頭像 */}
                                    <div style={{ flexShrink: 0 }}>
                                        {user.pictureUrl ? (
                                            <img
                                                src={user.pictureUrl}
                                                alt={user.displayName || 'User'}
                                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                                {user.displayName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    {/* 使用者資訊 */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName || '未知使用者'}</span>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                background: user.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: user.status === 'active' ? 'var(--color-success)' : 'var(--color-error)'
                                            }}>
                                                {user.status === 'active' ? '活躍' : '封鎖'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                            ID: {user.providerId}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            加入時間: {format(new Date(user.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Remove duplicate close button section if any was here previously */}
            </div>
        </div>
    );
}


function ChannelLogsModal({ channelId, onClose }: { channelId: string; onClose: () => void }) {
    const { getChannelWebhookLogs } = useNotification();
    const [logs, setLogs] = useState<import('../types').WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<import('../types').WebhookLog | null>(null);

    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true);
            try {
                const data = await getChannelWebhookLogs(channelId);
                const sortedLogs = (data || []).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setLogs(sortedLogs);
                if (sortedLogs.length > 0) {
                    setSelectedLog(sortedLogs[0]);
                }
            } catch (error) {
                console.error('Failed to load logs:', error);
                toast.error('無法載入 Webhook 記錄');
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, [channelId]);

    const stats = {
        total: logs.length,
        success: logs.filter(l => l.responseStatus === 200).length,
        error: logs.filter(l => l.responseStatus !== 200).length
    };

    const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ClipboardList size={22} className="text-primary" />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Webhook 呼叫記錄</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>查看來自外部服務的即時請求資訊</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="webhook-logs-container">
                    {/* 左側列表 */}
                    <div className="logs-list-pane">
                        <div className="logs-header-section">
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>最近 50 筆記錄</div>
                            <div className="logs-stats-bar">
                                <div className="stat-item">
                                    <span className="stat-label">成功率</span>
                                    <span className={`stat-value ${successRate > 90 ? 'success' : 'error'}`}>{successRate}%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">總呼叫次數</span>
                                    <span className="stat-value">{stats.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="logs-items-container">
                            {loading ? (
                                <div className="flex items-center justify-center py-xl">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="empty-state py-xl">
                                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
                                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>預期外！目前尚無記錄</h3>
                                </div>
                            ) : (
                                logs.map(log => (
                                    <div
                                        key={log.id}
                                        className={`log-item ${selectedLog?.id === log.id ? 'active' : ''}`}
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <div className="log-item-header">
                                            <span className={`log-status-badge ${log.responseStatus === 200 ? 's200' : 'sError'}`}>
                                                {log.method} {log.responseStatus}
                                            </span>
                                            <span className="log-time-relative">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: zhTW })}
                                            </span>
                                        </div>
                                        <div className="log-item-meta">
                                            <span style={{ fontFamily: 'var(--font-mono)' }}>{log.ipAddress}</span>
                                            <span>{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 右側詳情 */}
                    <div className="log-detail-pane">
                        {selectedLog ? (
                            <div className="animate-fade-in">
                                <div className="detail-header">
                                    <div className="detail-title">
                                        <span className={`log-status-badge ${selectedLog.responseStatus === 200 ? 's200' : 'sError'}`} style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                                            {selectedLog.method} {selectedLog.responseStatus}
                                        </span>
                                        請求詳情
                                    </div>
                                    <div className="detail-subtitle">
                                        追蹤 ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{selectedLog.id}</span>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-section-title">基礎資訊</div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-item-label">請求來源 IP</span>
                                            <span className="info-item-value">{selectedLog.ipAddress}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">完整請求 URL</span>
                                            <span className="info-item-value">{selectedLog.url}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">觸發時間</span>
                                            <span className="info-item-value">{format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-item-label">回應狀態</span>
                                            <span className={`info-item-value ${selectedLog.responseStatus === 200 ? 'text-success' : 'text-error'}`}>
                                                {selectedLog.responseStatus === 200 ? 'OK' : 'Error'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <div className="detail-section-title">請求主體 (Payload)</div>
                                    <JsonDisplay data={selectedLog.payload} />
                                </div>

                                <div className="detail-section">
                                    <div className="detail-section-title">回應內容 (Response)</div>
                                    <JsonDisplay data={selectedLog.responseBody} />
                                </div>

                                <div className="detail-section">
                                    <div className="detail-section-title">請求標頭 (Headers)</div>
                                    <JsonDisplay data={selectedLog.headers} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>🖱️</div>
                                <div>請從左側選擇一筆記錄以查看具體交握資訊</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function JsonDisplay({ data }: { data: string | object | null | undefined }) {
    const formattedJson = tryFormatJson(data);

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-lang">JSON</span>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                    onClick={() => {
                        navigator.clipboard.writeText(formattedJson);
                        toast.success('已複製到剪貼簿');
                    }}
                >
                    複製
                </button>
            </div>
            <div className="code-block-content">
                <pre style={{ margin: 0 }}>{formattedJson}</pre>
            </div>
        </div>
    );
}

function tryFormatJson(data: string | object | null | undefined): string {
    if (data === null || data === undefined) return '-';

    // 如果已經是物件，直接格式化
    if (typeof data === 'object') {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    }

    // 如果是字串，嘗試解析為 JSON
    if (typeof data === 'string') {
        try {
            const obj = JSON.parse(data);
            return JSON.stringify(obj, null, 2);
        } catch {
            return data;
        }
    }

    return String(data);
}

function safeFormatDate(dateStr: string | null | undefined, formatStr: string): string {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return format(date, formatStr);
    } catch {
        return '-';
    }
}
function maskString(str: string, visibleChars: number = 8): string {
    if (str.length <= visibleChars) return str;
    return str.slice(0, visibleChars) + '••••••••';
}
