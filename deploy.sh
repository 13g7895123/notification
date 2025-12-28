#!/bin/bash

# ===========================================
# NotifyHub 藍綠部署腳本 (Proxy 模式)
# ===========================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 設定檔路徑
PROXY_CONF="./docker/frontend-proxy/conf.d/default.conf"

# 載入環境變數
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 取得當前活躍版本
# 透過 grep 檢查 nginx config 指向的是 blue 還是 green
if grep -q "server frontend-green:80;" "$PROXY_CONF"; then
    CURRENT_VERSION="green"
    IDLE_VERSION="blue"
else
    CURRENT_VERSION="blue"
    IDLE_VERSION="green"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NotifyHub 藍綠部署 (Proxy Mode)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "當前活躍版本: ${GREEN}${CURRENT_VERSION}${NC}"
echo -e "待命版本 (Idle): ${YELLOW}${IDLE_VERSION}${NC}"
echo ""

show_help() {
    echo "使用方式:"
    echo "  ./deploy.sh build [blue|green]   - 建構指定版本"
    echo "  ./deploy.sh switch [blue|green]  - 切換流量到指定版本"
    echo "  ./deploy.sh status               - 顯示狀態"
    echo "  ./deploy.sh rollback             - 回滾到待命版本"
    echo "  ./deploy.sh reload               - 重用 Nginx 設定"
    echo ""
}

# 建構版本
build_version() {
    VERSION=$1
    if [ "$VERSION" != "blue" ] && [ "$VERSION" != "green" ]; then
        echo -e "${RED}錯誤: 版本必須是 blue 或 green${NC}"
        exit 1
    fi

    echo -e "${YELLOW}正在建構 ${VERSION} 版本...${NC}"
    
    echo -e "${YELLOW}正在確保基礎服務運行 (Database, Backend, Proxy, phpMyAdmin)...${NC}"
    docker compose up -d mariadb backend frontend-proxy phpmyadmin

    echo -e "${YELLOW}正在建構並啟動 ${VERSION} 版本...${NC}"
    
    # 建構並啟動容器
    if [ "$VERSION" == "green" ]; then
        docker compose --profile green up -d --build frontend-green
    else
        docker compose up -d --build frontend-blue
    fi

    echo -e "${GREEN}✓ ${VERSION} 版本建構完成${NC}"
    echo -e "測試連結: http://localhost:${FRONTEND_PORT:-3000}/${VERSION}/"
}

# 切換版本
switch_version() {
    NEW_VERSION=$1
    if [ "$NEW_VERSION" != "blue" ] && [ "$NEW_VERSION" != "green" ]; then
        echo -e "${RED}錯誤: 版本必須是 blue 或 green${NC}"
        exit 1
    fi

    if [ "$NEW_VERSION" == "$CURRENT_VERSION" ]; then
        echo -e "${YELLOW}警告: 已經在 ${NEW_VERSION} 版本${NC}"
        exit 0
    fi

    echo -e "${YELLOW}正在將流量切換到 ${NEW_VERSION} 版本...${NC}"

    # 修改 Nginx 設定檔 (修改 upstream active_frontend 區塊)
    # 使用 sed 替換 server frontend-XXX:80
    if [ "$NEW_VERSION" == "blue" ]; then
        sed -i 's/server frontend-green:80;/server frontend-blue:80;/' "$PROXY_CONF"
    else
        sed -i 's/server frontend-blue:80;/server frontend-green:80;/' "$PROXY_CONF"
    fi

    # 重整 Nginx
    reload_nginx

    # 更新 .env 中的 ACTIVE_FRONTEND 標記 (僅作參考用)
    if grep -q "ACTIVE_FRONTEND=" .env; then
        sed -i "s/ACTIVE_FRONTEND=.*/ACTIVE_FRONTEND=${NEW_VERSION}/" .env
    fi

    echo -e "${GREEN}✓ 切換成功！${NC}"
    echo -e "入口網址: http://localhost:${FRONTEND_PORT:-3000}"
}

# 重整 Nginx
reload_nginx() {
    echo -e "${BLUE}重整 Frontend Proxy Nginx...${NC}"
    docker compose exec frontend-proxy nginx -s reload
}

# 顯示狀態
show_status() {
    echo -e "${BLUE}服務狀態:${NC}"
    docker compose ps
    echo ""
    echo -e "Nginx 設定指向: ${GREEN}${CURRENT_VERSION}${NC}"
    echo -e "Frontend Port:  ${FRONTEND_PORT:-3000}"
    echo -e "Backend Port:   ${BACKEND_PORT:-8080}"
    echo -e "phpMyAdmin Port: ${PHPMYADMIN_PORT:-8081}"
}

# 回滾
rollback() {
    echo -e "${YELLOW}準備回滾到 ${IDLE_VERSION}...${NC}"
    switch_version "$IDLE_VERSION"
}

case "$1" in
    build)
        build_version "$2"
        ;;
    switch)
        switch_version "$2"
        ;;
    status)
        show_status
        ;;
    rollback)
        rollback
        ;;
    reload)
        reload_nginx
        ;;
    *)
        show_help
        ;;
esac
