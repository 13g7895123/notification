import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

// 擴展 User 類型，加入密碼和狀態
export interface UserWithAuth extends User {
    password: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    lastLoginAt?: Date;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => void;

    // 使用者管理
    users: UserWithAuth[];
    addUser: (user: Omit<UserWithAuth, 'id' | 'createdAt'>) => void;
    updateUser: (id: string, updates: Partial<UserWithAuth>) => void;
    deleteUser: (id: string) => void;
    toggleUserStatus: (id: string) => void;
    resetUserPassword: (id: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 初始模擬用戶資料
const initialUsers: UserWithAuth[] = [
    {
        id: '1',
        username: 'Admin',
        email: 'admin@notifyhub.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date('2024-12-25T10:30:00')
    },
    {
        id: '2',
        username: 'User',
        email: 'user@notifyhub.com',
        password: 'user123',
        role: 'user',
        status: 'active',
        createdAt: new Date('2024-03-15'),
        lastLoginAt: new Date('2024-12-24T16:45:00')
    },
    {
        id: '3',
        username: '張小明',
        email: 'xiaoming@example.com',
        password: 'password123',
        role: 'user',
        status: 'active',
        createdAt: new Date('2024-06-20'),
        lastLoginAt: new Date('2024-12-20T09:00:00')
    },
    {
        id: '4',
        username: '李大華',
        email: 'dahua@example.com',
        password: 'password123',
        role: 'user',
        status: 'inactive',
        createdAt: new Date('2024-08-10')
    },
    {
        id: '5',
        username: 'DevOps Team',
        email: 'devops@notifyhub.com',
        password: 'devops123',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2024-02-01'),
        lastLoginAt: new Date('2024-12-25T08:00:00')
    }
];

const STORAGE_KEY = 'notifyhub_auth';
const USERS_STORAGE_KEY = 'notifyhub_users';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<UserWithAuth[]>(() => {
        const stored = localStorage.getItem(USERS_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.map((u: UserWithAuth) => ({
                    ...u,
                    createdAt: new Date(u.createdAt),
                    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined
                }));
            } catch {
                return initialUsers;
            }
        }
        return initialUsers;
    });
    const [isLoading, setIsLoading] = useState(true);

    // 儲存使用者列表到 localStorage
    useEffect(() => {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }, [users]);

    // 初始化時從 localStorage 恢復登入狀態
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);

        // 模擬 API 延遲
        await new Promise(resolve => setTimeout(resolve, 1000));

        const found = users.find(u => u.email === email && u.password === password && u.status === 'active');

        if (found) {
            const userData: User = {
                id: found.id,
                username: found.username,
                email: found.email,
                role: found.role,
                avatar: found.avatar
            };
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            // 更新最後登入時間
            setUsers(prev => prev.map(u =>
                u.id === found.id ? { ...u, lastLoginAt: new Date() } : u
            ));

            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    }, [users]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const updateProfile = useCallback((updates: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 使用者管理功能
    const addUser = useCallback((userData: Omit<UserWithAuth, 'id' | 'createdAt'>) => {
        const newUser: UserWithAuth = {
            ...userData,
            id: Date.now().toString(),
            createdAt: new Date()
        };
        setUsers(prev => [...prev, newUser]);
    }, []);

    const updateUser = useCallback((id: string, updates: Partial<UserWithAuth>) => {
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, ...updates } : u
        ));
    }, []);

    const deleteUser = useCallback((id: string) => {
        // 不能刪除自己
        if (user?.id === id) return;
        setUsers(prev => prev.filter(u => u.id !== id));
    }, [user]);

    const toggleUserStatus = useCallback((id: string) => {
        // 不能停用自己
        if (user?.id === id) return;
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
        ));
    }, [user]);

    const resetUserPassword = useCallback((id: string, newPassword: string) => {
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, password: newPassword } : u
        ));
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

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
