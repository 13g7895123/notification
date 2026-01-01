# 排程器管理 API - Docker 環境實作說明

## 概述

本文檔說明在 Docker 環境中實作排程器管理 API 的方法與注意事項。

## 已實作功能

### 1. 後端 API（Backend）

#### 新增 Controller
- **檔案**: `backend/app/Controllers/SchedulerController.php`
- **端點**:
  - `GET /api/scheduler/status` - 取得排程器狀態與健康檢查
  - `GET /api/scheduler/logs` - 取得排程器執行日誌

#### 路由配置
- **檔案**: `backend/app/Config/Routes.php`
- 已在管理員權限群組中新增排程器路由

### 2. 前端整合（Frontend）

#### Context 擴展
- **檔案**: `frontend/src/contexts/NotificationContext.tsx`
- 新增方法:
  - `fetchSchedulerStatus()` - 取得排程器狀態
  - `fetchSchedulerLogs(limit)` - 取得排程器日誌

#### 管理頁面
- **檔案**: `frontend/src/pages/SchedulerManagement.tsx`
- 功能:
  - 即時狀態監控
  - 系統健康檢查
  - 執行日誌查看
  - 自動刷新（每 30 秒）

## Docker 環境特殊處理

### 1. 進程檢查

在 Docker 容器中檢查進程存在性時，使用以下三種方法：

```php
private function checkProcessExists(int $pid): bool
{
    // 方法 1: 使用 /proc 檔案系統（Linux）
    if (file_exists("/proc/{$pid}")) {
        return true;
    }

    // 方法 2: 使用 ps 命令
    $output = shell_exec("ps -p {$pid} -o pid= 2>/dev/null");
    if (!empty(trim($output))) {
        return true;
    }

    // 方法 3: 使用 posix_kill（如果可用）
    if (function_exists('posix_kill')) {
        return @posix_kill($pid, 0);
    }

    return false;
}
```

### 2. 日誌讀取

使用 `tail` 命令讀取最後 N 行日誌，並提供 PHP 備用方案：

```php
private function readLastLines(string $filePath, int $lines): array
{
    // 使用 tail 命令（在 Docker 環境中通常可用）
    $output = shell_exec("tail -n {$lines} " . escapeshellarg($filePath));
    
    if ($output !== null) {
        return explode("\n", trim($output));
    }

    // 備用方案：使用 PHP 讀取
    // ...
}
```

### 3. 健康檢查項目

實作的健康檢查包含：

1. **Scheduler Heartbeat** - 檢查心跳檔案（150 秒內有更新視為正常）
2. **Database Connection** - 測試資料庫連線
3. **Daemon Process** - 檢查守護進程是否運行
4. **Scheduled Messages** - 統計待處理與準備發送的訊息
5. **Log File** - 檢查日誌檔案大小（超過 50MB 會警告）

## 啟動排程器

### 方式 1: Docker Compose（推薦）

在 `docker-compose.yml` 中加入排程器服務：

```yaml
services:
  backend:
    # ... 其他配置
    command: >
      sh -c "php-fpm &
             php spark scheduler:daemon"
```

### 方式 2: Supervisor（更穩定）

在 `backend/docker/supervisord.conf` 中新增：

```ini
[program:scheduler]
command=php /var/www/html/spark scheduler:daemon
directory=/var/www/html
autostart=true
autorestart=true
stderr_logfile=/var/log/scheduler.err.log
stdout_logfile=/var/log/scheduler.out.log
```

### 方式 3: Cron Job（輕量級）

在 Dockerfile 中新增 crontab：

```dockerfile
RUN echo "* * * * * php /var/www/html/spark scheduler:daemon --once" > /etc/cron.d/scheduler
RUN chmod 0644 /etc/cron.d/scheduler
RUN crontab /etc/cron.d/scheduler
```

然後在容器啟動時執行 cron：

```dockerfile
CMD ["sh", "-c", "cron && php-fpm"]
```

## 目前限制與注意事項

### 1. Docker 環境限制

- ✅ 進程檢查：已實作多種方法，適應 Docker 環境
- ✅ 日誌讀取：使用 shell 命令 + PHP 備用方案
- ⚠️ 進程管理：無法從 API 直接啟動/停止排程器（需要容器級別管理）

### 2. 建議的容器管理方式

由於在 Docker 容器中直接管理進程的限制，建議：

1. **使用 Supervisor** 管理排程器進程
2. **監控介面僅提供狀態查看**，不提供啟動/停止功能
3. **重啟排程器需重啟容器**或通過 Supervisor 管理

### 3. 替代方案（Plan B）

如果需要從 API 控制排程器，可以：

#### 選項 A: Kubernetes Job/CronJob
使用 K8s 的 CronJob 資源管理排程任務

#### 選項 B: 外部排程服務
使用 AWS EventBridge、Google Cloud Scheduler 等雲端服務

#### 選項 C: 訊息佇列
改用 Redis/RabbitMQ + Worker 架構，更適合容器化環境

## 驗證測試

### 1. 測試狀態 API

```bash
curl -X GET http://localhost:3000/api/scheduler/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

預期回應：
```json
{
  "success": true,
  "data": {
    "status": "running",
    "lastRun": "2026-01-01T12:00:00+00:00",
    "nextRun": "2026-01-01T12:01:00+00:00",
    "daemonStatus": "active",
    "checks": [...]
  }
}
```

### 2. 測試日誌 API

```bash
curl -X GET "http://localhost:3000/api/scheduler/logs?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 檔案清單

### 後端新增/修改檔案
- `backend/app/Controllers/SchedulerController.php` ✅ 新增
- `backend/app/Config/Routes.php` ✅ 修改

### 前端新增/修改檔案
- `frontend/src/pages/SchedulerManagement.tsx` ✅ 新增
- `frontend/src/pages/SchedulerManagement.css` ✅ 新增
- `frontend/src/contexts/NotificationContext.tsx` ✅ 修改
- `frontend/src/App.tsx` ✅ 修改
- `frontend/src/components/Sidebar.tsx` ✅ 修改
- `frontend/src/pages/SendNotification.tsx` ✅ 修改
- `frontend/src/pages/SendNotification.css` ✅ 修改
- `frontend/docs/API_REQUIREMENTS.md` ✅ 修改

## 下一步建議

1. **配置 Supervisor**: 在 Docker 容器中使用 Supervisor 管理排程器守護進程
2. **日誌輪轉**: 配置 logrotate 或實作日誌清理功能
3. **監控告警**: 整合 Prometheus/Grafana 進行排程器監控
4. **備份機制**: 定期備份排程器狀態和日誌

## 常見問題

### Q: 為什麼不能從 API 啟動/停止排程器？
A: 在 Docker 容器中，直接使用 `exec()` 啟動背景進程不可靠。建議使用 Supervisor 或 systemd 等進程管理工具。

### Q: 如何確保排程器持續運行？
A: 使用 Supervisor 的 `autorestart=true` 配置，或者配置 Docker 的 restart policy。

### Q: 日誌檔案太大怎麼辦？
A: 實作日誌輪轉（logrotate）或在應用層定期清理舊日誌。

---

**最後更新**: 2026-01-01
**版本**: 1.0.0
