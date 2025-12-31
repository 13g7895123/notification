import { useState } from 'react';
import {
    Book,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Send as SendIcon,
    List
} from 'lucide-react';
import './ApiDocs.css';

interface ApiEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    permission: string;
    requestBody?: {
        fields: { name: string; type: string; required: boolean; description: string }[];
        example: string;
    };
    responseExample: string;
}

const endpoints: ApiEndpoint[] = [
    {
        method: 'POST',
        path: '/api/v1/send',
        description: '發送通知訊息到指定的渠道',
        permission: 'send',
        requestBody: {
            fields: [
                { name: 'title', type: 'string', required: true, description: '通知標題' },
                { name: 'content', type: 'string', required: true, description: '通知內容' },
                { name: 'channelIds', type: 'string[]', required: false, description: '指定渠道 ID 列表' },
                { name: 'channelTypes', type: 'string[]', required: false, description: '指定渠道類型 (line, telegram)' },
                { name: 'scheduledAt', type: 'string', required: false, description: 'ISO 8601 格式的排程時間' }
            ],
            example: `{
  "title": "系統通知",
  "content": "這是一則測試通知",
  "channelIds": ["1", "2"]
}`
        },
        responseExample: `{
  "success": true,
  "messageId": "msg_123456",
  "results": [
    {
      "channelId": "1",
      "channelName": "LINE 主要通知",
      "success": true
    },
    {
      "channelId": "2",
      "channelName": "Telegram 群組",
      "success": true
    }
  ]
}`
    },
    {
        method: 'GET',
        path: '/api/v1/channels',
        description: '取得所有啟用的通知渠道列表',
        permission: 'read_channels',
        responseExample: `{
  "channels": [
    {
      "id": "1",
      "type": "line",
      "name": "LINE 主要通知",
      "enabled": true
    },
    {
      "id": "2",
      "type": "telegram",
      "name": "Telegram 群組",
      "enabled": true
    }
  ]
}`
    },
    {
        method: 'GET',
        path: '/api/v1/logs',
        description: '取得發送紀錄列表',
        permission: 'read_logs',
        responseExample: `{
  "logs": [
    {
      "id": "log_1",
      "channelType": "line",
      "title": "系統通知",
      "status": "success",
      "sentAt": "2024-12-20T10:30:00Z",
      "responseTime": 245
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}`
    },
    {
        method: 'GET',
        path: '/api/v1/stats',
        description: '取得通知統計數據',
        permission: 'read_stats',
        responseExample: `{
  "totalSent": 1247,
  "totalSuccess": 1198,
  "totalFailed": 49,
  "successRate": 96.1,
  "recentActivity": [
    {
      "date": "2024-12-20",
      "sent": 42,
      "success": 41,
      "failed": 1
    }
  ]
}`
    }
];

