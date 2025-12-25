import { useState } from 'react';
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
    Loader2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationChannel, ChannelType, LineConfig, TelegramConfig } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import './Channels.css';

export function Channels() {
    const { channels, addChannel, updateChannel, deleteChannel, toggleChannel, testChannel, isLoading } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);

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
                                    <span>建立於 {format(channel.createdAt, 'yyyy/MM/dd', { locale: zhTW })}</span>
                                    <span>•</span>
                                    <span>更新於 {format(channel.updatedAt, 'yyyy/MM/dd', { locale: zhTW })}</span>
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

            {/* 新增/編輯 Modal */}
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
            {config.userId && (
                <div className="config-item">
                    <span className="config-label">User ID</span>
                    <span className="config-value font-mono">{config.userId}</span>
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
    const [lineUserId, setLineUserId] = useState(
        channel?.type === 'line' ? (channel.config as LineConfig).userId || '' : ''
    );

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const config = type === 'line'
            ? { channelAccessToken, channelSecret, userId: lineUserId || undefined }
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
                            <div className="input-group">
                                <label className="input-label">User ID (選填)</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    value={lineUserId}
                                    onChange={e => setLineUserId(e.target.value)}
                                    placeholder="接收訊息的 User ID"
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

function maskString(str: string, visibleChars: number = 8): string {
    if (str.length <= visibleChars) return str;
    return str.slice(0, visibleChars) + '••••••••';
}
