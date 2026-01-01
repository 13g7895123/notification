import { useState } from 'react';
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    Copy,
    X,
    MessageCircle,
    Send as SendIcon
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { NotificationTemplate, ChannelType } from '../types';
import { safeFormatDate, DateFormats } from '../utils/dateUtils';
import { toast, confirm } from '../utils/alert';
import './Templates.css';

export function Templates() {
    const { templates, addTemplate, updateTemplate, deleteTemplate } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

    const handleAddTemplate = () => {
        setEditingTemplate(null);
        setShowModal(true);
    };

    const handleEditTemplate = (template: NotificationTemplate) => {
        setEditingTemplate(template);
        setShowModal(true);
    };

    const handleDeleteTemplate = async (template: NotificationTemplate) => {
        const confirmed = await confirm.delete(template.name);
        if (confirmed) {
            deleteTemplate(template.id);
            toast.success(`模板「${template.name}」已刪除`);
        }
    };

    const handleDuplicate = (template: NotificationTemplate) => {
        addTemplate({
            name: `${template.name} (複製)`,
            title: template.title,
            content: template.content,
            channelTypes: template.channelTypes,
            variables: template.variables
        });
        toast.success(`已複製模板「${template.name}」`);
    };

    return (
        <div className="templates-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <FileText size={22} />
                        </div>
                        訊息模板
                    </h1>
                    <p className="page-description">
                        建立和管理可重複使用的通知訊息模板
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-lg" onClick={handleAddTemplate}>
                        <Plus size={18} />
                        新增模板
                    </button>
                </div>
            </div>

            {/* 模板列表 */}
            <div className="templates-grid">
                {templates.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">📝</div>
                        <h3 className="empty-state-title">尚無訊息模板</h3>
                        <p className="empty-state-description">
                            建立模板可以快速套用常用的通知訊息格式
                        </p>
                        <button className="btn btn-primary" onClick={handleAddTemplate}>
                            <Plus size={16} />
                            建立第一個模板
                        </button>
                    </div>
                ) : (
                    templates.map((template, index) => (
                        <div
                            key={template.id}
                            className="template-card card animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="template-header">
                                <h3 className="template-name">{template.name}</h3>
                                <div className="template-channels">
                                    {template.channelTypes.map(type => (
                                        <span key={type} className={`channel-icon ${type}`}>
                                            {type === 'line' ? <MessageCircle size={14} /> : <SendIcon size={14} />}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="template-preview">
                                <h4 className="template-title">{template.title}</h4>
                                <p className="template-content">{template.content}</p>
                            </div>

                            {template.variables.length > 0 && (
                                <div className="template-variables">
                                    <span className="variables-label">變數：</span>
                                    {template.variables.map(v => (
                                        <code key={v} className="variable-tag">{`{{${v}}}`}</code>
                                    ))}
                                </div>
                            )}

                            <div className="template-footer">
                                <span className="template-date">
                                    更新於 {safeFormatDate(template.updatedAt, DateFormats.DATE)}
                                </span>
                                <div className="template-actions">
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleDuplicate(template)}
                                        title="複製"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleEditTemplate(template)}
                                        title="編輯"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon text-error"
                                        onClick={() => handleDeleteTemplate(template)}
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

            {/* Modal */}
            {showModal && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        if (editingTemplate) {
                            updateTemplate(editingTemplate.id, data);
                        } else {
                            addTemplate(data as Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>);
                        }
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}

interface TemplateModalProps {
    template: NotificationTemplate | null;
    onClose: () => void;
    onSave: (data: Partial<NotificationTemplate>) => void;
}

function TemplateModal({ template, onClose, onSave }: TemplateModalProps) {
    const [name, setName] = useState(template?.name || '');
    const [title, setTitle] = useState(template?.title || '');
    const [content, setContent] = useState(template?.content || '');
    const [channelTypes, setChannelTypes] = useState<ChannelType[]>(
        template?.channelTypes || ['line', 'telegram']
    );
    const [variablesInput, setVariablesInput] = useState(
        template?.variables.join(', ') || ''
    );

    const toggleChannelType = (type: ChannelType) => {
        setChannelTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const variables = variablesInput
            .split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);

        onSave({
            name,
            title,
            content,
            channelTypes,
            variables
        });
    };

    // 從內容中自動提取變數
    const extractVariables = () => {
        const matches = content.match(/\{\{(\w+)\}\}/g);
        if (matches) {
            const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
            const uniqueVars = [...new Set(vars)];
            setVariablesInput(uniqueVars.join(', '));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal template-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{template ? '編輯模板' : '新增模板'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* 模板名稱 */}
                    <div className="input-group">
                        <label className="input-label">模板名稱</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如：系統維護通知"
                            required
                        />
                    </div>

                    {/* 適用渠道 */}
                    <div className="input-group">
                        <label className="input-label">適用渠道</label>
                        <div className="channel-type-selector">
                            <button
                                type="button"
                                className={`channel-type-btn line ${channelTypes.includes('line') ? 'active' : ''}`}
                                onClick={() => toggleChannelType('line')}
                            >
                                <MessageCircle size={16} />
                                LINE
                            </button>
                            <button
                                type="button"
                                className={`channel-type-btn telegram ${channelTypes.includes('telegram') ? 'active' : ''}`}
                                onClick={() => toggleChannelType('telegram')}
                            >
                                <SendIcon size={16} />
                                Telegram
                            </button>
                        </div>
                    </div>

                    {/* 標題 */}
                    <div className="input-group">
                        <label className="input-label">通知標題</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="通知標題"
                            required
                        />
                    </div>

                    {/* 內容 */}
                    <div className="input-group">
                        <label className="input-label">
                            通知內容
                            <span className="label-hint">使用 {`{{變數名}}`} 插入動態內容</span>
                        </label>
                        <textarea
                            className="input textarea"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="請輸入通知內容，可使用 {{變數名}} 插入動態內容"
                            required
                            rows={5}
                        />
                    </div>

                    {/* 變數 */}
                    <div className="input-group">
                        <div className="input-label-row">
                            <label className="input-label">變數列表</label>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={extractVariables}
                            >
                                自動提取
                            </button>
                        </div>
                        <input
                            type="text"
                            className="input"
                            value={variablesInput}
                            onChange={e => setVariablesInput(e.target.value)}
                            placeholder="以逗號分隔，例如：date, time, message"
                        />
                        <span className="input-hint">這些變數可在發送時動態替換</span>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {template ? '儲存變更' : '建立模板'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
