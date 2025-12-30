#!/bin/sh
set -e

echo "=========================================="
echo " NotifyHub Backend - Initializing..."
echo "=========================================="

# ===========================================
# 安裝系統依賴
# ===========================================
echo "[1/5] Installing system dependencies..."
apk add --no-cache \
    curl \
    git \
    zip \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    autoconf \
    gcc \
    g++ \
    make \
    tzdata \
    > /dev/null 2>&1

# ===========================================
# 安裝 PHP 擴展
# ===========================================
echo "[2/5] Installing PHP extensions..."
docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    intl \
    mbstring \
    zip \
    > /dev/null 2>&1

# ===========================================
# 安裝 Composer
# ===========================================
echo "[3/5] Installing Composer..."
if [ ! -f /usr/local/bin/composer ]; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null 2>&1
fi

# ===========================================
# 安裝專案依賴
# ===========================================
echo "[4/5] Installing project dependencies..."
cd /var/www/html

if [ -f composer.json ]; then
    if [ ! -d vendor ]; then
        composer install --no-interaction --no-progress 2>&1 | grep -E "^(Installing|Nothing)" || true
    else
        echo "  Dependencies already installed."
    fi
fi

# ===========================================
# 設定資料夾權限
# ===========================================
echo "[5/5] Setting folder permissions..."

# 建立必要目錄
mkdir -p writable/cache writable/logs writable/session writable/uploads writable/debugbar

# 設定權限
chmod -R 777 writable
chown -R www-data:www-data writable 2>/dev/null || true

echo "  - writable/cache    [OK]"
echo "  - writable/logs     [OK]"
echo "  - writable/session  [OK]"
echo "  - writable/uploads  [OK]"
echo "  - writable/debugbar [OK]"

# ===========================================
# 驗證權限
# ===========================================
echo ""
echo "Verifying permissions..."
ls -la writable/ | head -10

# ===========================================
# 等待資料庫就緒
# ===========================================
echo ""
echo "Waiting for database..."
sleep 5

# ===========================================
# 啟動 Task Scheduler Daemon (背景執行)
# ===========================================
echo ""
echo "Starting Task Scheduler Daemon..."

# 建立 PID 檔案目錄
mkdir -p writable/pids

# 啟動 scheduler daemon 在背景
nohup php spark tasks:run --daemon > writable/logs/scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo $SCHEDULER_PID > writable/pids/scheduler.pid
echo "  Scheduler started with PID: $SCHEDULER_PID"

# 設定清理函數，當主程序結束時停止 scheduler
cleanup() {
    echo ""
    echo "Stopping Task Scheduler..."
    if [ -f writable/pids/scheduler.pid ]; then
        kill $(cat writable/pids/scheduler.pid) 2>/dev/null || true
        rm -f writable/pids/scheduler.pid
    fi
    echo "Cleanup complete."
    exit 0
}

# 捕捉終止信號
trap cleanup SIGTERM SIGINT

# ===========================================
# 啟動 CodeIgniter 4 CLI Server
# ===========================================
echo ""
echo "=========================================="
echo " Starting CodeIgniter 4 CLI Server..."
echo " Listening on http://0.0.0.0:8080"
echo " Task Scheduler: Running (PID: $SCHEDULER_PID)"
echo "=========================================="
echo ""

# 使用 php spark serve 啟動
exec php spark serve --host 0.0.0.0 --port 8080