export function ApiDocs() {
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(endpoints[0].path);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    const handleCopy = async (text: string, section: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'POST': return <SendIcon size={14} />;
            case 'GET': return <List size={14} />;
            default: return null;
        }
    };

    return (
        <div className="api-docs-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Book size={22} />
                        </div>
                        API 文件
                    </h1>
                    <p className="page-description">
                        透過 API 程式化發送通知
                    </p>
                </div>
            </div>

            {/* 快速開始 */}
            <div className="card quick-start-card">
                <h2 className="section-title">🚀 快速開始</h2>
                <div className="quick-start-steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>取得 API 金鑰</h4>
                            <p>在「API 金鑰」頁面建立新的金鑰</p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>設定認證標頭</h4>
                            <p>在請求中加入 Authorization: Bearer YOUR_API_KEY</p>
                        </div>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>發送請求</h4>
                            <p>呼叫 API 端點發送通知</p>
                        </div>
                    </div>
                </div>

                <div className="auth-example">
                    <div className="example-header">
                        <span>認證範例</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCopy(`curl -X POST https://your-domain.com/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "測試", "content": "測試訊息"}'`, 'auth')}
                        >
                            {copiedSection === 'auth' ? <Check size={14} /> : <Copy size={14} />}
                            {copiedSection === 'auth' ? '已複製' : '複製'}
                        </button>
                    </div>
                    <pre className="code-block">{`curl -X POST https://your-domain.com/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "測試", "content": "測試訊息"}'`}</pre>
                </div>
            </div>

            {/* API 端點 */}
            <div className="card endpoints-card">
                <h2 className="section-title">📡 API 端點</h2>
                <div className="endpoints-list">
                    {endpoints.map(endpoint => (
                        <div key={endpoint.path} className="endpoint-section">
                            <button
                                className={`endpoint-header ${expandedEndpoint === endpoint.path ? 'expanded' : ''}`}
                                onClick={() => setExpandedEndpoint(
                                    expandedEndpoint === endpoint.path ? null : endpoint.path
                                )}
                            >
                                <div className="endpoint-info">
                                    <span className={`method-tag ${endpoint.method.toLowerCase()}`}>
                                        {getMethodIcon(endpoint.method)}
                                        {endpoint.method}
                                    </span>
                                    <code className="endpoint-path">{endpoint.path}</code>
                                    <span className="endpoint-desc">{endpoint.description}</span>
                                </div>
                                {expandedEndpoint === endpoint.path ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>

                            {expandedEndpoint === endpoint.path && (
                                <div className="endpoint-body">
                                    <div className="info-row">
                                        <span className="info-label">所需權限</span>
                                        <span className="permission-badge">{endpoint.permission}</span>
                                    </div>

                                    {endpoint.requestBody && (
                                        <div className="section">
                                            <h4>請求參數</h4>
                                            <table className="params-table">
                                                <thead>
                                                    <tr>
                                                        <th>參數</th>
                                                        <th>類型</th>
                                                        <th>必填</th>
                                                        <th>說明</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {endpoint.requestBody.fields.map(field => (
                                                        <tr key={field.name}>
                                                            <td><code>{field.name}</code></td>
                                                            <td><code>{field.type}</code></td>
                                                            <td>{field.required ? '✓' : '-'}</td>
                                                            <td>{field.description}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="example-block">
                                                <div className="example-header">
                                                    <span>請求範例</span>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleCopy(endpoint.requestBody!.example, `req-${endpoint.path}`)}
                                                    >
                                                        {copiedSection === `req-${endpoint.path}` ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                <pre className="code-block">{endpoint.requestBody.example}</pre>
                                            </div>
                                        </div>
                                    )}

                                    <div className="section">
                                        <div className="example-block">
                                            <div className="example-header">
                                                <span>回應範例</span>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleCopy(endpoint.responseExample, `res-${endpoint.path}`)}
                                                >
                                                    {copiedSection === `res-${endpoint.path}` ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                            <pre className="code-block">{endpoint.responseExample}</pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 錯誤碼 */}
            <div className="card error-codes-card">
                <h2 className="section-title">⚠️ 錯誤碼說明</h2>
                <table className="error-codes-table">
                    <thead>
                        <tr>
                            <th>狀態碼</th>
                            <th>說明</th>
                            <th>處理方式</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code className="status-2xx">200</code></td>
                            <td>請求成功</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td><code className="status-4xx">400</code></td>
                            <td>請求參數錯誤</td>
                            <td>檢查請求內容是否符合格式</td>
                        </tr>
                        <tr>
                            <td><code className="status-4xx">401</code></td>
                            <td>認證失敗</td>
                            <td>檢查 API 金鑰是否正確且未過期</td>
                        </tr>
                        <tr>
                            <td><code className="status-4xx">403</code></td>
                            <td>權限不足</td>
                            <td>確認 API 金鑰具有所需的權限</td>
                        </tr>
                        <tr>
                            <td><code className="status-4xx">429</code></td>
                            <td>請求過於頻繁</td>
                            <td>降低請求頻率或提高速率限制</td>
                        </tr>
                        <tr>
                            <td><code className="status-5xx">500</code></td>
                            <td>伺服器錯誤</td>
                            <td>稍後重試，若持續發生請聯繫支援</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
