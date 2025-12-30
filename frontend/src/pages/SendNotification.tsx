import { useState } from 'react';
import {
    Send,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    Users,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { ChannelUser } from '../types';

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

    const [channelOptions, setChannelOptions] = useState<Record<string, ChannelOption>>({});
    const [channelUsersCache, setChannelUsersCache] = useState<Record<string, ChannelUser[]>>({});
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
            if (prev.includes(channelId)) {
                const newOptions = { ...channelOptions };
                delete newOptions[channelId];
                setChannelOptions(newOptions);
                if (expandedChannelId === channelId) setExpandedChannelId(null);
                return prev.filter(id => id !== channelId);
            } else {
                setChannelOptions(prevOpts => ({ ...prevOpts, [channelId]: { mode: 'all', users: [] } }));
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
            allIds.forEach(id => { newOptions[id] = { mode: 'all', users: [] }; });
            setChannelOptions(newOptions);
        }
    };

    const toggleChannelExpand = async (channelId: string) => {
        if (expandedChannelId === channelId) { setExpandedChannelId(null); return; }
        setExpandedChannelId(channelId);
        if (!channelUsersCache[channelId]) {
            setLoadingUsers(channelId);
            try { const users = await getChannelUsers(channelId); setChannelUsersCache(prev => ({ ...prev, [channelId]: users })); } finally { setLoadingUsers(null); }
        }
    };

    const handleOptionModeChange = (channelId: string, mode: 'all' | 'selected') => { setChannelOptions(prev => ({ ...prev, [channelId]: { ...prev[channelId], mode } })); };
    const handleUserToggle = (channelId: string, providerId: string) => {
        setChannelOptions(prev => {
            const currentUsers = prev[channelId]?.users || [];
            const newUsers = currentUsers.includes(providerId) ? currentUsers.filter(u => u !== providerId) : [...currentUsers, providerId];
            return { ...prev, [channelId]: { ...prev[channelId], mode: 'selected', users: newUsers } };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedChannels.length === 0) { alert('請至少選擇一個通知渠道'); return; }
        const finalOptions: any = {};
        selectedChannels.forEach(cid => { const opt = channelOptions[cid]; finalOptions[cid] = (opt?.mode === 'selected') ? { type: 'selected', users: opt.users } : { type: 'all' }; });
        try {
            await sendMessage({ title, content, channelIds: selectedChannels, channelOptions: finalOptions, scheduledAt: scheduleEnabled && scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined });
            setSendResult('success');
            setTitle(''); setContent(''); setSelectedChannels([]); setChannelOptions({}); setScheduleEnabled(false); setScheduledDate(''); setScheduledTime(''); setSelectedTemplate(''); setExpandedChannelId(null);
            setTimeout(() => setSendResult(null), 3000);
        } catch { setSendResult('error'); setTimeout(() => setSendResult(null), 3000); }
    };

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light"><Send size={22} /></div>發送通知</h1>
                    <p className="mt-1 text-text-muted">撰寫並發送通知訊息到指定的渠道</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
                {/* Editor */}
                <form className="card lg:col-span-2 space-y-6 flex flex-col" onSubmit={handleSubmit}>
                    {templates.length > 0 && (
                        <div className="input-group">
                            <label className="input-label flex items-center gap-2 font-600"><FileText size={14} />使用模板（選填）</label>
                            <select className="input select" value={selectedTemplate} onChange={e => handleTemplateSelect(e.target.value)}>
                                <option value="">-- 直接撰寫 --</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="input-group"><label className="input-label font-600">通知標題</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="請輸入標語" required /></div>

                    <div className="input-group"><label className="input-label font-600">通知內容</label><textarea className="input min-h-[160px] resize-none" value={content} onChange={e => setContent(e.target.value)} placeholder="請輸入內容..." required /><div className="mt-1 text-right text-[0.75rem] text-text-muted">{content.length} 字元</div></div>

                    <div className="rounded-lg border border-border-color bg-bg-tertiary/20 p-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-md">
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input type="checkbox" className="peer sr-only" checked={scheduleEnabled} onChange={e => setScheduleEnabled(e.target.checked)} />
                                    <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                                <span className="flex items-center gap-sm font-600 text-text-secondary"><Clock size={16} />排程發送</span>
                            </div>
                        </div>
                        {scheduleEnabled && (
                            <div className="grid grid-cols-2 gap-md animate-slide-up">
                                <input type="date" className="input" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required={scheduleEnabled} />
                                <input type="time" className="input" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required={scheduleEnabled} />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary h-14 w-full text-lg shadow-lg hover:shadow-glow active:translate-y-1 transition-all" disabled={isLoading || !title || !content || selectedChannels.length === 0}>
                        {isLoading ? <div className="flex items-center gap-3"><Loader2 className="animate-spin" /><span>處理中...</span></div> : sendResult === 'success' ? <div className="flex items-center gap-3 text-color-success-light"><CheckCircle /><span>成功</span></div> : <div className="flex items-center gap-3"><Send size={20} /><span>{scheduleEnabled ? '設定排程' : '立即發送'}</span></div>}
                    </button>
                </form>

                {/* Channel Selector */}
                <div className="card flex flex-col h-fit sticky top-6">
                    <div className="flex items-center justify-between border-b border-border-color-light pb-md mb-md">
                        <h3 className="font-700 text-text-primary">選擇通知渠道</h3>
                        <button type="button" className="text-[0.75rem] font-600 text-color-primary-light hover:underline" onClick={handleSelectAll}>{selectedChannels.length === enabledChannels.length ? '取消' : '全選'}</button>
                    </div>

                    {enabledChannels.length === 0 ? (
                        <div className="py-20 text-center opacity-50"><span className="text-4xl block mb-2">📡</span><p className="text-sm">尚無可用渠道</p></div>
                    ) : (
                        <div className="flex flex-col gap-sm overflow-y-auto max-h-[60vh] pr-2">
                            {enabledChannels.map((channel, idx) => {
                                const selected = selectedChannels.includes(channel.id);
                                const expanded = expandedChannelId === channel.id;
                                const option = channelOptions[channel.id];
                                return (
                                    <div key={channel.id} className={`flex flex-col rounded-lg border transition-all ${selected ? 'border-color-primary/50 bg-color-primary/5' : 'border-border-color/30 bg-bg-tertiary/20'}`}>
                                        <div className="flex items-center gap-md p-md">
                                            <input type="checkbox" checked={selected} onChange={() => handleChannelToggle(channel.id)} className="h-5 w-5 rounded border-border-color accent-color-primary" />
                                            <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => handleChannelToggle(channel.id)}>
                                                <div className={`text-[0.6rem] font-900 uppercase tracking-tighter ${channel.type === 'line' ? 'text-color-line' : 'text-color-telegram'}`}>{channel.type}</div>
                                                <div className="truncate text-[0.9rem] font-600 text-text-primary leading-tight">{channel.name}</div>
                                            </div>
                                            {selected && <button type="button" className="p-1 hover:bg-bg-tertiary rounded" onClick={() => toggleChannelExpand(channel.id)}>{expanded ? <ChevronUp size={16} /> : <Users size={16} />}</button>}
                                        </div>
                                        {selected && expanded && (
                                            <div className="animate-slide-up border-t border-border-color-light p-md bg-bg-secondary/50 rounded-b-lg">
                                                <div className="flex gap-md mb-md">
                                                    {['all', 'selected'].map(m => (
                                                        <label key={m} className={`flex flex-1 items-center justify-center gap-2 rounded-md border p-2 text-xs font-700 cursor-pointer transition-all ${option?.mode === m ? 'border-color-primary bg-color-primary/10 text-text-primary' : 'border-border-color-light text-text-muted grayscale'}`}>
                                                            <input type="radio" className="hidden" checked={option?.mode === m} onChange={() => handleOptionModeChange(channel.id, m as any)} />
                                                            {m === 'all' ? '廣播' : '指定'}
                                                        </label>
                                                    ))}
                                                </div>
                                                {option?.mode === 'selected' && (
                                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {loadingUsers === channel.id ? <div className="text-center py-4"><Loader2 className="animate-spin text-color-primary mx-auto" /></div> : (channelUsersCache[channel.id] || []).length === 0 ? <p className="text-xs text-center text-text-muted py-4 italic">無使用者資料</p> : (channelUsersCache[channel.id] || []).map(u => (
                                                            <label key={u.providerId} className="group flex items-center gap-md rounded p-1.5 hover:bg-bg-tertiary cursor-pointer">
                                                                <input type="checkbox" className="h-4 w-4 accent-color-primary" checked={option.users.includes(u.providerId)} onChange={() => handleUserToggle(channel.id, u.providerId)} />
                                                                <div className="flex items-center gap-sm overflow-hidden">
                                                                    <div className="h-6 w-6 rounded-full border border-border-color overflow-hidden bg-bg-tertiary">{u.pictureUrl ? <img src={u.pictureUrl} /> : <div className="flex items-center justify-center h-full text-[0.6rem]">{u.displayName?.[0]}</div>}</div>
                                                                    <span className="truncate text-[0.8rem] text-text-secondary group-hover:text-text-primary transition-colors">{u.displayName}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-md border-t border-border-color-light pt-md text-center text-[0.75rem] text-text-muted">已選擇 {selectedChannels.length} 個渠道</div>
                </div>
            </div>
        </div>
    );
}
