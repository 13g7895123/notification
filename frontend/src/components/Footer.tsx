import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './Footer.css';

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
                // api.get 已經處理了 BASE_URL，返回的直接是 data
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
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-left">
                    <span className="footer-brand">
                        <span className="brand-icon">🔔</span>
                        NotifyHub
                    </span>
                    <span className="footer-separator">•</span>
                    <span className="footer-copyright">
                        © {new Date().getFullYear()} All rights reserved.
                    </span>
                </div>

                <div className="footer-right">
                    {loading ? (
                        <span className="version-loading">
                            <span className="loading-dot"></span>
                            載入版本...
                        </span>
                    ) : version ? (
                        <Link to="/changelog" className="version-badge" title={`最後更新: ${version.lastCommitMessage}`}>
                            <span className="version-icon">🏷️</span>
                            <span className="version-text">
                                v{version.version}
                            </span>
                            <span className="version-hash">
                                {version.shortHash}
                            </span>
                            <span className="version-arrow">→</span>
                        </Link>
                    ) : (
                        <span className="version-badge error">
                            <span className="version-icon">⚠️</span>
                            版本未知
                        </span>
                    )}
                </div>
            </div>
        </footer>
    );
}
