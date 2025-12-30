import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface VersionInfo {
    version: string;
    shortHash: string;
    displayVersion: string;
    lastCommitDate: string;
    lastCommitMessage: string;
    branch: string;
    commitCount: number;
}

export function Footer() {
    const [version, setVersion] = useState<VersionInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const data = await api.get<VersionInfo>('/version/current');
                setVersion(data);
            } catch (error) {
                console.error('Failed to fetch version:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVersion();
    }, []);

    return (
        <footer className="border-t border-border-color bg-bg-secondary p-md md:px-lg">
            <div className="flex flex-col items-center justify-between gap-md md:flex-row">
                <div className="flex items-center gap-md">
                    <span className="flex items-center gap-sm font-600 text-color-primary-light">
                        <span className="text-[1.2rem]">🔔</span>
                        NotifyHub
                    </span>
                    <span className="hidden text-text-muted md:inline">•</span>
                    <span className="text-[0.75rem] text-text-muted">
                        © {new Date().getFullYear()} All rights reserved.
                    </span>
                </div>

                <div className="flex items-center">
                    {loading ? (
                        <span className="flex items-center gap-sm text-[0.75rem] text-text-muted">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-color-primary"></span>
                            載入版本...
                        </span>
                    ) : version ? (
                        <Link to="/changelog" className="flex items-center gap-sm rounded-full border border-border-color bg-bg-tertiary px-md py-1 text-[0.75rem] transition-all hover:border-color-primary hover:bg-bg-hover" title={`最後更新: ${version.lastCommitMessage}`}>
                            <span className="grayscale-100 group-hover:grayscale-0">🏷️</span>
                            <span className="font-600 text-text-primary">
                                v{version.version}
                            </span>
                            <span className="font-mono text-text-muted">
                                ({version.shortHash})
                            </span>
                            <span className="text-color-primary-light">→</span>
                        </Link>
                    ) : (
                        <span className="flex items-center gap-sm rounded-full border border-error/30 bg-error/10 px-md py-1 text-[0.75rem] text-color-error-light">
                            <span>⚠️</span>
                            版本未知
                        </span>
                    )}
                </div>
            </div>
        </footer>
    );
}
