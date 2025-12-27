/**
 * API 請求工具
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const STORAGE_KEY = 'notifyhub_auth';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

class ApiClient {
    private async request<T = any>(
        endpoint: string,
        method: string = 'GET',
        body?: any,
        headers: Record<string, string> = {}
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        // 取得 Token
        const stored = localStorage.getItem(STORAGE_KEY);
        let token = '';
        if (stored) {
            try {
                const authData = JSON.parse(stored);
                token = authData.token || '';
            } catch (e) {
                console.error('Failed to parse auth data', e);
            }
        }

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers,
            },
        };

        if (token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);
            const result: ApiResponse<T> = await response.json();

            if (!result.success) {
                const error = new Error(result.error?.message || '未知錯誤');
                (error as any).code = result.error?.code || 'UNKNOWN_ERROR';
                (error as any).details = result.error?.details;
                (error as any).status = response.status;
                throw error;
            }

            return result.data as T;
        } catch (error) {
            if ((error as any).status === 401) {
                // Token 過期或無效，清空登入狀態
                localStorage.removeItem(STORAGE_KEY);
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
            throw error;
        }
    }

    public get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>) {
        let url = endpoint;
        if (params) {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query.append(key, String(value));
                }
            });
            url += `?${query.toString()}`;
        }
        return this.request<T>(url, 'GET');
    }

    public post<T = any>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, 'POST', body);
    }

    public put<T = any>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, 'PUT', body);
    }

    public delete<T = any>(endpoint: string) {
        return this.request<T>(endpoint, 'DELETE');
    }

    public patch<T = any>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, 'PATCH', body);
    }
}

export const api = new ApiClient();
