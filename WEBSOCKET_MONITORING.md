# WebSocket 服務監控功能說明

## 📊 功能概述

本系統現已提供完整的 WebSocket 服務監控功能，您可以通過多種方式查看和管理 WebSocket 服務的運行狀態。

## 🖥️ 方式一：前端管理介面（推薦）

### 訪問步驟

1. 開啟瀏覽器訪問 http://localhost:3000
2. 使用管理員帳號登入：
   - 帳號：`admin@notifyhub.com`
   - 密碼：`admin123`
3. 點擊左側選單「排程器管理」
4. 頁面頂部會顯示「WebSocket 服務監控」卡片

### 可查看的資訊

✅ **服務狀態**
- 服務是否正在運行
- 整體健康狀態（健康/異常）
- 活躍連線數 / 總連線數

✅ **詳細檢查項目**
- Service Running - 服務運行狀態
- WebSocket Port - 8080 端口監聽狀態
- Internal Push Port - 8081 端口監聽狀態
- Connections - 連線統計

✅ **端口資訊**
- WebSocket 端口：8080（監聽中/未監聽）
- 內部推送端口：8081（監聽中/未監聽）
- 進程 ID (PID)

✅ **進程詳細資訊**（點擊「顯示詳細信息」）
- CPU 使用率
- 記憶體使用率
- 啟動時間
- 執行命令
- 最後連線時間

### 可執行的操作

🎛️ **服務控制**
- **啟動服務** - 當服務未運行時顯示
- **重啟服務** - 重新啟動 WebSocket 服務
- **停止服務** - 停止 WebSocket 服務（會中斷所有連線）
- **刷新狀態** - 手動刷新狀態資訊

⏱️ **自動更新**
- 每 10 秒自動刷新狀態
- 無需手動重新整理頁面

---

## 🔧 方式二：API 端點

### 查詢服務狀態（無需認證）

```bash
curl http://localhost:8080/api/system/websocket/status | jq
```

### 控制服務（需要管理員權限）

```bash
# 1. 先登入取得 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notifyhub.com","password":"admin123"}' \
  | jq -r '.data.token')

# 2. 啟動服務
curl -X POST http://localhost:8080/api/system/websocket/start \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. 停止服務
curl -X POST http://localhost:8080/api/system/websocket/stop \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. 重啟服務
curl -X POST http://localhost:8080/api/system/websocket/restart \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🛠️ 方式三：命令行腳本

### 使用自動檢查腳本

```bash
# 執行檢查腳本
./scripts/check-websocket.sh
```

這個腳本會自動檢查：
- ✅ Backend 容器狀態
- ✅ WebSocket 服務進程
- ✅ 端口監聽狀態（8080, 8081）
- ✅ API 狀態端點
- ✅ 數據庫連線記錄

### 手動檢查命令

```bash
# 檢查進程
docker compose exec backend ps aux | grep ws:start

# 檢查端口
docker compose exec backend netstat -tlnp | grep -E '8080|8081'

# 查看日誌
docker compose exec backend tail -f /var/www/html/writable/logs/websocket.log
```

---

## 📱 使用場景

### 場景 1：日常監控

**使用前端介面**
1. 登入管理後台
2. 進入「排程器管理」頁面
3. 查看 WebSocket 服務監控卡片
4. 確認服務狀態為「服務正常運行」（綠色）

### 場景 2：服務異常排查

**步驟：**
1. 前端介面顯示「服務異常」（紅色）
2. 查看健康檢查項目，找出異常項目
3. 點擊「顯示詳細信息」查看進程資訊
4. 根據異常項目進行處理：
   - 服務未運行 → 點擊「啟動服務」
   - 端口未監聽 → 點擊「重啟服務」
   - 其他問題 → 查看日誌排查

### 場景 3：服務維護

**重啟服務：**
1. 前端介面點擊「重啟服務」按鈕
2. 確認重啟操作
3. 等待服務重新啟動
4. 確認狀態恢復正常

**停止服務：**
1. 前端介面點擊「停止服務」按鈕
2. 確認停止操作（會中斷所有連線）
3. 服務停止

### 場景 4：自動化監控

**使用腳本定期檢查：**

```bash
# 創建 cron 任務，每 5 分鐘檢查一次
*/5 * * * * /path/to/scripts/check-websocket.sh >> /var/log/websocket-check.log 2>&1
```

**或使用 API 整合到監控系統：**

```bash
# 整合到 Prometheus, Grafana 等監控系統
curl -s http://localhost:8080/api/system/websocket/status | \
  jq '.data.health.status' | \
  grep -q "healthy" && echo "OK" || echo "ERROR"
```

---

## 🎯 最佳實踐

### 日常運維

1. **定期檢查**
   - 每天登入前端查看服務狀態
   - 確認活躍連線數是否正常
   - 查看 CPU 和記憶體使用率

2. **日誌管理**
   - 定期查看 WebSocket 日誌
   - 清理舊的日誌檔案
   - 監控錯誤訊息

3. **連線監控**
   - 監控活躍連線數趨勢
   - 發現異常連線及時處理
   - 記錄高峰時段連線數

### 故障處理

1. **服務無法啟動**
   ```bash
   # 查看日誌
   docker compose exec backend cat /var/www/html/writable/logs/websocket.log
   
   # 檢查端口占用
   docker compose exec backend netstat -tlnp | grep -E '8080|8081'
   
   # 手動啟動測試
   docker compose exec backend php spark ws:start
   ```

2. **端口衝突**
   ```bash
   # 找出占用端口的進程
   docker compose exec backend lsof -i :8080
   
   # 終止進程
   docker compose exec backend kill -9 <PID>
   
   # 重新啟動服務
   # 在前端介面點擊「啟動服務」
   ```

3. **連線數異常**
   - 查看前端的 WebSocket 連線追蹤
   - 檢查是否有大量錯誤連線
   - 必要時重啟服務清理連線

---

## 📖 相關文檔

- [WEBSOCKET_TESTING_GUIDE.md](WEBSOCKET_TESTING_GUIDE.md) - 完整測試指南
- [WEBSOCKET_API_GUIDE.md](WEBSOCKET_API_GUIDE.md) - WebSocket API 詳細說明
- [README.md](README.md) - 專案概述

---

## ❓ 常見問題

**Q: 如何知道 WebSocket 服務是否正常？**
A: 登入前端管理介面，進入「排程器管理」頁面，查看 WebSocket 服務監控卡片。如果顯示綠色「服務正常運行」，即表示服務正常。

**Q: 服務狀態多久更新一次？**
A: 前端介面每 10 秒自動更新一次。您也可以點擊刷新按鈕手動更新。

**Q: 可以遠程監控服務嗎？**
A: 可以。使用 API 端點 `/api/system/websocket/status` 即可遠程查詢服務狀態，無需認證。

**Q: 重啟服務會中斷現有連線嗎？**
A: 是的。重啟服務會中斷所有現有的 WebSocket 連線。客戶端需要重新連線。

**Q: 如何設定告警通知？**
A: 可以使用腳本定期檢查 API 狀態端點，當健康狀態為 "unhealthy" 時發送告警。或整合到 Prometheus/Grafana 等監控系統。

---

**最後更新：** 2026-01-22
