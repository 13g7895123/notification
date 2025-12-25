# 🔔 NotifyHub - 通知管理系統

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/CodeIgniter-4.4-orange?logo=codeigniter" alt="CodeIgniter" />
  <img src="https://img.shields.io/badge/MariaDB-10.11-blue?logo=mariadb" alt="MariaDB" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" alt="Docker" />
</p>

NotifyHub 是一個現代化的多渠道通知管理系統，支援 LINE 和 Telegram 通知推送。

---

## 📁 專案結構

```
notification/
├── frontend/               # React 前端應用
│   ├── src/
│   ├── docs/               # API 需求文件
│   └── Dockerfile
├── backend/                # CodeIgniter 4 後端 API
│   ├── app/
│   └── Dockerfile
├── docker/
│   └── mariadb/init/       # 資料庫初始化腳本
├── docker-compose.yml      # Docker Compose 配置
├── deploy.sh               # 藍綠部署腳本
├── .env.example            # 環境變數範例
└── README.md
```

---

## 🚀 快速開始

### 1. 複製環境變數

```bash
cp .env.example .env
```

### 2. 啟動服務

```bash
# 啟動所有服務（前端 Blue + 後端 + MariaDB + phpMyAdmin）
docker compose up -d

# 啟動包含 Green 版本
docker compose --profile green up -d
```

### 3. 存取服務

| 服務 | 位址 | 說明 |
|------|------|------|
| 前端 (Blue) | http://localhost:3001 | 活躍版本 |
| 前端 (Green) | http://localhost:3002 | 待命版本 |
| 後端 API | http://localhost:8080 | CodeIgniter 4 |
| phpMyAdmin | http://localhost:8081 | 資料庫管理 |

---

## 🔄 藍綠部署

### 部署流程

```bash
# 1. 建構新版本到 Green
./deploy.sh build green

# 2. 測試 Green 版本 (http://localhost:3002)

# 3. 切換到 Green 版本
./deploy.sh switch green

# 4. 如需回滾
./deploy.sh rollback
```

### 部署指令

| 指令 | 說明 |
|------|------|
| `./deploy.sh build [blue\|green]` | 建構指定版本 |
| `./deploy.sh switch [blue\|green]` | 切換活躍版本 |
| `./deploy.sh status` | 顯示服務狀態 |
| `./deploy.sh rollback` | 回滾到前一版本 |

---

## ⚙️ Port 配置

所有對外 Port 統一在 `.env` 管理：

```env
# 前端 (藍綠部署)
FRONTEND_BLUE_PORT=3001
FRONTEND_GREEN_PORT=3002

# 後端 API
BACKEND_PORT=8080

# phpMyAdmin
PHPMYADMIN_PORT=8081
```

---

## 🗄️ 資料庫

### 預設帳號

| 使用者 | 密碼 |
|--------|------|
| root | notifyhub_root_2024 |
| notifyhub | notifyhub_db_2024 |

### 連線資訊

```
Host: localhost (容器內使用 mariadb)
Port: 3306 (僅內部)
Database: notifyhub
```

---

## 🔐 測試帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | admin@notifyhub.com | password |
| 使用者 | user@notifyhub.com | password |

> ⚠️ 生產環境請務必更改密碼！

---

## 📚 文件

- [前端 README](./frontend/README.md)
- [API 需求文件](./frontend/docs/API_REQUIREMENTS.md)

---

## 🛠️ 開發模式

### 前端開發

```bash
cd frontend
npm install
npm run dev
```

### 後端開發

後端需要在 Docker 環境運行，或本機安裝 PHP 8.3 + Composer：

```bash
cd backend
composer install
php spark serve
```

---

## 📄 授權

MIT License

---

<p align="center">Made with ❤️ by NotifyHub Team</p>
