import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-primary text-color-primary">
                <Loader2 size={40} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary p-md px-lg">
            {/* Background Orbs */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-[10%] top-[10%] h-96 w-96 rounded-full bg-color-primary/10 blur-[120px] animate-pulse"></div>
                <div className="absolute right-[10%] bottom-[10%] h-96 w-96 rounded-full bg-color-accent/10 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-color-primary/5 blur-[150px]"></div>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
                <div className="card rounded-2xl border border-border-color bg-bg-card/40 p-10 shadow-2xl backdrop-blur-xl">
                    {/* Logo */}
                    <div className="mb-10 flex flex-col items-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-color-primary to-color-accent p-2 shadow-glow">
                            <img src="/icon.png" alt="NotifyHub" className="h-full w-full object-contain" />
                        </div>
                        <h1 className="bg-linear-to-br from-white to-text-secondary bg-clip-text text-3xl font-800 tracking-tight text-transparent">NotifyHub</h1>
                        <p className="mt-2 text-sm font-500 tracking-widest text-text-muted uppercase">通知管理中心</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {error && (
                            <div className="flex items-center gap-sm rounded-lg border border-error/50 bg-error/10 px-md py-3 text-sm text-color-error-light animate-shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-[0.85rem] font-600 text-text-secondary ml-1">使用者名稱</label>
                            <div className="group relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-color-primary-light" />
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-border-color bg-bg-input px-12 py-3.5 text-[0.95rem] text-text-primary transition-all focus:border-color-primary focus:bg-bg-tertiary focus:ring-4 focus:ring-color-primary-glow"
                                    placeholder="輸入帳號"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[0.85rem] font-600 text-text-secondary ml-1">密碼</label>
                            <div className="group relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-color-primary-light" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full rounded-xl border border-border-color bg-bg-input px-12 py-3.5 text-[0.95rem] text-text-primary transition-all focus:border-color-primary focus:bg-bg-tertiary focus:ring-4 focus:ring-color-primary-glow"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn mt-4 h-14 w-full bg-linear-to-r from-color-primary to-color-primary-dark text-[1rem] font-700 text-white shadow-lg transition-all hover:shadow-glow translate-y-0 active:translate-y-1 disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>驗證中...</span>
                                </div>
                            ) : (
                                '登入系統'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center text-[0.75rem] text-text-muted">
                        <p>© {new Date().getFullYear()} NotifyHub. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
