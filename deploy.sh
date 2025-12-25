#!/bin/bash

# ===========================================
# NotifyHub 藍綠部署腳本
# ===========================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 載入環境變數
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 取得當前活躍版本
CURRENT_VERSION=${ACTIVE_FRONTEND:-blue}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NotifyHub 藍綠部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "當前活躍版本: ${GREEN}${CURRENT_VERSION}${NC}"
echo ""

# 函數：顯示使用說明
show_help() {
    echo "使用方式:"
    echo "  ./deploy.sh build [blue|green]  - 建構指定版本"
    echo "  ./deploy.sh switch [blue|green] - 切換活躍版本"
    echo "  ./deploy.sh status              - 顯示狀態"
    echo "  ./deploy.sh rollback            - 回滾到前一版本"
    echo ""
}

# 函數：建構版本
build_version() {
    VERSION=$1
    
    if [ "$VERSION" != "blue" ] && [ "$VERSION" != "green" ]; then
        echo -e "${RED}錯誤: 版本必須是 blue 或 green${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}正在建構 ${VERSION} 版本...${NC}"
    
    if [ "$VERSION" == "green" ]; then
        docker compose --profile green build frontend-${VERSION}
        docker compose --profile green up -d frontend-${VERSION}
    else
        docker compose build frontend-${VERSION}
        docker compose up -d frontend-${VERSION}
    fi
    
    echo -e "${GREEN}✓ ${VERSION} 版本建構完成${NC}"
}

# 函數：切換版本
switch_version() {
    NEW_VERSION=$1
    
    if [ "$NEW_VERSION" != "blue" ] && [ "$NEW_VERSION" != "green" ]; then
        echo -e "${RED}錯誤: 版本必須是 blue 或 green${NC}"
        exit 1
    fi
    
    if [ "$NEW_VERSION" == "$CURRENT_VERSION" ]; then
        echo -e "${YELLOW}已經在 ${NEW_VERSION} 版本${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}正在切換到 ${NEW_VERSION} 版本...${NC}"
    
    # 更新 .env 檔案
    sed -i "s/ACTIVE_FRONTEND=.*/ACTIVE_FRONTEND=${NEW_VERSION}/" .env
    
    # 如果是 green，需要啟動它
    if [ "$NEW_VERSION" == "green" ]; then
        docker compose --profile green up -d frontend-green
    fi
    
    echo -e "${GREEN}✓ 已切換到 ${NEW_VERSION} 版本${NC}"
    echo ""
    echo -e "前端存取："
    if [ "$NEW_VERSION" == "blue" ]; then
        echo -e "  ${GREEN}→ http://localhost:${FRONTEND_BLUE_PORT:-3001}${NC} (活躍)"
        echo -e "  ${BLUE}  http://localhost:${FRONTEND_GREEN_PORT:-3002}${NC} (待命)"
    else
        echo -e "  ${BLUE}  http://localhost:${FRONTEND_BLUE_PORT:-3001}${NC} (待命)"
        echo -e "  ${GREEN}→ http://localhost:${FRONTEND_GREEN_PORT:-3002}${NC} (活躍)"
    fi
}

# 函數：顯示狀態
show_status() {
    echo -e "${BLUE}服務狀態:${NC}"
    echo ""
    docker compose ps
    echo ""
    echo -e "活躍版本: ${GREEN}${CURRENT_VERSION}${NC}"
    echo ""
    echo -e "存取位址："
    echo -e "  前端 (Blue):  http://localhost:${FRONTEND_BLUE_PORT:-3001}"
    echo -e "  前端 (Green): http://localhost:${FRONTEND_GREEN_PORT:-3002}"
    echo -e "  後端 API:     http://localhost:${BACKEND_PORT:-8080}"
    echo -e "  phpMyAdmin:   http://localhost:${PHPMYADMIN_PORT:-8081}"
}

# 函數：回滾
rollback() {
    if [ "$CURRENT_VERSION" == "blue" ]; then
        switch_version "green"
    else
        switch_version "blue"
    fi
}

# 主邏輯
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
    *)
        show_help
        ;;
esac
