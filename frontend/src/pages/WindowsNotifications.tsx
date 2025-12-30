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

// ... (existing imports)

// ... (existing WindowsNotifications component code)

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
