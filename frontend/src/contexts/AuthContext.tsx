import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../utils/api';

// 擴展 User 類型，加入密碼和狀態 (管理員使用)
export interface UserWithAuth extends User {
    status: 'active' | 'inactive';
    createdAt: string;
    lastLoginAt?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => Promise<boolean>;

    // 使用者管理
    users: UserWithAuth[];
    fetchUsers: (params?: Record<string, string | number | boolean>) => Promise<void>;
    addUser: (user: Omit<UserWithAuth, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string }) => Promise<boolean>;
    updateUser: (id: string, updates: Partial<UserWithAuth> & { password?: string }) => Promise<boolean>;
    deleteUser: (id: string) => Promise<boolean>;
    toggleUserStatus: (id: string, status: 'active' | 'inactive') => Promise<boolean>;
    resetUserPassword: (id: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'notifyhub_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<UserWithAuth[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化時從 localStorage 恢復登入狀態，並向後端確認 Token 有效性
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // 先設定本地快取的用戶資訊
                setUser(parsed.user);

                // 向後端請求最新的用戶資料以確認 Token 有效
                api.get<User>('/auth/me')
                    .then(userData => {
                        setUser(userData);
                        // 更新快取
                        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: userData }));
                    })
                    .catch(() => {
                        // Token 無效，清空狀態
                        setUser(null);
                        localStorage.removeItem(STORAGE_KEY);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch {
                localStorage.removeItem(STORAGE_KEY);
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const data = await api.post<{ user: User; token: string }>('/auth/login', { username, password });
            setUser(data.user);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Login failed', error);
            setIsLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<User>) => {
        try {
            const updatedUser = await api.put<User>('/auth/profile', updates);
            setUser(updatedUser);
            // 更新 localStorage 中的 user 資訊，保留 token
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: updatedUser }));
            }
            return true;
        } catch (error) {
            console.error('Update profile failed', error);
            return false;
        }
    }, []);

    // 使用者管理功能
    const fetchUsers = useCallback(async (params?: Record<string, string | number | boolean>) => {
        try {
            const data = await api.get<{ users: UserWithAuth[]; total: number; page: number; limit: number }>('/users', params);
            // 根據 API.md，返回的是 { users: [], total, page, limit }
            setUsers(data.users);
        } catch (error) {
            console.error('Fetch users failed', error);
        }
    }, []);

    const addUser = useCallback(async (userData: Omit<UserWithAuth, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string }) => {
        try {
            await api.post('/users', userData);
            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Add user failed', error);
            return false;
        }
    }, [fetchUsers]);

    const updateUser = useCallback(async (id: string, updates: Partial<UserWithAuth> & { password?: string }) => {
        try {
            await api.put(`/users/${id}`, updates);
            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Update user failed', error);
            return false;
        }
    }, [fetchUsers]);

    const deleteUser = useCallback(async (id: string) => {
        if (user?.id === id) return false;
        try {
            await api.delete(`/users/${id}`);
            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Delete user failed', error);
            return false;
        }
    }, [user, fetchUsers]);

    const toggleUserStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
        if (user?.id === id) return false;
        try {
            await api.put(`/users/${id}/status`, { status });
            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Toggle user status failed', error);
            return false;
        }
    }, [user, fetchUsers]);

    const resetUserPassword = useCallback(async (id: string, newPassword: string) => {
        try {
            await api.put(`/users/${id}/password`, { newPassword });
            return true;
        } catch (error) {
            console.error('Reset password failed', error);
            return false;
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                isAdmin: user?.role === 'admin',
                login,
                logout,
                updateProfile,
                users,
                fetchUsers,
                addUser,
                updateUser,
                deleteUser,
                toggleUserStatus,
                resetUserPassword
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
