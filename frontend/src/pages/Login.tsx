import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export function Login() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 已登入則跳轉首頁
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const success = await login(username, password);

        if (!success) {
            setError('使用者名稱或密碼錯誤');
        }
        setIsSubmitting(false);
    };

    /*
    const fillDemo = (type: 'admin' | 'user') => {
        if (type === 'admin') {
            setUsername('admin');
            setPassword('admin123');
        } else {
            setUsername('user');
            setPassword('user123');
        }
    };
    */

    if (isLoading) {
        return (
            <div className="login-loading">
                <Loader2 size={32} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="login-page">
            {/* 背景動畫 */}
            <div className="login-bg">
                <div className="bg-gradient" />
                <div className="bg-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
            </div>

            {/* 登入卡片 */}
            <div className="login-card animate-slide-up">
                {/* Logo */}
                <div className="login-logo">
                    <div className="logo-icon-wrapper">
                        <img src="/icon.png" alt="NotifyHub" className="logo-img" />
                    </div>
                    <h1 className="logo-title">NotifyHub</h1>
                    <p className="logo-subtitle">通知管理中心</p>
                </div>

                {/* 登入表單 */}
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">使用者名稱</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                className="input"
                                placeholder="帳號名稱"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">密碼</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                登入中...
                            </>
                        ) : (
                            '登入'
                        )}
                    </button>
                </form>

                {/* Demo 帳號 */}
                {/* Demo 帳號 (隱藏)
                <div className="demo-accounts">
                    <p className="demo-title">快速填入測試帳號</p>
                    <div className="demo-buttons">
                        <button
                            type="button"
                            className="demo-btn admin"
                            onClick={() => fillDemo('admin')}
                        >
                            管理員
                        </button>
                        <button
                            type="button"
                            className="demo-btn user"
                            onClick={() => fillDemo('user')}
                        >
                            一般使用者
                        </button>
                    </div>
                </div>
                */}

                {/* 頁腳 */}
                <div className="login-footer">
                    <p>© 2024 NotifyHub. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
