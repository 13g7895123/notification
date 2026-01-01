/**
 * 日期與時間格式化工具
 * 
 * 提供安全的日期格式化函數，避免 Invalid time value 錯誤
 */

import { format, formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

/**
 * 安全地格式化日期字串
 * @param dateStr - 日期字串
 * @param formatStr - 日期格式（如 'yyyy/MM/dd HH:mm:ss'）
 * @param fallback - 無效日期時的預設值
 * @returns 格式化後的日期字串
 */
export function safeFormatDate(
    dateStr: string | Date | null | undefined,
    formatStr: string,
    fallback: string = '-'
): string {
    if (!dateStr) return fallback;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return fallback;
        return format(date, formatStr, { locale: zhTW });
    } catch {
        return fallback;
    }
}

/**
 * 安全地格式化日期字串（無 locale）
 * @param dateStr - 日期字串
 * @param formatStr - 日期格式
 * @param fallback - 無效日期時的預設值
 * @returns 格式化後的日期字串
 */
export function safeFormatDateSimple(
    dateStr: string | Date | null | undefined,
    formatStr: string,
    fallback: string = '-'
): string {
    if (!dateStr) return fallback;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return fallback;
        return format(date, formatStr);
    } catch {
        return fallback;
    }
}

/**
 * 安全地計算相對時間（如「3 分鐘前」）
 * @param dateStr - 日期字串
 * @param fallback - 無效日期時的預設值
 * @returns 相對時間字串
 */
export function safeFormatDistanceToNow(
    dateStr: string | Date | null | undefined,
    fallback: string = '-'
): string {
    if (!dateStr) return fallback;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return fallback;
        return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    } catch {
        return fallback;
    }
}

/**
 * 檢查日期是否有效
 * @param dateStr - 日期字串
 * @returns 是否為有效日期
 */
export function isValidDate(dateStr: string | Date | null | undefined): boolean {
    if (!dateStr) return false;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return !isNaN(date.getTime());
    } catch {
        return false;
    }
}

/**
 * 檢查日期是否已過期
 * @param dateStr - 日期字串
 * @returns 是否已過期
 */
export function isExpired(dateStr: string | Date | null | undefined): boolean {
    if (!dateStr) return false;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return false;
        return date < new Date();
    } catch {
        return false;
    }
}

/**
 * 格式化日期用於表單輸入（yyyy-MM-dd）
 * @param dateStr - 日期字串
 * @returns 表單格式的日期字串
 */
export function formatForDateInput(dateStr: string | Date | null | undefined): string {
    return safeFormatDateSimple(dateStr, 'yyyy-MM-dd', '');
}

/**
 * 格式化日期時間用於表單輸入（yyyy-MM-dd'T'HH:mm）
 * @param dateStr - 日期字串
 * @returns 表單格式的日期時間字串
 */
export function formatForDateTimeInput(dateStr: string | Date | null | undefined): string {
    return safeFormatDateSimple(dateStr, "yyyy-MM-dd'T'HH:mm", '');
}

// 常用格式化預設
export const DateFormats = {
    /** 完整日期時間：2024/01/15 14:30:45 */
    FULL: 'yyyy/MM/dd HH:mm:ss',
    /** 日期時間：2024/01/15 14:30 */
    DATETIME: 'yyyy/MM/dd HH:mm',
    /** 僅日期：2024/01/15 */
    DATE: 'yyyy/MM/dd',
    /** 短日期：01/15 */
    SHORT_DATE: 'MM/dd',
    /** 時間：14:30:45 */
    TIME: 'HH:mm:ss',
    /** 短時間：14:30 */
    SHORT_TIME: 'HH:mm',
    /** 短日期時間：01/15 14:30 */
    SHORT_DATETIME: 'MM/dd HH:mm',
    /** 短日期完整時間：01/15 14:30:45 */
    SHORT_DATE_FULL_TIME: 'MM/dd HH:mm:ss',
} as const;
