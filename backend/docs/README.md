# 📚 NotifyHub Backend 文件

歡迎使用 NotifyHub 後端！這裡是所有文件的索引頁面。

---

## 文件列表

| 文件 | 說明 |
|------|------|
| [🚀 快速開始](./QUICKSTART.md) | 5 分鐘快速上手指南 |
| [🔌 API 文件](./API.md) | 完整的 API 規格說明 |
| [🏗️ 架構說明](./ARCHITECTURE.md) | 系統架構與設計說明 |
| [🗄️ 資料庫結構](./DATABASE.md) | 資料表結構與 ER 圖 |

---

## 快速連結

### 開發環境

```bash
# 啟動服務
docker compose up -d

# 查看日誌
docker compose logs -f backend

# 執行 Seeder
docker compose exec backend php spark db:seed AdminSeeder
```

### 測試 API

```bash
# 健康檢查
curl http://localhost:9208/

# 登入
curl -X POST http://localhost:9208/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}'
```

### 預設帳號

| Email | 密碼 | 角色 |
|-------|------|------|
| admin@notifyhub.com | admin123 | admin |
| user@notifyhub.com | admin123 | user |

---

## 技術棧

- **框架：** CodeIgniter 4.6.4
- **語言：** PHP 8.3
- **資料庫：** MariaDB 10.11
- **認證：** JWT (firebase/php-jwt)
- **容器化：** Docker

---

## 專案結構

```
backend/
├── app/
│   ├── Controllers/    # API 控制器
│   ├── Services/       # 業務邏輯
│   ├── Repositories/   # 資料存取
│   ├── Entities/       # 資料模型
│   ├── Filters/        # 中介層
│   └── Config/         # 設定檔
├── docs/               # 文件
├── public/             # Web 入口
└── writable/           # 可寫目錄
```

---

## 需要幫助？

- 📖 閱讀 [快速開始](./QUICKSTART.md) 了解基本操作
- 🔌 查閱 [API 文件](./API.md) 了解 API 規格
- 🏗️ 查看 [架構說明](./ARCHITECTURE.md) 了解系統設計

---

*最後更新：2024-12-26*
