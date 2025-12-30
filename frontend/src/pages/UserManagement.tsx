import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    Shield,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserWithAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';

export function UserManagement() {
    const { user, isAdmin, users, fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithAuth | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showPasswordModal, setShowPasswordModal] = useState<UserWithAuth | null>(null);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, fetchUsers]);

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleAddUser = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const handleEditUser = (u: UserWithAuth) => {
        setEditingUser(u);
        setShowModal(true);
    };

    const handleDeleteUser = async (u: UserWithAuth) => {
        if (u.id === user?.id) {
            toast.warning('無法刪除自己的帳號');
            return;
        }
        const confirmed = await confirm.delete(u.username);
        if (confirmed) {
            deleteUser(u.id);
            toast.success(`使用者「${u.username}」已刪除`);
        }
    };

    const handleToggleStatus = async (u: UserWithAuth) => {
        if (u.id === user?.id) {
            toast.warning('無法停用自己的帳號');
            return;
        }
        const newStatusText = u.status === 'active' ? '停用' : '啟用';
        const confirmed = await confirm.action(
            `確定要${newStatusText}「${u.username}」嗎？`,
            `${newStatusText}使用者`
        );
        if (confirmed) {
            const nextStatus = u.status === 'active' ? 'inactive' : 'active';
            toggleUserStatus(u.id, nextStatus);
            toast.success(`已${newStatusText}「${u.username}」`);
        }
    };

    const adminCount = users.filter(u => u.role === 'admin').length;
    const activeCount = users.filter(u => u.status === 'active').length;

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-md text-2xl font-700 text-text-primary">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-color-primary/20 text-color-primary-light">
                            <Users size={22} />
                        </div>
                        使用者管理
                    </h1>
                    <p className="mt-1 text-text-muted">管理系統使用者帳號與權限分配</p>
                </div>
                <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={handleAddUser}
                >
                    <Plus size={18} />
                    新增使用者
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
                {[
                    { label: '總使用者', value: users.length, icon: Users, color: 'primary' },
                    { label: '管理員', value: adminCount, icon: Shield, color: 'accent' },
                    { label: '啟用中', value: activeCount, icon: CheckCircle, color: 'success' },
                    { label: '已停用', value: users.length - activeCount, icon: XCircle, color: 'error' }
                ].map((item, i) => (
                    <div key={i} className="card flex items-center gap-md border border-border-color bg-bg-card p-md shadow-lg">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-color-${item.color}/20 text-color-${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-700 text-text-primary leading-tight">{item.value}</span>
                            <span className="text-[0.7rem] font-600 text-text-muted uppercase tracking-wider">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card flex flex-col gap-md lg:flex-row lg:items-center border border-border-color bg-bg-card p-md shadow-lg">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        className="input pl-12"
                        placeholder="搜尋使用者名稱或 Email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-md">
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <select
                            className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as any)}
                        >
                            <option value="all">所有角色</option>
                            <option value="admin">管理員</option>
                            <option value="user">一般使用者</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-md rounded-lg border border-border-color bg-bg-tertiary/20 p-1 px-3">
                        <select
                            className="bg-transparent py-2 text-[0.875rem] font-600 text-text-secondary focus:outline-none"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">所有狀態</option>
                            <option value="active">啟用中</option>
                            <option value="inactive">已停用</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* User List Table */}
            <div className="card h-full min-h-[400px] border border-border-color bg-bg-card p-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="py-20 text-center opacity-50">
                            <span className="text-4xl block mb-2">👤</span>
                            <p>找不符合條件的使用者</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-color bg-bg-tertiary/20">
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest whitespace-nowrap">使用者資訊</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest whitespace-nowrap">角色</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest whitespace-nowrap">狀態</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest whitespace-nowrap">建立日期</th>
                                    <th className="px-lg py-md text-[0.7rem] font-800 text-text-muted uppercase tracking-widest whitespace-nowrap">最後登入</th>
                                    <th className="px-lg py-md w-0"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color-light/50">
                                {filteredUsers.map((u, idx) => (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-bg-tertiary/10 transition-colors animate-slide-up ${u.id === user?.id ? 'bg-color-primary/[0.03]' : ''}`}
                                        style={{ animationDelay: `${idx * 20}ms` }}
                                    >
                                        <td className="px-lg py-md">
                                            <div className="flex items-center gap-md">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-color-primary to-color-accent text-white font-900 shadow-lg uppercase">
                                                    {u.username.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-700 text-text-primary flex items-center gap-2 truncate">
                                                        {u.username}
                                                        {u.id === user?.id && <span className="rounded bg-color-primary/20 px-1.5 py-0.5 text-[0.6rem] text-color-primary-light font-900 uppercase">You</span>}
                                                    </span>
                                                    <span className="text-xs text-text-muted truncate">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-lg py-md">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-800 border ${u.role === 'admin' ? 'border-color-accent/30 bg-color-accent/10 text-color-accent' : 'border-text-secondary/30 bg-bg-tertiary text-text-secondary'}`}>
                                                {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                {u.role === 'admin' ? '管理員' : '一般使用者'}
                                            </span>
                                        </td>
                                        <td className="px-lg py-md">
                                            <button
                                                className={`flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-800 transition-all ${u.status === 'active' ? 'border-success/30 bg-success/10 text-color-success' : 'border-error/30 bg-error/10 text-color-error'} ${u.id === user?.id ? 'cursor-not-allowed opacity-80' : 'hover:scale-105 active:scale-95'}`}
                                                onClick={() => handleToggleStatus(u)}
                                                disabled={u.id === user?.id}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-color-success shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-color-error shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                                                {u.status === 'active' ? '運作中' : '已停用'}
                                            </button>
                                        </td>
                                        <td className="px-lg py-md whitespace-nowrap text-[0.75rem] text-text-muted font-mono">
                                            {format(new Date(u.createdAt), 'yyyy/MM/dd')}
                                        </td>
                                        <td className="px-lg py-md whitespace-nowrap text-[0.75rem] text-text-muted font-mono">
                                            {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MM/dd HH:mm') : '-'}
                                        </td>
                                        <td className="px-lg py-md">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="btn h-8 w-8 p-0 text-text-muted hover:bg-bg-tertiary hover:text-text-primary" onClick={() => setShowPasswordModal(u)} title="重設密碼"><RefreshCw size={16} /></button>
                                                <button className="btn h-8 w-8 p-0 text-text-muted hover:bg-bg-tertiary hover:text-text-primary" onClick={() => handleEditUser(u)} title="編輯"><Edit2 size={16} /></button>
                                                <button
                                                    className="btn h-8 w-8 p-0 text-color-error/60 hover:bg-error/10 hover:text-color-error disabled:opacity-30 disabled:cursor-not-allowed"
                                                    onClick={() => handleDeleteUser(u)}
                                                    disabled={u.id === user?.id}
                                                    title="刪除"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModal && <UserModal user={editingUser} onClose={() => setShowModal(false)} onSave={(data: any) => {
                editingUser ? updateUser(editingUser.id, data) : addUser(data);
                setShowModal(false);
            }} />}

            {showPasswordModal && <PasswordModal user={showPasswordModal} onClose={() => setShowPasswordModal(null)} onSave={(newPassword: string) => {
                resetUserPassword(showPasswordModal.id, newPassword);
                setShowPasswordModal(null);
            }} />}
        </div>
    );
}

function UserModal({ user, onClose, onSave }: any) {
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>(user?.role || 'user');
    const [status, setStatus] = useState<'active' | 'inactive'>(user?.status || 'active');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">{user ? '編輯使用者' : '新增使用者'}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form className="p-lg space-y-6" onSubmit={(e) => { e.preventDefault(); onSave({ username, email, password, role, status }); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div className="input-group">
                            <label className="input-label font-600 flex items-center gap-2"><User size={14} /> 使用者名稱</label>
                            <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                        </div>
                        <div className="input-group">
                            <label className="input-label font-600 flex items-center gap-2"><Mail size={14} /> 電子郵件</label>
                            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label font-600 flex items-center gap-2"><Lock size={14} /> {user ? '重設密碼 (留空則不變更)' : '登入密碼'}</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="input pr-12" value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? '••••••••' : 'Password'} required={!user} />
                            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label font-600 mb-3">權限角色設定</label>
                        <div className="flex gap-md">
                            {[
                                { val: 'user', label: '一般使用者', desc: '可發送通知', icon: User },
                                { val: 'admin', label: '管理員', desc: '完全控制權', icon: Shield }
                            ].map((r: any) => (
                                <button
                                    key={r.val}
                                    type="button"
                                    className={`flex flex-1 items-start gap-md rounded-lg border p-4 text-left transition-all ${role === r.val ? 'border-color-primary bg-color-primary/10' : 'border-border-color bg-bg-tertiary/20 opacity-50'}`}
                                    onClick={() => setRole(r.val)}
                                >
                                    <div className={`mt-0.5 rounded p-1.5 ${role === r.val ? 'bg-color-primary text-white' : 'bg-bg-tertiary text-text-muted'}`}>
                                        <r.icon size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-800 ${role === r.val ? 'text-color-primary-light' : 'text-text-secondary'}`}>{r.label}</span>
                                        <span className="text-[0.7rem] text-text-muted leading-tight">{r.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-color-light/50 pt-4">
                        <div className="flex items-center gap-md">
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" className="peer sr-only" checked={status === 'active'} onChange={e => setStatus(e.target.checked ? 'active' : 'inactive')} />
                                <div className="h-6 w-11 rounded-full bg-border-color transition-all peer-checked:bg-color-primary after:absolute after:top-[2px] after:left-[2px] after:h-5 after:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                            <span className="text-sm font-700 text-text-secondary">帳號啟用狀態</span>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" className="btn btn-secondary px-8" onClick={onClose}>取消</button>
                            <button type="submit" className="btn btn-primary px-8">{user ? '更新' : '創建'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PasswordModal({ user, onClose, onSave }: any) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) return setError('密碼長度至少需要 6 個字元');
        if (newPassword !== confirmPassword) return setError('兩次使用的密碼不一致');
        onSave(newPassword);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-md">
            <div className="absolute inset-0 bg-bg-overlay/80" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between border-b border-border-color-light p-lg">
                    <h2 className="text-xl font-700 text-text-primary">重設使用者密碼</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form className="p-lg space-y-6" onSubmit={handleSubmit}>
                    <div className="flex items-center gap-md rounded-lg bg-bg-tertiary/50 p-4 border border-border-color/30">
                        <div className="h-12 w-12 rounded-full bg-color-primary/20 flex items-center justify-center font-900 text-color-primary">{user.username.charAt(0)}</div>
                        <div className="flex flex-col"><span className="font-800 text-text-primary">{user.username}</span><span className="text-xs text-text-muted">{user.email}</span></div>
                    </div>
                    {error && <div className="flex items-center gap-2 rounded border border-error/30 bg-error/10 p-3 text-xs text-color-error font-700"><AlertTriangle size={14} />{error}</div>}
                    <div className="space-y-4">
                        <div className="input-group">
                            <label className="input-label font-600">新密碼</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} className="input pr-12" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} placeholder="New Password" required />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label font-600">確認新密碼</label>
                            <input type={showPassword ? 'text' : 'password'} className="input" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Confirm Password" required />
                        </div>
                    </div>
                    <div className="flex gap-md pt-4">
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary flex-1">重設密碼</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
