import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
    ClipboardList,
    GitCommit,
    Calendar,
    User,
    Clock,
    Filter,
    CheckCircle2,
    RefreshCw,
    Hash,
    GitBranch
} from 'lucide-react';

interface Commit {
    hash: string;
    shortHash: string;
    author: string;
    date: string;
    message: string;
    type: string;
    typeLabel: string;
}

interface VersionInfo {
    version: string;
    shortHash: string;
    displayVersion: string;
    lastCommitDate: string;
    lastCommitMessage: string;
    branch: string;
    commitCount: number;
}

export function Changelog() {
    const [version, setVersion] = useState<VersionInfo | null>(null);
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [versionData, historyData] = await Promise.all([
                    api.get<VersionInfo>('/version/current'),
                    api.get<{ commits: Commit[]; total: number }>('/version/history', { limit: 100 })
                ]);
                setVersion(versionData);
                setCommits(historyData.commits || []);
            } catch (error) {
                console.error('Failed to fetch changelog:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            'feat': 'success',
            'fix': 'error',
            'docs': 'accent',
            'style': 'warning',
            'refactor': 'primary',
            'perf': 'accent',
            'test': 'accent',
            'build': 'warning',
            'ci': 'primary',
            'chore': 'text-text-muted',
            'revert': 'error',
            'other': 'text-text-muted'
        };
        return colors[type] || 'text-text-muted';
    };

    const getTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            'feat': '✨',
            'fix': '🐛',
            'docs': '📚',
            'style': '💅',
            'refactor': '♻️',
            'perf': '⚡',
            'test': '🧪',
            'build': '📦',
            'ci': '🔄',
            'chore': '🔧',
            'revert': '⏪',
            'other': '📝'
        };
        return icons[type] || '📝';
    };

    const formatRelativeDate = (dateStr: string): string => {
        if (!dateStr || dateStr === 'unknown') return '未知時間';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '未知時間';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return '剛剛';
        if (diffMins < 60) return `${diffMins} 分鐘前`;
        if (diffHours < 24) return `${diffHours} 小時前`;
        if (diffDays < 7) return `${diffDays} 天前`;
        return date.toLocaleDateString('zh-TW');
    };

    const types = [
        { value: 'all', label: '全部' },
        { value: 'feat', label: '新功能' },
        { value: 'fix', label: '修復' },
        { value: 'refactor', label: '重構' },
        { value: 'docs', label: '文件' },
        { value: 'style', label: '樣式' },
        { value: 'perf', label: '效能' },
        { value: 'test', label: '測試' },
        { value: 'chore', label: '雜項' },
    ];

    const filteredCommits = filter === 'all'
        ? commits
        : commits.filter(c => c.type === filter);

    const groupedCommits = filteredCommits.reduce((groups, commit) => {
        let date = '未知日期';
        try {
            if (commit.date) {
                const d = new Date(commit.date);
                if (!isNaN(d.getTime())) {
                    date = d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
                }
            }
        } catch { /* ignore */ }

        if (!groups[date]) groups[date] = [];
        groups[date].push(commit);
        return groups;
    }, {} as Record<string, Commit[]>);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-md">
                <RefreshCw className="h-10 w-10 animate-spin text-color-primary" />
                <p className="text-text-muted animate-pulse">正在讀取系統更新日誌...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-lg animate-fade-in min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-md">
                <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                        <ClipboardList size={22} />
                    </div>
                    系統更新日誌
                </h1>
                <p className="text-text-muted">追蹤 NotifyHub 的每一次演進與修復</p>
            </div>

            {/* Version Hero */}
            {version && (
                <div className="card relative overflow-hidden border border-border-color bg-linear-to-br from-bg-card to-bg-tertiary/20 p-lg shadow-xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-color-primary">
                        <GitBranch size={160} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-lg">
                        <div className="flex flex-col gap-2">
                            <span className="text-[0.65rem] font-900 text-color-primary uppercase tracking-[0.3em]">Current Release</span>
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-4xl font-900 text-text-primary tracking-tighter tabular-nums">v{version.version || 'Dev'}</h2>
                                <span className="rounded bg-bg-secondary px-2 py-1 font-mono text-xs text-text-muted border border-border-color/50">{version.shortHash || 'HEAD'}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary bg-bg-secondary/50 rounded-full px-4 py-1 self-start border border-border-color/20">
                                <CheckCircle2 size={14} className="text-color-success" />
                                <span>{version.lastCommitMessage || 'No recent commits'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 border-l border-border-color-light/20 pl-0 md:pl-8">
                            <div className="flex flex-col">
                                <span className="text-xl font-800 text-text-primary tabular-nums">{version.commitCount}</span>
                                <span className="text-[0.6rem] font-700 text-text-muted uppercase tracking-wider">總提交次數</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-800 text-text-primary truncate max-w-[120px]">{version.branch || 'unknown'}</span>
                                <span className="text-[0.6rem] font-700 text-text-muted uppercase tracking-wider">活動分支</span>
                            </div>
                            <div className="flex flex-col col-span-2 lg:col-span-1">
                                <span className="text-xl font-800 text-text-primary whitespace-nowrap">{formatRelativeDate(version.lastCommitDate)}</span>
                                <span className="text-[0.6rem] font-700 text-text-muted uppercase tracking-wider">最後部署</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 rounded-full border border-border-color bg-bg-card p-1 shadow-md">
                    <div className="flex items-center gap-2 px-3 text-text-muted">
                        <Filter size={14} />
                    </div>
                    {types.map(t => (
                        <button
                            key={t.value}
                            className={`rounded-full px-4 py-1.5 text-xs font-800 transition-all uppercase tracking-tighter ${filter === t.value ? 'bg-color-primary text-white shadow-glow' : 'text-text-muted hover:text-text-primary'}`}
                            onClick={() => setFilter(t.value)}
                        >
                            {t.label}
                            {filter === t.value && (
                                <span className="ml-2 rounded-full bg-white/20 px-1.5 tabular-nums">
                                    {t.value === 'all' ? commits.length : commits.filter(c => c.type === t.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-10 mt-4">
                {Object.entries(groupedCommits).map(([date, dateCommits]) => (
                    <div key={date} className="relative pl-8 md:pl-0">
                        {/* Date Divider */}
                        <div className="flex items-center gap-4 mb-6 md:-ml-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-card border-2 border-border-color text-text-muted shadow-lg z-10">
                                <Calendar size={18} />
                            </div>
                            <div className="flex items-baseline gap-3">
                                <h3 className="text-md font-900 text-text-primary italic">{date}</h3>
                                <span className="text-[0.65rem] font-800 text-text-muted uppercase tracking-widest">{dateCommits.length} CHANGES</span>
                            </div>
                            <div className="hidden md:block h-px flex-1 bg-linear-to-r from-border-color-light/50 to-transparent" />
                        </div>

                        {/* Commits List */}
                        <div className="flex flex-col gap-4">
                            {dateCommits.map((commit, idx) => (
                                <div
                                    key={commit.hash}
                                    className="card group ml-2 md:ml-6 border border-border-color bg-bg-card p-md shadow-md transition-all hover:border-color-primary/30 hover:bg-bg-tertiary/10 animate-slide-up"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.65rem] font-900 border bg-bg-secondary uppercase tracking-tighter text-${getTypeColor(commit.type)}`}>
                                                    <span>{getTypeIcon(commit.type)}</span>
                                                    {commit.typeLabel}
                                                </span>
                                                <h4 className="text-sm font-800 text-text-primary leading-snug group-hover:text-color-primary-light transition-colors">{commit.message}</h4>
                                            </div>
                                            <div className="flex items-center gap-6 text-[0.7rem] text-text-muted font-600">
                                                <span className="flex items-center gap-1.5"><User size={12} /> {commit.author}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={12} /> {formatRelativeDate(commit.date)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary/50 border border-border-color-light/20 font-mono text-[0.65rem] text-text-muted">
                                                <Hash size={10} />
                                                {commit.shortHash}
                                            </div>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-text-muted opacity-0 group-hover:opacity-100 transition-all">
                                                <GitCommit size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline Path */}
                        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-linear-to-b from-border-color via-border-color/30 to-transparent -z-0" />
                    </div>
                ))}

                {filteredCommits.length === 0 && (
                    <div className="py-20 text-center opacity-40">
                        <span className="text-5xl block mb-4">🛸</span>
                        <p className="font-900 uppercase tracking-[0.2em]">Data stream empty</p>
                        <p className="text-sm">Try alternate time-line or filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}
