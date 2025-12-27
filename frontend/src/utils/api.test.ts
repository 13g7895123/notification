import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('應該能正確執行 GET 請求', async () => {
        const mockData = { id: 1, name: '測試' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockData }),
        });

        const result = await api.get('/test');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/test'),
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            })
        );
        expect(result).toEqual(mockData);
    });

    it('請求時應該正確注入 Authorization Header', async () => {
        const token = 'fake-token';
        localStorage.setItem('notifyhub_auth', JSON.stringify({ token }));

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: {} }),
        });

        await api.get('/secure');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${token}`,
                }),
            })
        );
    });

    it('當 API 回傳失敗時應該拋出錯誤', async () => {
        const errorMessage = 'API 錯誤訊息';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({
                success: false,
                error: { code: 'BAD_REQUEST', message: errorMessage }
            }),
        });

        await expect(api.get('/error')).rejects.toThrow(errorMessage);
    });

    it('當收到 401 回應時應該清空 localStorage', async () => {
        localStorage.setItem('notifyhub_auth', JSON.stringify({ token: 'expired' }));

        // Mock window.location
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '', pathname: '/test' } as any;

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }
            }),
        });

        await expect(api.get('/secure')).rejects.toThrow();
        expect(localStorage.getItem('notifyhub_auth')).toBeNull();

        // Restore window.location
        window.location = originalLocation;
    });
});
