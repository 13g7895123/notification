# NotifyHub Vanilla CSS Style Guide

本文件定義系統核心 CSS 變數，開發新功能時請務必遵守以下命名規範，嚴禁隨意更改 `index.css`。

## 🎨 核心變數 (Core Variables)

### 🧱 背景色 (Backgrounds)
- `var(--bg-primary)`: #0f0f23 (最深底色)
- `var(--bg-secondary)`: #1a1a2e (區塊色)
- `var(--bg-tertiary)`: #16213e (強調區塊)
- `var(--bg-card)`: 卡片底色 (含 blur)
- `var(--bg-input)`: 輸入框色

### 📝 文字色 (Typography)
- `var(--text-primary)`: #f8fafc (主文字)
- `var(--text-secondary)`: #94a3b8 (副標題)
- `var(--text-muted)`: #64748b (提示文字)

### 🌈 狀態色 (States)
- `var(--color-primary)`: #6366f1 (品牌主色)
- `var(--color-success)`: #10b981 (成功/線上)
- `var(--color-error)`: #ef4444 (錯誤/斷線)
- `var(--color-warning)`: #f59e0b (警告)

### 📏 間距與佈局 (Spacing & Layout)
- `var(--spacing-xs)` 到 `var(--spacing-xl)` (4px, 8px, 16px, 24px, 32px)
- `var(--radius-md)` (10px - 標準圓角)
- `var(--sidebar-width)` (280px)

## 🚫 禁忌與規範

1.  **嚴禁使用 Tailwind 類名**：不要在 TSX 中使用 `p-4`, `flex-1`, `text-blue-500` 等。
2.  **變數存取**：一律使用 `var()`，禁止在組件細部 CSS 中直接寫死色碼碼 (如 `#ffffff`)。
3.  **命名一致性**：不要使用 `--color-bg-primary`，請統一使用 `--bg-primary`。

---
*Last Updated: 2025-12-31*
