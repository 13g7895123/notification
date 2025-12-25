# 🔔 NotifyHub - 通知管理系統

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

NotifyHub 是一個現代化的多渠道通知管理系統，支援 LINE 和 Telegram 通知推送，提供完整的 API 介面讓您輕鬆整合到現有系統中。

---

##  專案結構

```
notification/
├── frontend/               # 前端應用程式
│   ├── src/               # React 原始碼
│   ├── public/            # 靜態資源
│   ├── docs/              # API 需求文件
│   └── package.json       # 前端依賴
├── backend/               # 後端 API（待開發）
└── README.md              # 專案說明
```

---

## 🚀 快速開始

### 前端開發

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開發伺服器預設運行於：http://localhost:5173

### 測試帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | admin@notifyhub.com | admin123 |
| 使用者 | user@notifyhub.com | user123 |

---

## � 文件

- [前端 README](./frontend/README.md) - 前端詳細說明
- [API 需求文件](./frontend/docs/API_REQUIREMENTS.md) - 後端 API 規格

---

## ✨ 功能

### 核心功能
- 📡 多渠道通知（LINE / Telegram）
- � 訊息模板管理
- ⏰ 即時/排程發送
- 📊 發送統計分析

### 管理功能
- 👥 使用者管理
- 🔑 API 金鑰管理
- 📈 API 使用監控
- 📋 發送紀錄追蹤

---

## � 授權

MIT License

---

<p align="center">Made with ❤️ by NotifyHub Team</p>
