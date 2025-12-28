#!/bin/bash

# ===========================================
# NotifyHub - 資料庫遷移腳本
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE} NotifyHub - 資料庫遷移${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# 檢查 backend 容器是否運行
BACKEND_CONTAINER=$(docker compose ps -q backend 2>/dev/null)
if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}錯誤: Backend 容器未運行${NC}"
    echo "請先執行: docker compose up -d backend"
    exit 1
fi

echo -e "${YELLOW}[1/3] 檢查資料庫連線...${NC}"
docker compose exec -T backend php spark db:table users > /dev/null 2>&1 || {
    echo -e "${YELLOW}  等待資料庫就緒...${NC}"
    sleep 5
}

echo -e "${YELLOW}[2/3] 執行資料庫遷移...${NC}"
docker compose exec -T backend php spark migrate --all

echo -e "${YELLOW}[3/3] 檢查遷移狀態...${NC}"
docker compose exec -T backend php spark migrate:status

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN} ✓ 資料庫遷移完成${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
