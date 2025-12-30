import { useState, useCallback } from 'react';
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
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import { useEscapeKey } from '../hooks/useEscapeKey';

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
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <FileText size={22} />
                        </div>
                        訊息模板
                    </h1>
                    <p className="mt-1 text-text-muted">建立和管理可重複使用的通知訊息模板</p>
                </div>
                <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={handleAddTemplate}
                >
                    <Plus size={18} />
                    新增模板
                </button>
            </div>

            {/* Templates List */}
            <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
                {templates.length === 0 ? (
                    <div className="card col-span-full py-20 text-center opacity-50">
                        <span className="text-4xl block mb-4">📝</span>
                        <h3 className="text-xl font-600 text-text-secondary">尚無訊息模板</h3>
                        <p className="mt-2 text-text-muted mb-6">建立模板可以快速套用常用的通知訊息格式</p>
                        <button className="btn btn-primary btn-sm mx-auto" onClick={handleAddTemplate}>
                            <Plus size={16} />
                            建立第一個模板
                        </button>
                    </div>
                ) : (
                    templates.map((template, index) => (
                        <div
                            key={template.id}
                            className="card group flex flex-col border border-border-color bg-bg-card transition-all hover:border-color-primary hover:shadow-glow animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between border-b border-border-color-light p-md">
                                <h3 className="truncate text-lg font-700 text-text-primary leading-tight">{template.name}</h3>
                                <div className="flex gap-1.5">
                                    {template.channelTypes.map(type => (
                                        <span key={type} className={`flex h-6 w-6 items-center justify-center rounded-full ${type === 'line' ? 'bg-color-line/20 text-color-line' : 'bg-color-telegram/20 text-color-telegram'}`}>
                                            {type === 'line' ? <MessageCircle size={14} /> : <SendIcon size={14} />}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 p-lg space-y-4">
                                <div>
                                    <h4 className="text-[0.7rem] font-700 text-text-muted uppercase tracking-wider mb-1">預覽標題</h4>
                                    <p className="text-sm font-600 text-text-primary truncate">{template.title}</p>
                                </div>
                                <div className="relative">
                                    <h4 className="text-[0.7rem] font-700 text-text-muted uppercase tracking-wider mb-1">內容預覽</h4>
                                    <p className="line-clamp-3 text-sm text-text-secondary leading-relaxed bg-bg-tertiary/10 rounded-md p-2 border border-border-color/20">
                                        {template.content}
                                    </p>
                                </div>
                                {template.variables.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {template.variables.map(v => (
                                            <code key={v} className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[0.65rem] text-color-primary-light border border-border-color/30">
                                                {`{{${v}}}`}
                                            </code>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto border-t border-border-color-light p-md flex items-center justify-between">
                                <span className="text-[0.7rem] text-text-muted">
                                    更新於 {format(new Date(template.updatedAt), 'yyyy/MM/dd', { locale: zhTW })}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="btn h-8 w-8 p-0 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                                        onClick={() => handleDuplicate(template)}
                                        title="複製"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        className="btn h-8 w-8 p-0 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                                        onClick={() => handleEditTemplate(template)}
                                        title="編輯"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn h-8 w-8 p-0 text-color-error/70 hover:bg-color-error/10 hover:text-color-error"
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

function TemplateModal({ template, onClose, onSave }: any) {
    const [name, setName] = useState(template?.name || '');
    const [title, setTitle] = useState(template?.title || '');
    const [content, setContent] = useState(template?.content || '');
    const [channelTypes, setChannelTypes] = useState<ChannelType[]>(
        template?.channelTypes || ['line', 'telegram']
    );
    const [variablesInput, setVariablesInput] = useState(
        template?.variables.join(', ') || ''
    );

    const handleClose = useCallback(() => onClose(), [onClose]);
    useEscapeKey(handleClose);

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

    const extractVariables = () => {
        const matches = content.match(/\{\{(\w+)\}\}/g);
        if (matches) {
            const vars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
            const uniqueVars = [...new Set(vars)];
            setVariablesInput(uniqueVars.join(', '));
            toast.success('已自動提取變數');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">{template ? '編輯模板' : '新增模板'}</h2>
                    <button className="text-text-muted hover:text-text-primary" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto p-lg space-y-6">
                    <div className="input-group">
                        <label className="input-label font-600">模板名稱</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如：系統維護通知"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label font-600">適用渠道</label>
                        <div className="flex gap-md">
                            {[
                                { type: 'line', label: 'LINE', icon: MessageCircle, color: 'color-line' },
                                { type: 'telegram', label: 'Telegram', icon: SendIcon, color: 'color-telegram' }
                            ].map((item: any) => (
                                <button
                                    key={item.type}
                                    type="button"
                                    className={`flex flex-1 items-center justify-center gap-sm rounded-lg border p-3 font-600 transition-all ${channelTypes.includes(item.type) ? `border-${item.color} bg-${item.color}/10 text-white shadow-glow` : 'border-border-color bg-bg-tertiary text-text-muted opacity-50'}`}
                                    onClick={() => toggleChannelType(item.type)}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label font-600">通知標題</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="通知標題"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label font-600 flex justify-between">
                            通知內容
                            <span className="text-[0.7rem] text-text-muted font-normal lowercase tracking-normal">使用 {`{{變數名}}`} 插入動態內容</span>
                        </label>
                        <textarea
                            className="input min-h-[140px] resize-none"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="請輸入內容..."
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[0.875rem] font-600 text-text-secondary">變數列表</label>
                            <button
                                type="button"
                                className="text-[0.75rem] font-600 text-color-primary-light hover:underline"
                                onClick={extractVariables}
                            >
                                從內容提取
                            </button>
                        </div>
                        <input
                            type="text"
                            className="input font-mono"
                            value={variablesInput}
                            onChange={e => setVariablesInput(e.target.value)}
                            placeholder="如：date, time (逗號分隔)"
                        />
                        <span className="text-[0.7rem] text-text-muted mt-1 italic">這些變數可在發送時動態替換</span>
                    </div>

                    <div className="flex gap-md pt-4">
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary flex-1">{template ? '儲存變更' : '建立模板'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
