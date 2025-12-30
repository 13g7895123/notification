import { useState, useEffect, useCallback } from 'react';
import {
    Monitor,
    RefreshCw,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Trash2,
    GitBranch,
    GitCommit,
    Eye,
    EyeOff,
    HelpCircle,
    Filter,
    Copy,
    Check
} from 'lucide-react';
import { api } from '../utils/api';
import type { WindowsNotification, WindowsNotificationStats, WindowsNotificationStatus } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import './WindowsNotifications.css';

interface PaginatedResponse {
    notifications: WindowsNotification[];
    total: number;
    page: number;
    limit: number;
}

const STATUS_CONFIG: Record<WindowsNotificationStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: '待處理', color: 'warning', icon: Clock },
    delivered: { label: '已送達', color: 'info', icon: CheckCircle },
    read: { label: '已讀', color: 'success', icon: Eye },
    dismissed: { label: '已忽略', color: 'muted', icon: EyeOff },
    expired: { label: '已過期', color: 'error', icon: XCircle },
};

export function WindowsNotifications() {
    const [notifications, setNotifications] = useState<WindowsNotification[]>([]);
    const [stats, setStats] = useState<WindowsNotificationStats | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchNotifications = useCallback(async () => {
        try {
            const params: Record<string, string | number | boolean> = {
                page,
                limit,
            };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;

            const data = await api.get<PaginatedResponse>('/notifications/windows', params);
            setNotifications(data.notifications);
            setTotal(data.total);
        } catch (error) {
            console.error('Fetch notifications failed', error);
        }
    }, [page, search, statusFilter, typeFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.get<WindowsNotificationStats>('/notifications/windows/stats');
            setStats(data);
        } catch (error) {
            console.error('Fetch stats failed', error);
        }
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([fetchNotifications(), fetchStats()]);
        setIsLoading(false);
    }, [fetchNotifications, fetchStats]);

    useEffect(() => {
        let ignore = false;

        const initData = async () => {
            setIsLoading(true);
            await Promise.all([fetchNotifications(), fetchStats()]);
            if (!ignore) {
                setIsLoading(false);
            }
        };

        initData();

        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        void loadData();
    };

    const handleStatusChange = async (id: string, status: WindowsNotificationStatus) => {
        try {
            await api.patch(`/notifications/windows/${id}/status`, { status });
            toast.success('狀態已更新');
            void loadData();
        } catch (error) {
            console.error('Update status failed', error);
            toast.error('更新狀態失敗');
        }
    };

    const handleDelete = async (notification: WindowsNotification) => {
        const confirmed = await confirm.delete(`通知「${notification.title}」`);
        if (confirmed) {
            try {
                await api.delete(`/notifications/windows/${notification.id}`);
                toast.success('通知已刪除');
                void loadData();
            } catch (error) {
                console.error('Delete failed', error);
                toast.error('刪除失敗');
            }
        }
    };

    const handleExpire = async () => {
        const confirmed = await confirm.action('確定要將超過 24 小時的待處理通知標記為過期嗎？', '標記過期');
        if (confirmed) {
            try {
                const data = await api.post<{ expired_count: number }>('/notifications/windows/expire');
                toast.success(`已將 ${data.expired_count} 筆通知標記為過期`);
                void loadData();
            } catch (error) {
                console.error('Expire failed', error);
                toast.error('操作失敗');
            }
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="windows-notifications-page">
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Monitor size={22} />
                        </div>
                        Windows 通知
                    </h1>
                    <p className="page-description">
                        查看和管理 CI/CD 發送的 Windows 桌面通知
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => setShowHelpModal(true)}>
                        <HelpCircle size={18} />
                        API 說明
                    </button>
                    <button className="btn btn-secondary" onClick={handleExpire}>
                        <XCircle size={18} />
                        標記過期
                    </button>
                    <button className="btn btn-primary" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        重新整理
                    </button>
                </div>
            </div>

            {showHelpModal && (
                <IntegrationHelpModal onClose={() => setShowHelpModal(false)} />
            )}

            {stats && (
                <div className="win-stats-grid">
                    <div className="win-stat-card animate-slide-up" style={{ animationDelay: '0ms' }}>
                        <div className="stat-icon total">
                            <Monitor size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">總通知數</span>
                            <span className="stat-value">{stats.total}</span>
                        </div>
                    </div>
                    <div className="win-stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
                        <div className="stat-icon pending">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">待處理</span>
                            <span className="stat-value">{stats.pending}</span>
                        </div>
                    </div>
                    <div className="win-stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="stat-icon delivered">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">已送達</span>
                            <span className="stat-value">{stats.delivered}</span>
                        </div>
                    </div>
                    <div className="win-stat-card animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <div className="stat-icon read">
                            <Eye size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">已讀</span>
                            <span className="stat-value">{stats.read}</span>
                        </div>
                    </div>
                    <div className="win-stat-card animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="stat-icon today">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">今日新增</span>
                            <span className="stat-value">{stats.today}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="win-filters card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜尋標題、內容或 Repository..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="input select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">所有狀態</option>
                        <option value="pending">待處理</option>
                        <option value="delivered">已送達</option>
                        <option value="read">已讀</option>
                        <option value="dismissed">已忽略</option>
                        <option value="expired">已過期</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="input select"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                    >
                        <option value="">所有類型</option>
                        <option value="cicd">CI/CD</option>
                        <option value="system">系統</option>
                        <option value="custom">自訂</option>
                    </select>
                </div>

                <div className="filter-stats">
                    <span>共 {total} 筆通知</span>
                </div>
            </div>

            <div className="win-notifications-list">
                {isLoading ? (
                    <div className="loading-state card">
                        <RefreshCw size={32} className="animate-spin" />
                        <p>載入中...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">📭</div>
                        <h3 className="empty-state-title">沒有通知</h3>
                        <p className="empty-state-description">
                            {search || statusFilter || typeFilter
                                ? '嘗試調整篩選條件'
                                : '尚無 Windows 通知記錄'}
                        </p>
                    </div>
                ) : (
                    <>
                        {notifications.map((notification, index) => {
                            const statusConfig = STATUS_CONFIG[notification.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={notification.id}
                                    className={`win-notification-item card animate-slide-up`}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="notification-header">
                                        <div className="notification-title-row">
                                            <span className={`type-badge ${notification.type}`}>
                                                {notification.type.toUpperCase()}
                                            </span>
                                            <h3 className="notification-title">{notification.title}</h3>
                                            <span className={`status-badge ${statusConfig.color}`}>
                                                <StatusIcon size={14} />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <div className="notification-meta">
                                            <span className="repo-info">
                                                <GitBranch size={14} />
                                                {notification.repo}
                                                {notification.branch && ` / ${notification.branch}`}
                                            </span>
                                            {notification.commit_sha && (
                                                <span className="commit-info">
                                                    <GitCommit size={14} />
                                                    {notification.commit_sha.substring(0, 7)}
                                                </span>
                                            )}
                                            <span className="time-info">
                                                <Clock size={14} />
                                                {format(new Date(notification.created_at), 'MM/dd HH:mm', { locale: zhTW })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="notification-body">
                                        <p className="notification-message">{notification.message}</p>
                                    </div>

                                    <div className="notification-footer">
                                        <div className="status-actions">
                                            {notification.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => handleStatusChange(notification.id, 'delivered')}
                                                    >
                                                        <CheckCircle size={14} />
                                                        標記已送達
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => handleStatusChange(notification.id, 'dismissed')}
                                                    >
                                                        <EyeOff size={14} />
                                                        忽略
                                                    </button>
                                                </>
                                            )}
                                            {notification.status === 'delivered' && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => handleStatusChange(notification.id, 'read')}
                                                >
                                                    <Eye size={14} />
                                                    標記已讀
                                                </button>
                                            )}
                                        </div>

                                        <div className="item-actions">
                                            {notification.action_url && (
                                                <a
                                                    href={notification.action_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-ghost"
                                                >
                                                    <ExternalLink size={14} />
                                                    開啟連結
                                                </a>
                                            )}
                                            <button
                                                className="btn btn-sm btn-ghost text-error"
                                                onClick={() => handleDelete(notification)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-ghost"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    上一頁
                                </button>
                                <span className="page-info">
                                    第 {page} / {totalPages} 頁
                                </span>
                                <button
                                    className="btn btn-ghost"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    下一頁
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function IntegrationHelpModal({ onClose }: { onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopyMarkdown = () => {
        const markdown = `## 發送通知 (CI/CD 整合)

在您的 CI/CD Pipeline (如 GitHub Actions, GitLab CI 或 Jenkins) 中呼叫此接口，即可將構建狀態或系統訊息即時推送到指定使用者的 Windows 桌面。

### 請求資訊
- **Method**: POST
- **URL**: ${window.location.origin}/api/notifications/windows
- **Content-Type**: application/json
- **X-API-Key**: YOUR_API_KEY

### 請求參數 (JSON Body)

| 參數名稱 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| title | String | 是 | 通知標題，建議 20 字以內 |
| message | String | 是 | 通知內文，支援多行顯示 |
| repo | String | 是 | 專案名稱 (例如: user/repository) |
| branch | String | 否 | 觸發通知的分支名稱 |
| commit_sha | String | 否 | 完整的 Commit SHA |
| action_url | String | 否 | 點擊通知後欲跳轉的 URL |

### Curl 呼叫範例

\`\`\`bash
curl -X POST ${window.location.origin}/api/notifications/windows \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "title": "Build Success",
    "message": "Production build successfully completed",
    "repo": "company/frontend-app",
    "branch": "master",
    "commit_sha": "f1a2b3c4d5e6",
    "action_url": "https://vercel.com/dashboard"
  }'
\`\`\`
`;
        navigator.clipboard.writeText(markdown).then(() => {
            setCopied(true);
            toast.success('已複製 API 說明 (Markdown)');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <Monitor size={24} className="text-primary" />
                        <h2>Windows 通知 API 整合說明</h2>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>
                <div className="modal-body help-modal-content" style={{ overflowY: 'auto', padding: '24px' }}>

                    {/* 發送通知 Section */}
                    <div className="section">
                        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex items-center gap-2">
                                <GitCommit size={22} className="text-success" />
                                發送通知 (CI/CD 整合)
                            </div>
                            <button
                                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
                                onClick={handleCopyMarkdown}
                                title="複製說明為 Markdown"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span className="ml-1">{copied ? '已複製' : '複製說明'}</span>
                            </button>
                        </div>
                        <p className="section-desc">
                            在您的 CI/CD Pipeline (如 GitHub Actions, GitLab CI 或 Jenkins) 中呼叫此接口，
                            即可將構建狀態或系統訊息即時推送到指定使用者的 Windows 桌面。
                        </p>

                        <div className="endpoint-box">
                            <span className="method-badge post">POST</span>
                            <span className="endpoint-url">{window.location.origin}/api/notifications/windows</span>
                        </div>

                        <div className="code-snippet-container">
                            <div className="code-snippet-header">
                                <span className="code-snippet-title">HTTP Headers</span>
                            </div>
                            <div className="code-snippet-body">
                                <div><span className="json-key">Content-Type</span>: <span className="json-string">application/json</span></div>
                                <div><span className="json-key">X-API-Key</span>: <span className="json-string">YOUR_API_KEY</span></div>
                            </div>
                        </div>

                        <h4 className="font-bold text-sm mb-2 text-primary">請求參數 (JSON Body)</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="doc-table">
                                <thead>
                                    <tr>
                                        <th>參數名稱</th>
                                        <th>類型</th>
                                        <th>必填</th>
                                        <th>說明</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span className="param-name">title</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td><span className="param-required">是</span></td>
                                        <td>通知標題，建議 20 字以內</td>
                                    </tr>
                                    <tr>
                                        <td><span className="param-name">message</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td><span className="param-required">是</span></td>
                                        <td>通知內文，支援多行顯示</td>
                                    </tr>
                                    <tr>
                                        <td><span className="param-name">repo</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td><span className="param-required">是</span></td>
                                        <td>專案名稱 (例如: user/repository)</td>
                                    </tr>
                                    <tr>
                                        <td><span className="param-name">branch</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td>否</td>
                                        <td>觸發通知的分支名稱</td>
                                    </tr>
                                    <tr>
                                        <td><span className="param-name">commit_sha</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td>否</td>
                                        <td>完整的 Commit SHA</td>
                                    </tr>
                                    <tr>
                                        <td><span className="param-name">action_url</span></td>
                                        <td><span className="param-type">String</span></td>
                                        <td>否</td>
                                        <td>點擊通知後欲跳轉的 URL</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h4 className="font-bold text-sm mt-6 mb-2 text-primary">Curl 呼叫範例</h4>
                        <div className="code-snippet-container">
                            <div className="code-snippet-header">
                                <span className="code-snippet-title">shell</span>
                            </div>
                            <pre className="code-snippet-body">
                                {`curl -X POST ${window.location.origin}/api/notifications/windows \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "title": "Build Success",
    "message": "Production build successfully completed",
    "repo": "company/frontend-app",
    "branch": "master",
    "commit_sha": "f1a2b3c4d5e6",
    "action_url": "https://vercel.com/dashboard"
  }'`}
                            </pre>
                        </div>
                    </div>

                    {/* 接收通知 Section */}
                    <div className="section">
                        <div className="section-title">
                            <Monitor size={22} className="text-primary" />
                            接收通知 (Windows Client 整合)
                        </div>
                        <p className="section-desc">
                            Windows 客戶端應用程式應定期輪詢以下接口，以獲取並顯示新的通知訊息。
                        </p>

                        <h4 className="font-bold text-sm mb-2 text-secondary">1. 獲取待處理通知</h4>
                        <div className="endpoint-box">
                            <span className="method-badge get">GET</span>
                            <span className="endpoint-url">{window.location.origin}/api/notifications/windows/pending</span>
                        </div>
                        <div className="text-xs text-muted mb-4 pl-2 italic">
                            註：需帶入 API Key，預設回傳最近 50 筆。
                        </div>

                        <h4 className="font-bold text-sm mb-2 text-secondary">2. 更新通知狀態</h4>
                        <div className="endpoint-box">
                            <span className="method-badge patch">PATCH</span>
                            <span className="endpoint-url">{window.location.origin}/api/notifications/windows/:id/status</span>
                        </div>
                        <div className="code-snippet-container">
                            <div className="code-snippet-header">
                                <span className="code-snippet-title">Request Body</span>
                            </div>
                            <div className="code-snippet-body">
                                <div><span className="json-key">"status"</span>: <span className="json-string">"delivered"</span> | <span className="json-string">"read"</span> | <span className="json-string">"dismissed"</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer p-4 border-t border-light flex justify-center">
                    <button className="btn btn-primary" style={{ width: '120px' }} onClick={onClose}>
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
}
