# 排程器管理功能實作總結

## ✅ 已完成項目

### 1. 後端 API 實作
- ✅ 新增 `SchedulerController` 處理排程器管理請求
- ✅ 實作 `GET /api/scheduler/status` - 取得排程器狀態與健康檢查
- ✅ 實作 `GET /api/scheduler/logs` - 取得排程器執行日誌
- ✅ 更新路由配置，僅限管理員存取
- ✅ Docker 環境適配（進程檢查、日誌讀取）

### 2. 前端功能開發
- ✅ 新增排程器管理頁面 (`SchedulerManagement.tsx`)
- ✅ 實作狀態監控介面
- ✅ 實作系統健康檢查顯示
- ✅ 實作即時日誌查看（終端機風格）
- ✅ 整合自動刷新機制（30 秒間隔）
- ✅ 在發送通知頁面新增快速連結按鈕
- ✅ 側邊欄新增排程器管理選項（管理員限定）

### 3. 文檔更新
- ✅ 更新 API 需求文件 (`API_REQUIREMENTS.md`)
- ✅ 新增排程器管理 API 章節
- ✅ 創建 Docker 環境實作說明文檔

### 4. Docker 配置
- ✅ 更新 `supervisord.conf`，自動啟動排程器守護進程
- ✅ 配置日誌輸出路徑

## 📁 檔案清單

### 後端 (Backend)
```
backend/
├── app/
│   ├── Controllers/
│   │   └── SchedulerController.php          ✨ 新增
│   └── Config/
│       └── Routes.php                        📝 修改
├── docker/
│   └── supervisord.conf                      📝 修改
└── docs/
    └── SCHEDULER_DOCKER.md                   ✨ 新增
```

### 前端 (Frontend)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── SchedulerManagement.tsx           ✨ 新增
│   │   ├── SchedulerManagement.css           ✨ 新增
│   │   ├── SendNotification.tsx              📝 修改
│   │   └── SendNotification.css              📝 修改
│   ├── contexts/
│   │   └── NotificationContext.tsx           📝 修改
│   ├── components/
│   │   └── Sidebar.tsx                       📝 修改
│   └── App.tsx                               📝 修改
└── docs/
    └── API_REQUIREMENTS.md                   📝 修改
```

## 🎯 核心功能

### 排程器狀態監控
- **運行狀態**: 顯示排程器是否運行中
- **最後執行時間**: 基於心跳檔案的時間戳
- **下次執行時間**: 預估下次執行時間
- **守護進程狀態**: active/inactive

### 系統健康檢查
1. **Scheduler Heartbeat** - 心跳檔案檢查
2. **Database Connection** - 資料庫連線測試
3. **Daemon Process** - 守護進程狀態
4. **Scheduled Messages** - 待處理訊息統計
5. **Log File** - 日誌檔案大小檢查

### 執行日誌查看
- 深色終端機風格介面
- 顏色區分日誌級別 (info/warning/error)
- 顯示時間戳與訊息內容
- 可配置顯示筆數（預設 50 筆）

## 🐳 Docker 環境處理

### 問題與解決方案

#### 1. 進程檢查
**問題**: Docker 容器中 PID 檢查可能不可靠
**解決**: 使用三層檢查機制
- `/proc` 檔案系統
- `ps` 命令
- `posix_kill` 函數

#### 2. 日誌讀取
**問題**: 大型日誌檔案讀取效能
**解決**: 使用 `tail` 命令 + PHP SplFileObject 備用

#### 3. 進程管理
**問題**: 無法從 API 可靠地啟動/停止進程
**解決**: 使用 Supervisor 管理，API 僅提供監控

## 🚀 部署與啟動

### 自動啟動（已配置）
排程器已配置為通過 Supervisor 自動啟動：
```ini
[program:scheduler]
command=php /var/www/html/spark scheduler:daemon
autostart=true
autorestart=true
```

### 手動管理（可選）
```bash
# 進入容器
docker exec -it backend bash

# 檢查狀態
php spark schedule:status

# 手動啟動（一般不需要，Supervisor 會自動管理）
php spark scheduler:daemon

# 單次執行
php spark scheduler:daemon --once
```

## 📊 API 端點

### GET /api/scheduler/status
取得排程器當前狀態與健康檢查結果

**回應範例**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "lastRun": "2026-01-01T12:00:00+00:00",
    "nextRun": "2026-01-01T12:01:00+00:00",
    "daemonStatus": "active",
    "checks": [
      {
        "name": "Database Connection",
        "status": "ok",
        "message": "Connected"
      }
    ]
  }
}
```

### GET /api/scheduler/logs?limit=50
取得排程器執行日誌

**回應範例**:
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-01-01T12:00:00+00:00",
      "level": "info",
      "message": "Starting scheduled task: ProcessScheduledMessages",
      "context": null
    }
  ]
}
```

## ⚠️ 限制與注意事項

### 當前限制
1. **無法從 API 啟動/停止排程器** - 需要容器級別管理
2. **日誌輪轉未實作** - 建議配置 logrotate
3. **無告警機制** - 建議整合 Prometheus/Grafana

### 安全性
- ✅ 僅管理員可存取
- ✅ JWT 認證保護
- ✅ 不暴露敏感系統資訊

## 🔧 替代方案 (Plan B)

如果當前實作不符合需求，可考慮：

### 選項 A: 使用訊息佇列
- Redis + Worker 架構
- 更適合容器化與擴展
- 可以獨立擴展 Worker 數量

### 選項 B: Kubernetes CronJob
- 雲原生排程方案
- 自動容錯與重試
- 易於監控與管理

### 選項 C: 外部排程服務
- AWS EventBridge
- Google Cloud Scheduler
- 完全託管，無需維護

## 📝 測試建議

### 1. 功能測試
```bash
# 測試狀態 API
curl http://localhost:3000/api/scheduler/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 測試日誌 API
curl http://localhost:3000/api/scheduler/logs?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 壓力測試
- 創建大量排程訊息
- 驗證排程器處理能力
- 監控資源使用情況

### 3. 容錯測試
- 模擬資料庫斷線
- 模擬排程器崩潰
- 驗證自動重啟機制

## 🎉 總結

本次實作在 Docker 環境中成功實現了排程器管理功能，包含：
- ✅ 完整的狀態監控 API
- ✅ 即時日誌查看介面
- ✅ 系統健康檢查
- ✅ 自動刷新機制
- ✅ Docker 環境適配

所有功能已整合到前後端，並配置為自動啟動。管理員可以通過網頁介面實時監控排程器運行狀態，查看詳細日誌，確保系統穩定運行。

---

**實作日期**: 2026-01-01
**版本**: 1.0.0
**狀態**: ✅ 完成
