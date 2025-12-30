import { useState } from 'react';
import {
    Book,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Shield,
    Globe
} from 'lucide-react';

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

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <Book size={22} />
                        </div>
                        API 文件開發指南
                    </h1>
                    <p className="mt-1 text-text-muted">透過 API 程式化發送通知、讀取數據</p>
                </div>
            </div>

            {/* Quick Start Card */}
            <div className="card border border-border-color bg-bg-card shadow-lg p-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-color-primary">
                    <Globe size={120} />
                </div>
                <h2 className="text-xl font-800 text-text-primary mb-8 flex items-center gap-2">
                    <span className="text-color-primary">🚀</span> 快速集成步驟
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-10">
                    {[
                        { step: '1', title: '獲取金鑰', desc: '在 API 金鑰頁面建立 Access Key' },
                        { step: '2', title: '設定 Header', desc: 'Header 加入 X-API-Key: YOUR_KEY' },
                        { step: '3', title: '發送請求', desc: '發送 JSON 格式請求到 API' }
                    ].map((s, i) => (
                        <div key={i} className="flex gap-md group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-color-primary/10 text-lg font-900 text-color-primary border border-color-primary/20 group-hover:scale-110 transition-transform">
                                {s.step}
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-800 text-text-primary">{s.title}</h4>
                                <p className="text-sm text-text-muted">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl bg-bg-secondary p-lg border border-border-color/30 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.65rem] font-900 text-color-primary uppercase tracking-[0.2em]">CURL 認證範例</span>
                        <button
                            className="flex items-center gap-2 rounded bg-bg-tertiary px-3 py-1.5 text-xs font-700 text-text-secondary hover:text-white transition-colors"
                            onClick={() => handleCopy(`curl -X POST https://${window.location.host}/api/v1/send \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "測試", "content": "Hello World"}'`, 'auth')}
                        >
                            {copiedSection === 'auth' ? <Check size={14} className="text-color-success" /> : <Copy size={14} />}
                            {copiedSection === 'auth' ? '已複製' : '點擊複製'}
                        </button>
                    </div>
                    <pre className="font-mono text-sm leading-relaxed text-text-secondary overflow-x-auto whitespace-pre">
                        {`curl -X POST https://${window.location.host}/api/v1/send \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "測試", "content": "Hello World"}'`}
                    </pre>
                </div>
            </div>

            {/* Endpoints */}
            <div className="card border border-border-color bg-bg-card p-0 shadow-lg overflow-hidden">
                <div className="px-lg py-md border-b border-border-color-light flex items-center justify-between bg-bg-tertiary/20">
                    <h2 className="text-lg font-800 text-text-primary flex items-center gap-2 uppercase tracking-wider">
                        <Shield size={20} className="text-color-primary" /> API 端點詳解
                    </h2>
                </div>
                <div className="divide-y divide-border-color-light/50">
                    {endpoints.map(endpoint => (
                        <div key={endpoint.path} className="flex flex-col">
                            <button
                                className={`flex items-center justify-between p-lg text-left transition-all hover:bg-bg-tertiary/10 ${expandedEndpoint === endpoint.path ? 'bg-bg-tertiary/20' : ''}`}
                                onClick={() => setExpandedEndpoint(expandedEndpoint === endpoint.path ? null : endpoint.path)}
                            >
                                <div className="flex items-center gap-lg">
                                    <div className={`rounded-sm px-2 py-0.5 text-[0.7rem] font-900 border ${endpoint.method === 'POST' ? 'border-color-primary/40 text-color-primary bg-color-primary/5' : 'border-color-accent/40 text-color-accent bg-color-accent/5'}`}>
                                        {endpoint.method}
                                    </div>
                                    <code className="text-sm font-mono text-text-primary bg-bg-tertiary/50 px-2 py-0.5 rounded">{endpoint.path}</code>
                                    <span className="text-sm text-text-secondary hidden md:block">{endpoint.description}</span>
                                </div>
                                {expandedEndpoint === endpoint.path ? <ChevronDown size={20} className="text-text-muted" /> : <ChevronRight size={20} className="text-text-muted" />}
                            </button>

                            {expandedEndpoint === endpoint.path && (
                                <div className="px-lg pb-lg bg-bg-tertiary/5 space-y-8 animate-slide-down">
                                    <div className="flex items-center gap-md border-t border-border-color-light/30 pt-md">
                                        <span className="text-[0.7rem] font-800 text-text-muted uppercase">所需權限:</span>
                                        <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs font-700 text-color-primary-light border border-border-color/30">{endpoint.permission}</span>
                                    </div>

                                    {endpoint.requestBody && (
                                        <div className="space-y-4">
                                            <h4 className="text-[0.7rem] font-900 text-text-muted uppercase tracking-[0.2em] border-l-2 border-color-primary pl-2">請求參數</h4>
                                            <div className="overflow-x-auto rounded-lg border border-border-color-light/50">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-bg-tertiary/30">
                                                        <tr className="text-[0.65rem] font-800 uppercase text-text-muted border-b border-border-color-light/50">
                                                            <th className="px-md py-2">參數</th>
                                                            <th className="px-md py-2">類型</th>
                                                            <th className="px-md py-2">必填</th>
                                                            <th className="px-md py-2">說明</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border-color-light/30 text-xs">
                                                        {endpoint.requestBody.fields.map(field => (
                                                            <tr key={field.name} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-md py-2 font-mono text-color-primary-light">{field.name}</td>
                                                                <td className="px-md py-2 text-text-muted italic">{field.type}</td>
                                                                <td className="px-md py-2">{field.required ? '✓' : '-'}</td>
                                                                <td className="px-md py-2 text-text-secondary">{field.description}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-4 rounded-lg bg-bg-secondary p-lg border border-border-color/30 overflow-hidden">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[0.65rem] font-800 text-text-muted italic">Payload 範例</span>
                                                    <button onClick={() => handleCopy(endpoint.requestBody!.example, `req-${endpoint.path}`)}>{copiedSection === `req-${endpoint.path}` ? <Check size={14} className="text-color-success" /> : <Copy size={14} className="text-text-muted hover:text-white transition-colors" />}</button>
                                                </div>
                                                <pre className="font-mono text-xs leading-relaxed text-text-secondary">{endpoint.requestBody.example}</pre>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h4 className="text-[0.7rem] font-900 text-text-muted uppercase tracking-[0.2em] border-l-2 border-color-accent pl-2">回應格式</h4>
                                        <div className="rounded-lg bg-bg-secondary p-lg border border-border-color/30 overflow-hidden">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[0.65rem] font-800 text-text-muted italic">JSON 範例</span>
                                                <button onClick={() => handleCopy(endpoint.responseExample, `res-${endpoint.path}`)}>{copiedSection === `res-${endpoint.path}` ? <Check size={14} className="text-color-success" /> : <Copy size={14} className="text-text-muted hover:text-white transition-colors" />}</button>
                                            </div>
                                            <pre className="font-mono text-xs leading-relaxed text-text-secondary">{endpoint.responseExample}</pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Error Table */}
            <div className="card border border-border-color bg-bg-card p-0 shadow-lg overflow-hidden">
                <div className="px-lg py-md border-b border-border-color-light bg-bg-tertiary/20">
                    <h2 className="text-lg font-800 text-text-primary uppercase tracking-wider italic">⚠️ 狀態碼說明彙總</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-bg-tertiary/10 text-[0.7rem] font-800 uppercase text-text-muted border-b border-border-color-light/50">
                                <th className="px-lg py-3">Code</th>
                                <th className="px-lg py-3">狀態說明</th>
                                <th className="px-lg py-3">後續處理建議</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color-light/30">
                            {[
                                { code: '200', desc: '請求成功', action: '-', color: 'color-success' },
                                { code: '400', desc: '參數錯誤', action: '檢查 JSON 格式或欄位缺失', color: 'color-warning' },
                                { code: '401', desc: '認證失敗', action: '金鑰無效或 Header 缺失', color: 'color-error' },
                                { code: '403', desc: '權限不足', action: '金鑰未授予對應存取權限', color: 'color-error' },
                                { code: '429', desc: '超出限額', action: '稍後再試或提高速率限制', color: 'color-accent' }
                            ].map((err, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className={`px-lg py-4 font-mono font-900 text-${err.color}`}>{err.code}</td>
                                    <td className="px-lg py-4 font-700 text-text-primary">{err.desc}</td>
                                    <td className="px-lg py-4 text-text-secondary italic">{err.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
