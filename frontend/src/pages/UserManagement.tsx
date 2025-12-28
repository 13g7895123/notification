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
    XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserWithAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast, confirm } from '../utils/alert';
import './UserManagement.css';

export function UserManagement() {
    const { user, isAdmin, users, fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithAuth | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showPasswordModal, setShowPasswordModal] = useState<UserWithAuth | null>(null);

    // 初始化獲取使用者資料
    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, fetchUsers]);

    // 非管理員無法存取
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
        const newStatus = u.status === 'active' ? '停用' : '啟用';
        const confirmed = await confirm.action(
            `確定要${newStatus}「${u.username}」嗎？`,
            `${newStatus}使用者`
        );
        if (confirmed) {
            const nextStatus = u.status === 'active' ? 'inactive' : 'active';
            toggleUserStatus(u.id, nextStatus);
            toast.success(`已${newStatus}「${u.username}」`);
        }
    };

    const adminCount = users.filter(u => u.role === 'admin').length;
    const activeCount = users.filter(u => u.status === 'active').length;

    return (
        <div className="user-management-page">
            {/* 頁面標題 */}
            <div className="page-header">
                <div className="page-title-section">
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <Users size={22} />
                        </div>
                        使用者管理
                    </h1>
                    <p className="page-description">
                        管理系統使用者帳號和權限
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-lg" onClick={handleAddUser}>
                        <Plus size={18} />
                        新增使用者
                    </button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="user-stats">
                <div className="user-stat-card">
                    <div className="stat-icon total">
                        <Users size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">總使用者數</span>
                    </div>
                </div>
                <div className="user-stat-card">
                    <div className="stat-icon admin">
                        <Shield size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{adminCount}</span>
                        <span className="stat-label">管理員</span>
                    </div>
                </div>
                <div className="user-stat-card">
                    <div className="stat-icon active">
                        <CheckCircle size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{activeCount}</span>
                        <span className="stat-label">啟用中</span>
                    </div>
                </div>
                <div className="user-stat-card">
                    <div className="stat-icon inactive">
                        <XCircle size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{users.length - activeCount}</span>
                        <span className="stat-label">已停用</span>
                    </div>
                </div>
            </div>

            {/* 篩選器 */}
            <div className="user-filters card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜尋使用者名稱或 Email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <select
                        className="input select"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                    >
                        <option value="all">所有角色</option>
                        <option value="admin">管理員</option>
                        <option value="user">一般使用者</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="input select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    >
                        <option value="all">所有狀態</option>
                        <option value="active">啟用中</option>
                        <option value="inactive">已停用</option>
                    </select>
                </div>

                <div className="filter-stats">
                    <span>顯示 {filteredUsers.length} 位使用者</span>
                </div>
            </div>

            {/* 使用者列表 */}
            <div className="users-list">
                {filteredUsers.length === 0 ? (
                    <div className="empty-state card">
                        <div className="empty-state-icon">👤</div>
                        <h3 className="empty-state-title">沒有找到使用者</h3>
                        <p className="empty-state-description">
                            {search || roleFilter !== 'all' || statusFilter !== 'all'
                                ? '嘗試調整篩選條件'
                                : '尚無使用者資料'}
                        </p>
                    </div>
                ) : (
                    <div className="table-container card">
                        <table className="table users-table">
                            <thead>
                                <tr>
                                    <th>使用者</th>
                                    <th>角色</th>
                                    <th>狀態</th>
                                    <th>建立時間</th>
                                    <th>最後登入</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u, index) => (
                                    <tr key={u.id} className={`animate-slide-up ${u.id === user?.id ? 'current-user' : ''}`} style={{ animationDelay: `${index * 30}ms` }}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-info-cell">
                                                    <span className="user-name-cell">
                                                        {u.username}
                                                        {u.id === user?.id && <span className="current-badge">( 目前使用者 )</span>}
                                                    </span>
                                                    <span className="user-email-cell">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${u.role}`}>
                                                {u.role === 'admin' ? (
                                                    <><Shield size={12} /> 管理員</>
                                                ) : (
                                                    <><User size={12} /> 使用者</>
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`status-toggle ${u.status}`}
                                                onClick={() => handleToggleStatus(u)}
                                                disabled={u.id === user?.id}
                                            >
                                                <span className="status-dot" />
                                                {u.status === 'active' ? '啟用中' : '已停用'}
                                            </button>
                                        </td>
                                        <td className="date-cell">
                                            {format(new Date(u.createdAt), 'yyyy/MM/dd', { locale: zhTW })}
                                        </td>
                                        <td className="date-cell">
                                            {u.lastLoginAt
                                                ? format(new Date(u.lastLoginAt), 'MM/dd HH:mm', { locale: zhTW })
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => setShowPasswordModal(u)}
                                                    title="重設密碼"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => handleEditUser(u)}
                                                    title="編輯"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-icon text-error"
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
                    </div>
                )}
            </div>

            {/* 新增/編輯 Modal */}
            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSave={(data) => {
                        if (editingUser) {
                            updateUser(editingUser.id, data);
                        } else {
                            addUser(data as Omit<UserWithAuth, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string });
                        }
                        setShowModal(false);
                    }}
                />
            )}

            {/* 重設密碼 Modal */}
            {showPasswordModal && (
                <PasswordModal
                    user={showPasswordModal}
                    onClose={() => setShowPasswordModal(null)}
                    onSave={(newPassword) => {
                        resetUserPassword(showPasswordModal.id, newPassword);
                        setShowPasswordModal(null);
                    }}
                />
            )}
        </div>
    );
}

interface UserModalProps {
    user: UserWithAuth | null;
    onClose: () => void;
    onSave: (data: Partial<UserWithAuth>) => void;
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>(user?.role || 'user');
    const [status, setStatus] = useState<'active' | 'inactive'>(user?.status || 'active');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: Partial<UserWithAuth> & { password?: string } = {
            username,
            email,
            role,
            status
        };

        if (!user || password) {
            data.password = password;
        }

        onSave(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal user-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? '編輯使用者' : '新增使用者'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* 使用者名稱 */}
                    <div className="input-group">
                        <label className="input-label">
                            <User size={14} />
                            使用者名稱
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="輸入使用者名稱"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="input-group">
                        <label className="input-label">
                            <Mail size={14} />
                            電子郵件
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="輸入電子郵件"
                            required
                        />
                    </div>

                    {/* 密碼 */}
                    <div className="input-group">
                        <label className="input-label">
                            <Lock size={14} />
                            {user ? '密碼（留空則不變更）' : '密碼'}
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={user ? '留空則不變更' : '輸入密碼'}
                                required={!user}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* 角色 */}
                    <div className="input-group">
                        <label className="input-label">
                            <Shield size={14} />
                            角色
                        </label>
                        <div className="role-selector">
                            <label className={`role-option ${role === 'user' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={role === 'user'}
                                    onChange={() => setRole('user')}
                                />
                                <User size={18} />
                                <div>
                                    <span className="role-title">一般使用者</span>
                                    <span className="role-desc">可使用通知發送功能</span>
                                </div>
                            </label>
                            <label className={`role-option ${role === 'admin' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={() => setRole('admin')}
                                />
                                <Shield size={18} />
                                <div>
                                    <span className="role-title">管理員</span>
                                    <span className="role-desc">完整系統管理權限</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 狀態 */}
                    <div className="input-group">
                        <label className="input-label">啟用狀態</label>
                        <div className="flex items-center gap-md">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={status === 'active'}
                                    onChange={e => setStatus(e.target.checked ? 'active' : 'inactive')}
                                />
                                <span className="switch-slider" />
                            </label>
                            <span className={`status-text ${status}`}>
                                {status === 'active' ? '啟用' : '停用'}
                            </span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {user ? '儲存變更' : '建立使用者'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface PasswordModalProps {
    user: UserWithAuth;
    onClose: () => void;
    onSave: (newPassword: string) => void;
}

function PasswordModal({ user, onClose, onSave }: PasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            setError('密碼長度至少需要 6 個字元');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('兩次輸入的密碼不一致');
            return;
        }

        onSave(newPassword);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal password-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>重設密碼</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="password-user-info">
                        <div className="user-avatar-sm">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="user-name">{user.username}</span>
                            <span className="user-email">{user.email}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">新密碼</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={newPassword}
                                onChange={e => {
                                    setNewPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="輸入新密碼"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">確認新密碼</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="input"
                            value={confirmPassword}
                            onChange={e => {
                                setConfirmPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="再次輸入新密碼"
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            重設密碼
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
