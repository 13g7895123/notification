import { useState } from 'react';
import {
    Send,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './SendNotification.css';

export function SendNotification() {
    const { channels, templates, sendMessage, isLoading } = useNotification();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

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
        setSelectedChannels(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
    };

    const handleSelectAll = () => {
        if (selectedChannels.length === enabledChannels.length) {
            setSelectedChannels([]);
        } else {
            setSelectedChannels(enabledChannels.map(c => c.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedChannels.length === 0) {
            alert('請至少選擇一個通知渠道');
            return;
        }

        try {
            await sendMessage({
                title,
                content,
                channelIds: selectedChannels,
                scheduledAt: scheduleEnabled && scheduledDate && scheduledTime
                    ? new Date(`${scheduledDate}T${scheduledTime}`)
                    : undefined
            });

            setSendResult('success');

            // 重置表單
            setTitle('');
            setContent('');
            setSelectedChannels([]);
            setScheduleEnabled(false);
            setScheduledDate('');
            setScheduledTime('');
            setSelectedTemplate('');

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
                            {enabledChannels.map((channel, index) => (
                                <label
                                    key={channel.id}
                                    className={`channel-select-item animate-slide-up ${selectedChannels.includes(channel.id) ? 'selected' : ''}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedChannels.includes(channel.id)}
                                        onChange={() => handleChannelToggle(channel.id)}
                                        className="channel-checkbox"
                                    />
                                    <div className="channel-select-info">
                                        <span className={`channel-type-tag ${channel.type}`}>
                                            {(channel.type || '').toUpperCase()}
                                        </span>
                                        <span className="channel-select-name">{channel.name}</span>
                                    </div>
                                    <div className="channel-select-check">
                                        <CheckCircle size={18} />
                                    </div>
                                </label>
                            ))}
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
