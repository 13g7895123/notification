import { useState, useEffect, useCallback } from 'react';
import {
    Key,
    Plus,
    Edit2,
    Trash2,
    Copy,
    RefreshCw,
    Eye,
    EyeOff,
    X,
    Check,
    AlertCircle,
    Shield
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { ApiKey, ApiPermission } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import { useEscapeKey } from '../hooks/useEscapeKey';

const PERMISSION_LABELS: Record<ApiPermission, { label: string; description: string }> = {
    send: { label: '發送通知', description: '允許透過 API 發送通知訊息' },
    read_channels: { label: '讀取渠道', description: '允許查看通知渠道列表' },
    read_logs: { label: '讀取日誌', description: '允許查看發送紀錄' },
    read_stats: { label: '讀取統計', description: '允許查看統計數據' }
};

export function ApiKeys() {
    const { apiKeys, fetchApiKeys, addApiKey, updateApiKey, deleteApiKey, toggleApiKey, regenerateApiKey } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchApiKeys();
    }, [fetchApiKeys]);

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleCopyKey = async (key: string, id: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('已複製到剪貼簿');
    };

    const handleAddKey = () => { setEditingKey(null); setShowModal(true); };
    const handleEditKey = (apiKey: ApiKey) => { setEditingKey(apiKey); setShowModal(true); };

    const handleDeleteKey = async (apiKey: ApiKey) => {
        const confirmed = await confirm.danger('刪除後使用此金鑰的所有應用程式將無法存取 API。', `確定要刪除「${apiKey.name}」嗎？`);
        if (confirmed) { deleteApiKey(apiKey.id); toast.success(`API 金鑰「${apiKey.name}」已刪除`); }
    };

    const handleRegenerateKey = async (apiKey: ApiKey) => {
        const confirmed = await confirm.danger('舊金鑰將立即失效，請確保您已更新所有使用此金鑰的應用程式。', `重新產生「${apiKey.name}」的金鑰？`);
        if (confirmed) {
            const newKey = await regenerateApiKey(apiKey.id);
            setNewlyCreatedKey(newKey);
            toast.success('金鑰已重新產生');
        }
    };

    const enabledCount = apiKeys.filter(k => k.enabled).length;

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light"><Key size={22} /></div>API 金鑰</h1>
                    <p className="mt-1 text-text-muted">管理 API 存取金鑰，透過 API 發送通知</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2" onClick={handleAddKey}>
                    <Plus size={18} />建立金鑰
                </button>
            </div>

            {/* Info and Stats Card */}
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
                <div className="card lg:col-span-2 flex flex-col gap-lg border border-border-color bg-bg-card/50 p-lg backdrop-blur-md">
                    <div className="flex items-center gap-md border-b border-border-color-light pb-md">
                        <Shield className="text-color-primary" size={24} />
                        <h3 className="text-lg font-700 text-text-primary">API 快速入門</h3>
                    </div>
                    <div className="flex flex-col gap-md">
                        <div className="flex items-center gap-md rounded bg-bg-tertiary px-4 py-3 font-mono text-sm border border-border-color/30 overflow-x-auto">
                            <span className="font-800 text-color-primary">POST</span>
                            <span className="text-text-secondary whitespace-nowrap">/api/notifications/windows</span>
                        </div>
                        <div className="relative group">
                            <pre className="rounded-lg bg-bg-secondary p-lg font-mono text-[0.75rem] text-text-secondary leading-relaxed overflow-x-auto">
                                {`curl -X POST https://${window.location.host}/api/notifications/windows \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "通知標題",
    "content": "通知內容",
    "priority": "high"
  }'`}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="card flex flex-col border border-border-color bg-bg-card p-lg h-full">
                    <h3 className="text-[0.8rem] font-700 text-text-muted uppercase tracking-wider mb-6">金鑰統計</h3>
                    <div className="flex flex-col gap-6">
                        {[
                            { label: '總金鑰數', value: apiKeys.length, color: 'text-text-primary' },
                            { label: '啟用中', value: enabledCount, color: 'text-color-success' },
                            { label: '總使用次數', value: apiKeys.reduce((sum, k) => sum + k.usageCount, 0).toLocaleString(), color: 'text-color-primary' }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col">
                                <span className={`text-3xl font-800 ${stat.color}`}>{stat.value}</span>
                                <span className="text-[0.75rem] font-600 text-text-muted mt-1 uppercase leading-none">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Keys List */}
            <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
                {apiKeys.length === 0 ? (
                    <div className="card col-span-full py-20 text-center opacity-50">
                        <span className="text-4xl block mb-4">🔑</span>
                        <h3 className="text-xl font-600">尚無 API 金鑰</h3>
                        <p className="mt-2 text-text-muted">建立一個以啟動自動化整合</p>
                    </div>
                ) : (
                    apiKeys.map((apiKey, index) => (
                        <div
                            key={apiKey.id}
                            className={`card group flex flex-col border border-border-color bg-bg-card transition-all hover:border-color-primary hover:shadow-glow animate-slide-up ${!apiKey.enabled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between border-b border-border-color-light p-md px-lg">
                                <div className="flex items-center gap-md">
                                    <h3 className="font-700 text-text-primary truncate max-w-[150px]">{apiKey.name}</h3>
                                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-800 ${apiKey.enabled ? 'bg-success/20 text-color-success' : 'bg-error/20 text-color-error'}`}>
                                        {apiKey.enabled ? '啟用中' : '已停用'}
                                    </span>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input type="checkbox" className="peer sr-only" checked={apiKey.enabled} onChange={() => toggleApiKey(apiKey.id)} />
                                    <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                            </div>

                            <div className="p-lg space-y-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[0.7rem] font-700 text-text-muted uppercase">金鑰數值</span>
                                        <div className="flex gap-1">
                                            <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" onClick={() => toggleKeyVisibility(apiKey.id)}>{visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                            <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" onClick={() => handleCopyKey(apiKey.key, apiKey.id)}>{copiedId === apiKey.id ? <Check size={16} className="text-color-success" /> : <Copy size={16} />}</button>
                                            <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors" onClick={() => handleRegenerateKey(apiKey)} title="重新產生"><RefreshCw size={16} /></button>
                                        </div>
                                    </div>
                                    <code className="rounded border border-border-color/30 bg-bg-tertiary px-4 py-3 font-mono text-sm text-text-primary tracking-wider truncate">
                                        {visibleKeys.has(apiKey.id) ? apiKey.key : apiKey.prefix.padEnd(apiKey.key.length, '•')}
                                    </code>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {apiKey.permissions.map(perm => (
                                        <span key={perm} className="rounded bg-bg-secondary px-2 py-0.5 text-[0.65rem] font-700 text-text-secondary border border-border-color-light/50">
                                            {PERMISSION_LABELS[perm].label}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-t border-border-color-light pt-lg">
                                    {[
                                        { label: '使用次數', value: apiKey.usageCount.toLocaleString() },
                                        { label: '每分限制', value: `${apiKey.rateLimit}` },
                                        { label: '最後使用', value: apiKey.lastUsedAt ? format(new Date(apiKey.lastUsedAt), 'MM/dd HH:mm') : '-' }
                                    ].map((s, i) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="text-[0.85rem] font-700 text-text-primary leading-none">{s.value}</span>
                                            <span className="text-[0.6rem] font-600 text-text-muted mt-1 uppercase tracking-tight">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-border-color-light p-md px-lg">
                                <span className="text-[0.7rem] text-text-muted">建立於 {format(new Date(apiKey.createdAt), 'yyyy/MM/dd')}</span>
                                <div className="flex gap-1">
                                    <button className="btn h-8 w-8 p-0 text-text-secondary hover:bg-bg-tertiary" onClick={() => handleEditKey(apiKey)}><Edit2 size={16} /></button>
                                    <button className="btn h-8 w-8 p-0 text-color-error/70 hover:bg-color-error/10 hover:text-color-error" onClick={() => handleDeleteKey(apiKey)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Newly Created Key Alert Modal */}
            {newlyCreatedKey && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-md backdrop-blur-xl">
                    <div className="absolute inset-0 bg-bg-overlay/60" onClick={() => setNewlyCreatedKey(null)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-color-primary/30 bg-bg-card p-10 shadow-glow animate-scale-in text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-color-primary/20 text-color-primary mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-800 text-text-primary mb-3">請保存您的 API 金鑰</h2>
                        <p className="text-sm text-text-muted leading-relaxed mb-8">
                            這是您唯一一次能看到完整金鑰的機會。<br />請立即複製並安全保存。
                        </p>
                        <div className="mb-8 flex items-center gap-2 rounded-lg bg-bg-tertiary/50 border border-border-color p-4 font-mono text-sm text-color-primary-light">
                            <code className="flex-1 truncate">{newlyCreatedKey}</code>
                            <button className="p-2 hover:bg-bg-tertiary rounded text-white" onClick={() => handleCopyKey(newlyCreatedKey, 'new')}>
                                {copiedId === 'new' ? <Check size={18} className="text-color-success" /> : <Copy size={18} />}
                            </button>
                        </div>
                        <button className="btn btn-primary w-full h-12 text-md font-700" onClick={() => setNewlyCreatedKey(null)}>我已保存金鑰</button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showModal && <ApiKeyModal apiKey={editingKey} onClose={() => setShowModal(false)} onSave={async (data) => {
                if (editingKey) { updateApiKey(editingKey.id, data); }
                else { const newKey = await addApiKey(data as any); setNewlyCreatedKey(newKey); }
                setShowModal(false);
            }} />}
        </div>
    );
}

function ApiKeyModal({ apiKey, onClose, onSave }: any) {
    const [name, setName] = useState(apiKey?.name || '');
    const [permissions, setPermissions] = useState<ApiPermission[]>(apiKey?.permissions || ['send', 'read_channels']);
    const [rateLimit, setRateLimit] = useState(apiKey?.rateLimit || 60);
    const [enabled, setEnabled] = useState(apiKey?.enabled ?? true);
    const [hasExpiry, setHasExpiry] = useState(!!apiKey?.expiresAt);
    const [expiryDate, setExpiryDate] = useState(apiKey?.expiresAt ? format(new Date(apiKey.expiresAt), 'yyyy-MM-dd') : '');

    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

    const togglePermission = (perm: ApiPermission) => {
        setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">{apiKey ? '編輯 API 金鑰' : '建立 API 金鑰'}</h2>
                    <button className="text-text-muted hover:text-text-primary" onClick={onClose}><X size={24} /></button>
                </div>
                <form className="max-h-[85vh] overflow-y-auto p-lg space-y-6" onSubmit={(e) => { e.preventDefault(); onSave({ name, permissions, rateLimit, enabled, expiresAt: hasExpiry && expiryDate ? new Date(expiryDate) : undefined }); }}>
                    <div className="input-group"><label className="input-label font-600">金鑰名稱</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="如：外部服務集成" required /></div>
                    <div className="input-group"><label className="input-label font-600">存取權限</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.entries(PERMISSION_LABELS) as any).map(([perm, info]: any) => (
                                <label key={perm} className={`group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${permissions.includes(perm) ? 'border-color-primary bg-color-primary/10' : 'border-border-color bg-bg-tertiary/20'}`}>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-700 ${permissions.includes(perm) ? 'text-color-primary-light' : 'text-text-secondary'}`}>{info.label}</span>
                                        <span className="text-[0.7rem] text-text-muted">{info.description}</span>
                                    </div>
                                    <input type="checkbox" className="h-5 w-5 accent-color-primary" checked={permissions.includes(perm)} onChange={() => togglePermission(perm)} />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="input-group"><label className="input-label font-600">速率限制 (次/分)</label><input type="number" className="input" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} min={1} max={1000} required /></div>
                        <div className="input-group flex flex-col justify-end"><div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/50 p-2.5 px-3">
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" className="peer sr-only" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                                <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                            <span className="text-xs font-700 text-text-secondary">金鑰啟用</span>
                        </div></div>
                    </div>
                    <div className="input-group border-t border-border-color-light/50 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-md">
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input type="checkbox" className="peer sr-only" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} />
                                    <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                                <span className="text-sm font-600 text-text-secondary">設定有效期限</span>
                            </div>
                        </div>
                        {hasExpiry && <input type="date" className="input animate-slide-up" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required={hasExpiry} />}
                    </div>
                    <div className="flex gap-md pt-4">
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary flex-1">{apiKey ? '儲存變更' : '建立金鑰'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
