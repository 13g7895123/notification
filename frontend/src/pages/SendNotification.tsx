import { useState } from 'react';
import {
    Send,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    Users,
    ChevronUp
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { ChannelUser } from '../types';
import './SendNotification.css';

interface ChannelOption {
    mode: 'all' | 'selected';
    users: string[]; // providerId array
}

export function SendNotification() {
    const { channels, templates, sendMessage, isLoading, getChannelUsers } = useNotification();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

    // Channel Options State
    const [channelOptions, setChannelOptions] = useState<Record<string, ChannelOption>>({});
    // Cache for channel users
    const [channelUsersCache, setChannelUsersCache] = useState<Record<string, ChannelUser[]>>({});
    // Expanded channel for user selection
    const [expandedChannelId, setExpandedChannelId] = useState<string | null>(null);
    const [loadingUsers, setLoadingUsers] = useState<string | null>(null);

    const enabledChannels = channels.filter(c => c.enabled);

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setTitle(template.title);
            setContent(template.content);
        }
    };

    const handleChannelToggle = (channelId: string) => {
        setSelectedChannels(prev => {
            const isSelected = prev.includes(channelId);
            if (isSelected) {
                // Removing
                const newOptions = { ...channelOptions };
                delete newOptions[channelId];
                setChannelOptions(newOptions);
                if (expandedChannelId === channelId) setExpandedChannelId(null);
                return prev.filter(id => id !== channelId);
            } else {
                // Adding
                setChannelOptions(prevOpts => ({
                    ...prevOpts,
                    [channelId]: { mode: 'all', users: [] }
                }));
                // Auto expand if only one channel or user prefers? logic: just add.
                return [...prev, channelId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedChannels.length === enabledChannels.length) {
            setSelectedChannels([]);
            setChannelOptions({});
        } else {
            const allIds = enabledChannels.map(c => c.id);
            setSelectedChannels(allIds);
            const newOptions: Record<string, ChannelOption> = {};
            allIds.forEach(id => {
                newOptions[id] = { mode: 'all', users: [] };
            });
            setChannelOptions(newOptions);
        }
    };

    const toggleChannelExpand = async (channelId: string) => {
        if (expandedChannelId === channelId) {
            setExpandedChannelId(null);
            return;
        }

        setExpandedChannelId(channelId);

        // Fetch users if not cached
        if (!channelUsersCache[channelId]) {
            setLoadingUsers(channelId);
            try {
                const users = await getChannelUsers(channelId);
                setChannelUsersCache(prev => ({ ...prev, [channelId]: users }));
            } finally {
                setLoadingUsers(null);
            }
        }
    };

    const handleOptionModeChange = (channelId: string, mode: 'all' | 'selected') => {
        setChannelOptions(prev => ({
            ...prev,
            [channelId]: { ...prev[channelId], mode }
        }));
    };

    const handleUserToggle = (channelId: string, providerId: string) => {
        setChannelOptions(prev => {
            const currentUsers = prev[channelId]?.users || [];
            const newUsers = currentUsers.includes(providerId)
                ? currentUsers.filter(u => u !== providerId)
                : [...currentUsers, providerId];

            return {
                ...prev,
                [channelId]: { ...prev[channelId], mode: 'selected', users: newUsers }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedChannels.length === 0) {
            alert('請至少選擇一個通知渠道');
            return;
        }

        // Prepare structure for backend
        // Backend expects: channelIds, and optional channelOptions map
        const finalOptions: Record<string, { type: 'all' | 'selected'; users?: string[] }> = {};
        selectedChannels.forEach(cid => {
            const opt = channelOptions[cid];
            if (opt && opt.mode === 'selected') {
                finalOptions[cid] = { type: 'selected', users: opt.users };
            } else {
                finalOptions[cid] = { type: 'all' };
            }
        });

        try {
            await sendMessage({
                title,
                content,
                channelIds: selectedChannels,
                channelOptions: finalOptions,
                scheduledAt: scheduleEnabled && scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`)
                    : undefined
            });

            setSendResult('success');

            // 重置表單
            setTitle('');
            setContent('');
            setSelectedChannels([]);
            setChannelOptions({});
            setScheduleEnabled(false);
            setScheduledDate('');
            setScheduledTime('');
            setSelectedTemplate('');
            setExpandedChannelId(null);

            setTimeout(() => setSendResult(null), 3000);
        } catch {
            setSendResult('error');
            setTimeout(() => setSendResult(null), 3000);
        }
    };

    return (
        <div className="send-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Send size={22} />
                        </div>
                        發送通知
                    </h1>
                    <p className="page-description">
                        撰寫並發送通知訊息到指定的渠道
                    </p>
                </div>
            </div>

            <div className="send-layout">
                {/* 左側：訊息編輯 */}
                <form onSubmit={handleSubmit} className="send-form card">
                    {/* 模板選擇 */}
                    {templates.length > 0 && (
                        <div className="input-group">
                            <label className="input-label">
                                <FileText size={14} />
                                使用模板（選填）
                            </label>
                            <select
                                className="input select"
                                value={selectedTemplate}
                                onChange={e => handleTemplateSelect(e.target.value)}
                            >
                                <option value="">-- 選擇模板 --</option>
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 標題 */}
                    <div className="input-group">
                        <label className="input-label">通知標題</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="請輸入通知標題"
                            required
                        />
                    </div>

                    {/* 內容 */}
                    <div className="input-group">
                        <label className="input-label">通知內容</label>
                        <textarea
                            className="input textarea"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="請輸入通知內容..."
                            required
                            rows={6}
                        />
                        <span className="input-hint">{content.length} 字元</span>
                    </div>

                    {/* 排程發送 */}
                    <div className="schedule-section">
                        <div className="schedule-header">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={scheduleEnabled}
                                    onChange={e => setScheduleEnabled(e.target.checked)}
                                />
                                <span className="switch-slider" />
                            </label>
                            <span className="schedule-label">
                                <Clock size={16} />
                                排程發送
                            </span>
                        </div>

                        {scheduleEnabled && (
                            <div className="schedule-inputs">
                                <input
                                    type="date"
                                    className="input"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    required={scheduleEnabled}
                                />
                                <input
                                    type="time"
                                    className="input"
                                    value={scheduledTime}
                                    onChange={e => setScheduledTime(e.target.value)}
                                    required={scheduleEnabled}
                                />
                            </div>
                        )}
                    </div>

                    {/* 發送按鈕 */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg send-btn"
                        disabled={isLoading || !title || !content || selectedChannels.length === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                {scheduleEnabled ? '排程中...' : '發送中...'}
                            </>
                        ) : sendResult === 'success' ? (
                            <>
                                <CheckCircle size={20} />
                                {scheduleEnabled ? '已排程' : '發送成功！'}
                            </>
                        ) : sendResult === 'error' ? (
                            <>
                                <AlertCircle size={20} />
                                發送失敗
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                {scheduleEnabled ? '設定排程' : '立即發送'}
                            </>
                        )}
                    </button>
                </form>

                {/* 右側：渠道選擇 */}
                <div className="channels-panel card">
                    <div className="channels-panel-header">
                        <h3>選擇通知渠道</h3>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleSelectAll}
                        >
                            {selectedChannels.length === enabledChannels.length ? '取消全選' : '全選'}
                        </button>
                    </div>

                    {enabledChannels.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📡</div>
                            <h4 className="empty-state-title">尚無可用渠道</h4>
                            <p className="empty-state-description">
                                請先至「通知渠道」頁面設定並啟用渠道
                            </p>
                        </div>
                    ) : (
                        <div className="channels-select-list">
                            {enabledChannels.map((channel, index) => {
                                const isSelected = selectedChannels.includes(channel.id);
                                const isExpanded = expandedChannelId === channel.id;
                                const option = channelOptions[channel.id];

                                return (
                                    <div key={channel.id} className={`channel-select-wrapper ${isSelected ? 'selected' : ''}`}>
                                        <div
                                            className="channel-select-item"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleChannelToggle(channel.id)}
                                                className="channel-checkbox"
                                            />
                                            <div className="channel-select-info" onClick={() => handleChannelToggle(channel.id)}>
                                                <span className={`channel-type-tag ${channel.type}`}>
                                                    {(channel.type || '').toUpperCase()}
                                                </span>
                                                <span className="channel-select-name">{channel.name}</span>
                                            </div>

                                            {isSelected && (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs btn-icon"
                                                    onClick={() => toggleChannelExpand(channel.id)}
                                                    title="設定發送對象"
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <Users size={16} />}
                                                </button>
                                            )}
                                        </div>

                                        {isSelected && isExpanded && (
                                            <div className="channel-users-panel animate-slide-down">
                                                <div className="channel-users-header">
                                                    <label className="radio-label">
                                                        <input
                                                            type="radio"
                                                            name={`mode-${channel.id}`}
                                                            checked={option?.mode === 'all'}
                                                            onChange={() => handleOptionModeChange(channel.id, 'all')}
                                                        />
                                                        全部使用者
                                                    </label>
                                                    <label className="radio-label">
                                                        <input
                                                            type="radio"
                                                            name={`mode-${channel.id}`}
                                                            checked={option?.mode === 'selected'}
                                                            onChange={() => handleOptionModeChange(channel.id, 'selected')}
                                                        />
                                                        指定使用者
                                                    </label>
                                                </div>

                                                {option?.mode === 'selected' && (
                                                    <div className="channel-users-list">
                                                        {loadingUsers === channel.id ? (
                                                            <div className="loading-users">
                                                                <Loader2 size={16} className="animate-spin" /> 載入中...
                                                            </div>
                                                        ) : (channelUsersCache[channel.id] || []).length === 0 ? (
                                                            <div className="no-users">該渠道尚無使用者</div>
                                                        ) : (
                                                            (channelUsersCache[channel.id] || []).map(u => (
                                                                <label key={u.providerId} className="user-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={option.users.includes(u.providerId)}
                                                                        onChange={() => handleUserToggle(channel.id, u.providerId)}
                                                                    />
                                                                    <div className="user-info">
                                                                        {u.pictureUrl && <img src={u.pictureUrl} alt="" className="user-avatar-small" />}
                                                                        <span>{u.displayName || '未知使用者'}</span>
                                                                    </div>
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="channels-panel-footer">
                        <span>已選擇 {selectedChannels.length} 個渠道</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
