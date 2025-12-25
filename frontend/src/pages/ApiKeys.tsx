import { useState } from 'react';
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
import './ApiKeys.css';

const PERMISSION_LABELS: Record<ApiPermission, { label: string; description: string }> = {
    send: { label: '發送通知', description: '允許透過 API 發送通知訊息' },
    read_channels: { label: '讀取渠道', description: '允許查看通知渠道列表' },
    read_logs: { label: '讀取日誌', description: '允許查看發送紀錄' },
    read_stats: { label: '讀取統計', description: '允許查看統計數據' }
};

export function ApiKeys() {
    const { apiKeys, addApiKey, updateApiKey, deleteApiKey, toggleApiKey, regenerateApiKey } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleCopyKey = async (key: string, id: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAddKey = () => {
        setEditingKey(null);
        setShowModal(true);
    };

    const handleEditKey = (apiKey: ApiKey) => {
        setEditingKey(apiKey);
        setShowModal(true);
    };

    const handleDeleteKey = async (apiKey: ApiKey) => {
        const confirmed = await confirm.danger(
            '刪除後使用此金鑰的所有應用程式將無法存取 API。',
            `確定要刪除「${apiKey.name}」嗎？`
        );
        if (confirmed) {
            deleteApiKey(apiKey.id);
            toast.success(`API 金鑰「${apiKey.name}」已刪除`);
        }
    };

    const handleRegenerateKey = async (apiKey: ApiKey) => {
        const confirmed = await confirm.danger(
            '舊金鑰將立即失效，請確保您已更新所有使用此金鑰的應用程式。',
            `重新產生「${apiKey.name}」的金鑰？`
        );
        if (confirmed) {
            const newKey = regenerateApiKey(apiKey.id);
            setNewlyCreatedKey(newKey);
            toast.success('金鑰已重新產生');
        }
    };

    const enabledCount = apiKeys.filter(k => k.enabled).length;

    return (
        <div className="api-keys-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Key size={22} />
                        </div>
                        API 金鑰
                    </h1>
                    <p className="page-description">
                        管理 API 存取金鑰，透過 API 發送通知
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-lg" onClick={handleAddKey}>
                        <Plus size={18} />
                        建立金鑰
                    </button>
                </div>
            </div>

            {/* API 使用說明 */}
            <div className="api-info-card card">
                <div className="api-info-header">
                    <Shield size={20} />
                    <h3>API 使用說明</h3>
                </div>
                <div className="api-info-content">
                    <div className="api-endpoint">
                        <span className="method post">POST</span>
                        <code>/api/v1/send</code>
                        <span className="endpoint-desc">發送通知</span>
                    </div>
                    <div className="api-example">
                        <pre>{`curl -X POST https://your-domain.com/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "通知標題",
    "content": "通知內容",
    "channelIds": ["1", "2"]
  }'`}</pre>
                    </div>
                </div>
                <div className="api-stats-mini">
                    <div className="stat-item">
                        <span className="stat-value">{apiKeys.length}</span>
                        <span className="stat-label">總金鑰數</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{enabledCount}</span>
                        <span className="stat-label">啟用中</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{apiKeys.reduce((sum, k) => sum + k.usageCount, 0).toLocaleString()}</span>
                        <span className="stat-label">總使用次數</span>
                    </div>
                </div>
            </div>

            {/* 金鑰列表 */}
            <div className="api-keys-list">
                {apiKeys.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">🔑</div>
                        <h3 className="empty-state-title">尚無 API 金鑰</h3>
                        <p className="empty-state-description">
                            建立 API 金鑰以透過程式化方式發送通知
                        </p>
                        <button className="btn btn-primary" onClick={handleAddKey}>
                            <Plus size={16} />
                            建立第一個金鑰
                        </button>
                    </div>
                ) : (
                    apiKeys.map((apiKey, index) => (
                        <div
                            key={apiKey.id}
                            className={`api-key-card card animate-slide-up ${!apiKey.enabled ? 'disabled' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="api-key-header">
                                <div className="api-key-info">
                                    <h3 className="api-key-name">{apiKey.name}</h3>
                                    <div className="api-key-meta">
                                        <span className={`status-badge ${apiKey.enabled ? 'active' : 'inactive'}`}>
                                            {apiKey.enabled ? '啟用中' : '已停用'}
                                        </span>
                                        {apiKey.expiresAt && (
                                            <span className="expires-badge">
                                                {new Date(apiKey.expiresAt) < new Date() ? '已過期' : `${format(apiKey.expiresAt, 'yyyy/MM/dd')} 到期`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={apiKey.enabled}
                                        onChange={() => toggleApiKey(apiKey.id)}
                                    />
                                    <span className="switch-slider" />
                                </label>
                            </div>

                            <div className="api-key-value">
                                <code className="key-display">
                                    {visibleKeys.has(apiKey.id) ? apiKey.key : apiKey.prefix}
                                </code>
                                <div className="key-actions">
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => toggleKeyVisibility(apiKey.id)}
                                        title={visibleKeys.has(apiKey.id) ? '隱藏' : '顯示'}
                                    >
                                        {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                                        title="複製"
                                    >
                                        {copiedId === apiKey.id ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleRegenerateKey(apiKey)}
                                        title="重新產生"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="api-key-permissions">
                                <span className="permissions-label">權限：</span>
                                <div className="permissions-list">
                                    {apiKey.permissions.map(perm => (
                                        <span key={perm} className="permission-tag">
                                            {PERMISSION_LABELS[perm].label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="api-key-stats">
                                <div className="key-stat">
                                    <span className="key-stat-value">{apiKey.usageCount.toLocaleString()}</span>
                                    <span className="key-stat-label">使用次數</span>
                                </div>
                                <div className="key-stat">
                                    <span className="key-stat-value">{apiKey.rateLimit}/min</span>
                                    <span className="key-stat-label">速率限制</span>
                                </div>
                                <div className="key-stat">
                                    <span className="key-stat-value">
                                        {apiKey.lastUsedAt ? format(apiKey.lastUsedAt, 'MM/dd HH:mm') : '-'}
                                    </span>
                                    <span className="key-stat-label">最後使用</span>
                                </div>
                            </div>

                            <div className="api-key-footer">
                                <span className="key-created">
                                    建立於 {format(apiKey.createdAt, 'yyyy/MM/dd', { locale: zhTW })}
                                </span>
                                <div className="key-footer-actions">
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleEditKey(apiKey)}
                                        title="編輯"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon text-error"
                                        onClick={() => handleDeleteKey(apiKey)}
                                        title="刪除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 新建立金鑰提示 */}
            {newlyCreatedKey && (
                <div className="new-key-modal-overlay" onClick={() => setNewlyCreatedKey(null)}>
                    <div className="new-key-modal" onClick={e => e.stopPropagation()}>
                        <div className="new-key-header">
                            <AlertCircle size={24} className="warning-icon" />
                            <h3>請保存您的 API 金鑰</h3>
                        </div>
                        <p className="new-key-warning">
                            這是您唯一一次能看到完整金鑰的機會。請立即複製並安全保存。
                        </p>
                        <div className="new-key-value">
                            <code>{newlyCreatedKey}</code>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleCopyKey(newlyCreatedKey, 'new')}
                            >
                                {copiedId === 'new' ? <Check size={14} /> : <Copy size={14} />}
                                {copiedId === 'new' ? '已複製' : '複製'}
                            </button>
                        </div>
                        <button className="btn btn-secondary w-full" onClick={() => setNewlyCreatedKey(null)}>
                            我已保存金鑰
                        </button>
                    </div>
                </div>
            )}

            {/* 新增/編輯 Modal */}
            {showModal && (
                <ApiKeyModal
                    apiKey={editingKey}
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        if (editingKey) {
                            updateApiKey(editingKey.id, data);
                        } else {
                            const newKey = addApiKey(data as Omit<ApiKey, 'id' | 'key' | 'prefix' | 'usageCount' | 'createdAt' | 'updatedAt'>);
                            setNewlyCreatedKey(newKey);
                        }
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}

interface ApiKeyModalProps {
    apiKey: ApiKey | null;
    onClose: () => void;
    onSave: (data: Partial<ApiKey>) => void;
}

function ApiKeyModal({ apiKey, onClose, onSave }: ApiKeyModalProps) {
    const [name, setName] = useState(apiKey?.name || '');
    const [permissions, setPermissions] = useState<ApiPermission[]>(
        apiKey?.permissions || ['send', 'read_channels']
    );
    const [rateLimit, setRateLimit] = useState(apiKey?.rateLimit || 60);
    const [enabled, setEnabled] = useState(apiKey?.enabled ?? true);
    const [hasExpiry, setHasExpiry] = useState(!!apiKey?.expiresAt);
    const [expiryDate, setExpiryDate] = useState(
        apiKey?.expiresAt ? format(apiKey.expiresAt, 'yyyy-MM-dd') : ''
    );

    const togglePermission = (perm: ApiPermission) => {
        setPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSave({
            name,
            permissions,
            rateLimit,
            enabled,
            expiresAt: hasExpiry && expiryDate ? new Date(expiryDate) : undefined
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal api-key-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{apiKey ? '編輯 API 金鑰' : '建立 API 金鑰'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* 名稱 */}
                    <div className="input-group">
                        <label className="input-label">金鑰名稱</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如：生產環境 API"
                            required
                        />
                    </div>

                    {/* 權限 */}
                    <div className="input-group">
                        <label className="input-label">API 權限</label>
                        <div className="permissions-selector">
                            {(Object.entries(PERMISSION_LABELS) as [ApiPermission, { label: string; description: string }][]).map(([perm, info]) => (
                                <label key={perm} className={`permission-option ${permissions.includes(perm) ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(perm)}
                                        onChange={() => togglePermission(perm)}
                                    />
                                    <div className="permission-content">
                                        <span className="permission-name">{info.label}</span>
                                        <span className="permission-desc">{info.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 速率限制 */}
                    <div className="input-group">
                        <label className="input-label">速率限制 (每分鐘請求數)</label>
                        <input
                            type="number"
                            className="input"
                            value={rateLimit}
                            onChange={e => setRateLimit(Number(e.target.value))}
                            min={1}
                            max={1000}
                            required
                        />
                    </div>

                    {/* 過期設定 */}
                    <div className="input-group">
                        <div className="expiry-header">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={hasExpiry}
                                    onChange={e => setHasExpiry(e.target.checked)}
                                />
                                <span className="switch-slider" />
                            </label>
                            <span className="input-label">設定過期日期</span>
                        </div>
                        {hasExpiry && (
                            <input
                                type="date"
                                className="input"
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                                required={hasExpiry}
                            />
                        )}
                    </div>

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
                            {apiKey ? '儲存變更' : '建立金鑰'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
