import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './Changelog.css';

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
                // api.get 已經處理了 BASE_URL，返回的直接是 data
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
            'docs': 'info',
            'style': 'warning',
            'refactor': 'primary',
            'perf': 'accent',
            'test': 'info',
            'build': 'warning',
            'ci': 'primary',
            'chore': 'muted',
            'revert': 'error',
            'other': 'muted'
        };
        return colors[type] || 'muted';
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

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatRelativeDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return '剛剛';
        if (diffMins < 60) return `${diffMins} 分鐘前`;
        if (diffHours < 24) return `${diffHours} 小時前`;
        if (diffDays < 7) return `${diffDays} 天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
        return `${Math.floor(diffDays / 365)} 年前`;
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

    // 按日期分組
    const groupedCommits = filteredCommits.reduce((groups, commit) => {
        const date = new Date(commit.date).toLocaleDateString('zh-TW');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(commit);
        return groups;
    }, {} as Record<string, Commit[]>);

    if (loading) {
        return (
            <div className="changelog-page">
                <div className="loading-screen">
                    <div className="animate-spin">⏳</div>
                    <p>載入更新歷史中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="changelog-page">
            {/* 頁面標題 */}
            <header className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <span className="page-title-icon">📋</span>
                        更新日誌
                    </h1>
                    <p className="page-description">
                        查看系統的所有更新記錄與版本歷史
                    </p>
                </div>
            </header>

            {/* 當前版本資訊 */}
            {version && (
                <div className="version-hero card">
                    <div className="version-hero-content">
                        <div className="version-hero-main">
                            <span className="version-hero-label">當前版本</span>
                            <span className="version-hero-number">v{version.version}</span>
                            <span className="version-hero-hash">{version.shortHash}</span>
                        </div>
                        <div className="version-hero-stats">
                            <div className="version-stat">
                                <span className="version-stat-value">{version.commitCount}</span>
                                <span className="version-stat-label">提交次數</span>
                            </div>
                            <div className="version-stat">
                                <span className="version-stat-value">{version.branch}</span>
                                <span className="version-stat-label">分支</span>
                            </div>
                            <div className="version-stat">
                                <span className="version-stat-value">{formatRelativeDate(version.lastCommitDate)}</span>
                                <span className="version-stat-label">最後更新</span>
                            </div>
                        </div>
                    </div>
                    <div className="version-hero-message">
                        <span className="message-icon">💬</span>
                        <span className="message-text">{version.lastCommitMessage}</span>
                    </div>
                </div>
            )}

            {/* 過濾器 */}
            <div className="changelog-filters">
                <div className="filter-tabs">
                    {types.map(type => (
                        <button
                            key={type.value}
                            className={`filter-tab ${filter === type.value ? 'active' : ''}`}
                            onClick={() => setFilter(type.value)}
                        >
                            {type.value !== 'all' && <span className="filter-icon">{getTypeIcon(type.value)}</span>}
                            {type.label}
                            {type.value === filter && (
                                <span className="filter-count">
                                    {type.value === 'all' ? commits.length : commits.filter(c => c.type === type.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 提交歷史 */}
            <div className="changelog-timeline">
                {Object.entries(groupedCommits).map(([date, dateCommits]) => (
                    <div key={date} className="timeline-group">
                        <div className="timeline-date">
                            <span className="date-icon">📅</span>
                            {date}
                            <span className="date-count">{dateCommits.length} 項更新</span>
                        </div>
                        <div className="timeline-commits">
                            {dateCommits.map((commit, index) => (
                                <div
                                    key={commit.hash}
                                    className="commit-card"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="commit-header">
                                        <span className={`commit-type type-${getTypeColor(commit.type)}`}>
                                            <span className="type-icon">{getTypeIcon(commit.type)}</span>
                                            {commit.typeLabel}
                                        </span>
                                        <span className="commit-hash" title={commit.hash}>
                                            {commit.shortHash}
                                        </span>
                                    </div>
                                    <p className="commit-message">{commit.message}</p>
                                    <div className="commit-meta">
                                        <span className="commit-author">
                                            <span className="author-icon">👤</span>
                                            {commit.author}
                                        </span>
                                        <span className="commit-time" title={formatDate(commit.date)}>
                                            <span className="time-icon">🕒</span>
                                            {formatRelativeDate(commit.date)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredCommits.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3 className="empty-state-title">沒有找到相關更新</h3>
                        <p className="empty-state-description">
                            目前沒有符合篩選條件的更新記錄
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
