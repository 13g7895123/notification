import Swal from 'sweetalert2';

// 自訂主題樣式
const customClass = {
    popup: 'swal-popup',
    title: 'swal-title',
    htmlContainer: 'swal-html',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    actions: 'swal-actions'
};

// 成功提示
export const toast = {
    success: (message: string, title?: string) => {
        return Swal.fire({
            icon: 'success',
            title: title || '成功',
            text: message,
            timer: 2000,
            showConfirmButton: false,
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass
        });
    },

    error: (message: string, title?: string) => {
        return Swal.fire({
            icon: 'error',
            title: title || '錯誤',
            text: message,
            background: '#1a1a2e',
            color: '#f8fafc',
            confirmButtonColor: '#6366f1',
            customClass
        });
    },

    warning: (message: string, title?: string) => {
        return Swal.fire({
            icon: 'warning',
            title: title || '警告',
            text: message,
            background: '#1a1a2e',
            color: '#f8fafc',
            confirmButtonColor: '#6366f1',
            customClass
        });
    },

    info: (message: string, title?: string) => {
        return Swal.fire({
            icon: 'info',
            title: title || '提示',
            text: message,
            background: '#1a1a2e',
            color: '#f8fafc',
            confirmButtonColor: '#6366f1',
            customClass
        });
    },

    loading: (message: string = '處理中...') => {
        return Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }
};

// 確認對話框
export const confirm = {
    danger: async (message: string, title?: string): Promise<boolean> => {
        const result = await Swal.fire({
            icon: 'warning',
            title: title || '確認操作',
            text: message,
            showCancelButton: true,
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass
        });
        return result.isConfirmed;
    },

    action: async (message: string, title?: string, confirmText: string = '確定'): Promise<boolean> => {
        const result = await Swal.fire({
            icon: 'question',
            title: title || '確認',
            text: message,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: '取消',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#64748b',
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass
        });
        return result.isConfirmed;
    },

    logout: async (): Promise<boolean> => {
        const result = await Swal.fire({
            icon: 'question',
            title: '登出確認',
            text: '確定要登出嗎？',
            showCancelButton: true,
            confirmButtonText: '登出',
            cancelButtonText: '取消',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass
        });
        return result.isConfirmed;
    },

    delete: async (itemName: string): Promise<boolean> => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '刪除確認',
            html: `確定要刪除 <strong>${itemName}</strong> 嗎？<br><small style="color: #94a3b8;">此操作無法復原</small>`,
            showCancelButton: true,
            confirmButtonText: '刪除',
            cancelButtonText: '取消',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass
        });
        return result.isConfirmed;
    }
};

// 輸入對話框
export const input = {
    text: async (title: string, placeholder?: string): Promise<string | null> => {
        const result = await Swal.fire({
            title,
            input: 'text',
            inputPlaceholder: placeholder || '',
            showCancelButton: true,
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#64748b',
            background: '#1a1a2e',
            color: '#f8fafc',
            customClass,
            inputValidator: (value) => {
                if (!value) {
                    return '請輸入內容';
                }
                return null;
            }
        });
        return result.isConfirmed ? result.value : null;
    }
};

// 關閉 loading
export const closeLoading = () => {
    Swal.close();
};

export default Swal;
