# 🔔 NotifyHub - 通知管理系統

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/CodeIgniter-4.4-orange?logo=codeigniter" alt="CodeIgniter" />
  <img src="https://img.shields.io/badge/MariaDB-10.11-blue?logo=mariadb" alt="MariaDB" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" alt="Docker" />
</p>

NotifyHub 是一個現代化的多渠道通知管理系統，採用 React 前端與 CodeIgniter 4 後端 API，並 implementing 完整的藍綠部署架構。

---

## 📁 專案結構

```
notification/
├── frontend/               # React 前端應用
├── backend/                # CodeIgniter 4 後端 API
├── docker/                 # Docker 配置與腳本
│   ├── backend/            # 後端 Entrypoint 與權限設定
│   └── frontend-proxy/     # Nginx 藍綠切換配置
├── docker-compose.yml      # 服務編排
├── deploy.sh               # 藍綠部署腳本
├── .env.example            # 環境變數範例
└── README.md
```

---

## 🚀 快速開始

### 1. 初始化設定

```bash
# 複製設定檔
cp .env.example .env
```

### 2. 啟動服務

```bash
# 啟動所有服務
docker compose --profile green up -d
```

系統會自動執行初始化流程：
- ✅ 啟動 MariaDB 資料庫
- ✅ 安裝後端 PHP 依賴 (Composer)
- ✅ 設定 `writable` 目錄權限
- ✅ 啟動 CI4 `spark serve` 服務 (CLI Mode)

### 3. 初始化資料庫

```bash
# 執行資料庫 migration（建立資料表結構）
docker compose exec backend php spark migrate

# 建立預設帳號
docker compose exec backend php spark db:seed AdminSeeder
```

### 4. 存取服務

| 服務 | URL | 說明 |
|------|-----|------|
| **前端入口** | http://localhost:3000 | 自動導向至活躍版本 (Blue/Green) |
| **Blue 版本** | http://localhost:3000/blue/ | 測試用直接連結 |
| **Green 版本** | http://localhost:3000/green/ | 測試用直接連結 |
| **後端 API** | http://localhost:8080 | CI4 Spark Serve |
| **phpMyAdmin** | http://localhost:8081 | 資料庫管理 |

### 5. 預設帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| **Admin** | `admin@notifyhub.com` | `admin123` |
| **User** | `user@notifyhub.com` | `admin123` |

> ⚠️ **警告**：生產環境請務必更改預設密碼！

### 6. 重置 Admin 帳號

如果需要重置 admin 帳號密碼：

```bash
docker compose exec backend php spark db:seed AdminSeeder
```

---

## 🔄 藍綠部署 (Blue/Green Deployment)

本專案使用 Nginx 反向代理實現無縫切換。對外僅暴露 Port 3000。

### 部署流程

```bash
# 1. 檢查目前狀態
./deploy.sh status

# 2. 建構新版本 (假設目前是 blue，建立 green)
./deploy.sh build green

# 3. 測試新版本
# 瀏覽器開啟 http://localhost:3000/green/

# 4. 切換流量到新版本
./deploy.sh switch green

# 5. 如有問題，立即回滾
./deploy.sh rollback
```

---

## 🛠️ 開發指南

### 後端開發 (CodeIgniter 4)

後端目錄 (`./backend`) 已掛載至容器內，修改程式碼會即時生效。

- **CLI 模式**: 容器使用 `php spark serve` 運行，日誌會直接輸出到 Docker logs。
- **權限管理**: `entrypoint.sh` 每次啟動會自動修正 `writable/` 目錄權限，避免 Permission Denied。
- **依賴安裝**: 容器啟動時會自動檢查並安裝 composer 依賴。

查看後端日誌：
```bash
docker compose logs -f backend
```

### 資料庫

- **Host**: `mariadb` (容器內) / `localhost` (本機)
- **Port**: `3306`
- **User**: `notifyhub`
- **Pass**: `notifyhub_db_2024`
- **DB**: `notifyhub`

---

## 📄 授權

MIT License
