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
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import { toast, confirm } from '../utils/alert';
import './Messages.css';

export function Messages() {
    const { messages, deleteMessage } = useNotification();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');
    const [selectedMessage, setSelectedMessage] = useState<NotificationMessage | null>(null);

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = msg.title.toLowerCase().includes(search.toLowerCase()) ||
            msg.content.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (msg: NotificationMessage) => {
        const confirmed = await confirm.delete(msg.title);
        if (confirmed) {
            deleteMessage(msg.id);
            toast.success('訊息已刪除');
        }
    };

    return (
        <div className="messages-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <MessageSquare size={22} />
                        </div>
                        訊息管理
                    </h1>
                    <p className="page-description">
                        檢視和管理所有通知訊息
                    </p>
                </div>
            </div>

            {/* 搜尋與篩選 */}
            <div className="messages-filters card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜尋訊息..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="input select filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as MessageStatus | 'all')}
                    >
                        <option value="all">所有狀態</option>
                        <option value="sent">已發送</option>
                        <option value="scheduled">已排程</option>
                        <option value="sending">發送中</option>
                        <option value="failed">失敗</option>
                        <option value="partial">部分成功</option>
                    </select>
                </div>

                <div className="filter-stats">
                    <span>共 {filteredMessages.length} 則訊息</span>
                </div>
            </div>

            {/* 訊息列表 */}
            <div className="messages-list">
                {filteredMessages.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">📭</div>
                        <h3 className="empty-state-title">沒有符合的訊息</h3>
                        <p className="empty-state-description">
                            {search || statusFilter !== 'all'
                                ? '嘗試調整搜尋條件'
                                : '尚無通知訊息'}
                        </p>
                    </div>
                ) : (
                    filteredMessages.map((message, index) => (
                        <div
                            key={message.id}
                            className="message-card card animate-slide-up"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="message-status-bar">
                                <StatusIndicator status={message.status} />
                            </div>

                            <div className="message-content">
                                <div className="message-header">
                                    <h3 className="message-title">{message.title}</h3>
                                    <StatusBadge status={message.status} />
                                </div>

                                <p className="message-body">{message.content}</p>

                                <div className="message-meta">
                                    <div className="message-channels">
                                        {message.results?.map(result => (
                                            <span
                                                key={result.channelId}
                                                className={`channel-chip ${result.channelType} ${result.success ? 'success' : 'failed'}`}
                                            >
                                                {result.channelType.toUpperCase()}
                                                {result.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            </span>
                                        )) || (message.channelIds || []).map(chId => (
                                            <span key={chId} className="channel-chip pending">
                                                待發送
                                            </span>
                                        ))}
                                    </div>

                                    <div className="message-time">
                                        {message.status === 'scheduled' && message.scheduledAt ? (
                                            <>
                                                <Clock size={14} />
                                                預定 {safeFormatDate(message.scheduledAt, DateFormats.DATETIME)}
                                            </>
                                        ) : message.sentAt ? (
                                            <>發送於 {safeFormatDate(message.sentAt, DateFormats.DATETIME)}</>
                                        ) : (
                                            <>建立於 {safeFormatDate(message.createdAt, DateFormats.DATETIME)}</>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="message-actions">
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => setSelectedMessage(message)}
                                    title="查看詳情"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-icon text-error"
                                    onClick={() => handleDelete(message)}
                                    title="刪除"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 詳情 Modal */}
            {selectedMessage && (
                <MessageDetailModal
                    message={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                />
            )}
        </div>
    );
}

function StatusIndicator({ status }: { status: MessageStatus }) {
    const colors: Record<MessageStatus, string> = {
        sent: 'var(--color-success)',
        failed: 'var(--color-error)',
        partial: 'var(--color-warning)',
        scheduled: 'var(--color-info)',
        sending: 'var(--color-primary)',
        pending: 'var(--text-muted)'
    };

    return (
        <div
            className="status-indicator"
            style={{ background: colors[status] }}
        />
    );
}

function StatusBadge({ status }: { status: MessageStatus }) {
    const config: Record<MessageStatus, { icon: React.ReactNode; text: string; className: string }> = {
        sent: { icon: <CheckCircle size={14} />, text: '已發送', className: 'success' },
        failed: { icon: <XCircle size={14} />, text: '失敗', className: 'error' },
        partial: { icon: <AlertCircle size={14} />, text: '部分成功', className: 'warning' },
        scheduled: { icon: <Clock size={14} />, text: '已排程', className: 'info' },
        sending: { icon: <div className="animate-spin"><Clock size={14} /></div>, text: '發送中', className: 'info' },
        pending: { icon: <Clock size={14} />, text: '待發送', className: 'info' }
    };

    const { icon, text, className } = config[status];

    return (
        <span className={`badge badge-${className}`}>
            {icon}
            {text}
        </span>
    );
}

function MessageDetailModal({ message, onClose }: { message: NotificationMessage; onClose: () => void }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal message-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>訊息詳情</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <label className="detail-label">狀態</label>
                        <StatusBadge status={message.status} />
                    </div>

                    <div className="detail-section">
                        <label className="detail-label">標題</label>
                        <p className="detail-value">{message.title}</p>
                    </div>

                    <div className="detail-section">
                        <label className="detail-label">內容</label>
                        <p className="detail-value detail-content">{message.content}</p>
                    </div>

                    <div className="detail-section">
                        <label className="detail-label">時間</label>
                        <div className="detail-times">
                            <div className="time-item">
                                <span>建立時間</span>
                                <span>{safeFormatDate(message.createdAt, DateFormats.FULL)}</span>
                            </div>
                            {message.scheduledAt && (
                                <div className="time-item">
                                    <span>排程時間</span>
                                    <span>{safeFormatDate(message.scheduledAt, DateFormats.FULL)}</span>
                                </div>
                            )}
                            {message.sentAt && (
                                <div className="time-item">
                                    <span>發送時間</span>
                                    <span>{safeFormatDate(message.sentAt, DateFormats.FULL)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {message.results && message.results.length > 0 && (
                        <div className="detail-section">
                            <label className="detail-label">發送結果</label>
                            <div className="results-list">
                                {message.results.map(result => (
                                    <div key={result.channelId} className={`result-item ${result.success ? 'success' : 'failed'}`}>
                                        <div className="result-info">
                                            <span className={`channel-type-tag ${result.channelType}`}>
                                                {result.channelType.toUpperCase()}
                                            </span>
                                            <span className="result-channel-name">{result.channelName}</span>
                                        </div>
                                        <div className="result-status">
                                            {result.success ? (
                                                <CheckCircle size={16} className="text-success" />
                                            ) : (
                                                <XCircle size={16} className="text-error" />
                                            )}
                                        </div>
                                        {result.error && (
                                            <div className="result-error">{result.error}</div>
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
