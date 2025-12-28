#!/bin/bash

# ===========================================
# NotifyHub - 資料庫種子腳本
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 取得腳本所在目錄並切換到專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE} NotifyHub - 資料庫種子${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# 檢查 backend 容器是否運行
BACKEND_CONTAINER=$(docker compose ps -q backend 2>/dev/null)
if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}錯誤: Backend 容器未運行${NC}"
    echo "請先執行: docker compose up -d backend"
    exit 1
fi

# 取得要執行的 Seeder
SEEDER=${1:-"AdminSeeder"}

echo -e "${YELLOW}[1/2] 執行資料庫種子: ${SEEDER}${NC}"
docker compose exec -T backend php spark db:seed "$SEEDER"

echo -e "${YELLOW}[2/2] 完成${NC}"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN} ✓ 資料庫種子執行完成${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "使用方式:"
echo "  ./scripts/seed.sh              # 執行預設的 AdminSeeder"
echo "  ./scripts/seed.sh AdminSeeder  # 執行指定的 Seeder"
echo ""
