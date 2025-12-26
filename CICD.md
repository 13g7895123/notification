# NotifyHub CI/CD 說明文件

本專案使用 **GitHub Actions + SSH + Shell Script** 的 CI/CD 方案。
當代碼推送到 GitHub 後，GitHub Actions 會透過 SSH 連線到伺服器，執行 `git pull` 並運行部署腳本。

## 🏗️ 架構說明

```
┌─────────────────┐      SSH        ┌─────────────────┐
│  GitHub Actions │  ──────────────→│   伺服器        │
│                 │                 │                 │
│  1. 觸發 CI/CD  │                 │  1. git pull    │
│  2. SSH 連線    │                 │  2. 執行 sh     │
│                 │                 │  3. 藍綠部署    │
└─────────────────┘                 └─────────────────┘
```

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `.github/workflows/deploy-dev.yml` | 開發環境部署 workflow（develop 分支） |
| `.github/workflows/deploy-prod.yml` | 生產環境部署 workflow（main 分支） |
| `deploy.sh` | 藍綠部署腳本 |

## 🔧 GitHub Secrets 設定

在 GitHub Repository 設定中加入以下 Secrets：

### 開發環境 (develop 分支)

| Secret 名稱 | 說明 | 範例 |
|-------------|------|------|
| `DEV_SSH_HOST` | 開發伺服器 IP 或域名 | `dev.example.com` |
| `DEV_SSH_USER` | SSH 登入帳號 | `deployer` |
| `DEV_SSH_KEY` | SSH 私鑰（完整內容） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEV_SSH_PORT` | SSH 連接埠（選填，預設 22） | `22` |
| `DEV_DEPLOY_PATH` | 專案在伺服器的路徑 | `/home/deployer/notifyhub` |

### 生產環境 (main 分支)

| Secret 名稱 | 說明 | 範例 |
|-------------|------|------|
| `PROD_SSH_HOST` | 生產伺服器 IP 或域名 | `prod.example.com` |
| `PROD_SSH_USER` | SSH 登入帳號 | `deployer` |
| `PROD_SSH_KEY` | SSH 私鑰（完整內容） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROD_SSH_PORT` | SSH 連接埠（選填，預設 22） | `22` |
| `PROD_DEPLOY_PATH` | 專案在伺服器的路徑 | `/home/deployer/notifyhub` |

### 設定步驟

1. 前往 GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. 點擊 **New repository secret**
3. 依序加入上述 Secrets

### SSH Key 生成（如果還沒有）

```bash
# 在本機生成 SSH 金鑰對
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# 將公鑰加入伺服器
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server

# 複製私鑰內容到 GitHub Secret
cat ~/.ssh/github_deploy
```

### 環境變數處理方式

部署時會自動：
1. 如果伺服器上沒有 `.env`，則複製 `.env.example` 作為 `.env`
2. **自動生成 `JWT_SECRET`**（使用 `openssl rand` 產生 48 位隨機字串）

> ⚠️ **注意**：首次部署前請確保 `.env.example` 中的 MariaDB 密碼、Port 等設定適合正式環境

## 🚀 使用方式

### 自動觸發

- **推送到 `develop` 分支** → 自動部署到開發環境
- **推送到 `main` 分支** → 自動部署到生產環境

### 手動觸發

1. 前往 GitHub Repository → **Actions**
2. 選擇 **Deploy to Development** 或 **Deploy to Production**
3. 點擊 **Run workflow**

## 📋 CI/CD 流程說明

```
┌─────────────────────────────────────────────────────┐
│                    CI/CD 流程                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. GitHub Actions 觸發                              │
│     └── 推送到 develop/main 分支                    │
│                                                      │
│  2. SSH 連線到伺服器                                 │
│     └── 使用 GitHub Secrets 中的金鑰               │
│                                                      │
│  3. 拉取代碼                                         │
│     └── git pull origin <branch>                    │
│                                                      │
│  4. 建構新版本                                       │
│     └── 部署到 idle 版本（藍綠部署）                 │
│                                                      │
│  5. 切換流量                                         │
│     └── 透過 Nginx 切換到新版本                      │
│                                                      │
│  6. 完成部署                                         │
│     └── 舊版本保留供回滾使用                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🔙 回滾機制

手動回滾：

```bash
# 在伺服器上執行
./deploy.sh rollback
```

## 🛠️ 故障排除

### GitHub Actions 執行失敗

1. 檢查 GitHub Actions 日誌
2. 確認 GitHub Secrets 設定正確
3. 確認 SSH 連線可用

### SSH 連線失敗

```bash
# 測試 SSH 連線
ssh -i ~/.ssh/github_deploy user@your-server

# 檢查防火牆設定
sudo ufw status

# 確認 SSH 服務運行中
sudo systemctl status sshd
```

### 服務無法啟動

```bash
# 檢查 Docker 狀態
docker compose ps

# 查看 Docker 日誌
docker compose logs -f
```
