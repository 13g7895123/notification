#!/bin/sh
set -e

echo "=========================================="
echo " NotifyHub Backend (FPM) - Initializing..."
echo "=========================================="

# ===========================================
# 進入工作目錄
# ===========================================
cd /var/www/html

# 安裝/更新專案依賴
# ===========================================
if [ "$CI_ENVIRONMENT" = "production" ]; then
    echo "Installing/Updating project dependencies (production)..."
    composer install --no-interaction --no-progress --no-dev --optimize-autoloader
elif [ -f composer.json ] && [ ! -d vendor ]; then
    echo "Installing project dependencies (development)..."
    composer install --no-interaction --no-progress
fi

# ===========================================
# 設定資料夾權限
# ===========================================
echo "Setting folder permissions..."
mkdir -p writable/cache writable/logs writable/session writable/uploads writable/debugbar writable/pids
chmod -R 777 writable
chown -R www-data:www-data /var/www/html 2>/dev/null || true

# ===========================================
# 設定 Cron Job for CI4 Tasks
# ===========================================
echo "Setting up Cron Job..."
cat > /etc/crontabs/root << 'EOF'
# CI4 Tasks Scheduler - 每分鐘執行
* * * * * cd /var/www/html && php spark tasks:run >> /var/www/html/writable/logs/cron.log 2>&1
EOF

# 啟動 crond (背景)
crond -f -l 2 &
CRON_PID=$!
echo "  Cron daemon started (PID: $CRON_PID)"

# 設定清理函數
cleanup() {
    echo "Stopping Cron daemon..."
    kill $CRON_PID 2>/dev/null || true
    echo "Cleanup complete."
    exit 0
}

# 捕捉終止信號
trap cleanup SIGTERM SIGINT

# ===========================================
# 啟動 PHP-FPM
# ===========================================
echo "=========================================="
echo " Starting PHP-FPM..."
echo " Cron Job: Running (PID: $CRON_PID)"
echo "=========================================="
echo ""

exec php-fpm
