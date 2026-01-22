#!/bin/bash

# WebSocket 服務狀態檢查腳本
# 用途：快速檢查 WebSocket 服務是否正常運行

set -e

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "   WebSocket 服務狀態檢查"
echo "======================================"
echo ""

# 檢查 Backend 容器是否運行
echo -e "${BLUE}[1/5]${NC} 檢查 Backend 容器狀態..."
if docker compose ps backend | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend 容器正在運行${NC}"
else
    echo -e "${RED}❌ Backend 容器未運行${NC}"
    exit 1
fi

# 檢查 WebSocket 進程
echo -e "\n${BLUE}[2/5]${NC} 檢查 WebSocket 服務進程..."
WS_PROCESS=$(docker compose exec backend ps aux | grep "[w]s:start" || true)
if [ -n "$WS_PROCESS" ]; then
    echo -e "${GREEN}✅ WebSocket 服務進程運行中${NC}"
    echo "$WS_PROCESS" | awk '{print "   PID: "$2" | CPU: "$3"% | MEM: "$4"% | CMD: "$11" "$12" "$13}'
else
    echo -e "${RED}❌ WebSocket 服務未運行${NC}"
    echo -e "${YELLOW}提示：使用以下命令啟動服務：${NC}"
    echo "   docker compose exec backend php spark ws:start"
fi

# 檢查端口監聽
echo -e "\n${BLUE}[3/5]${NC} 檢查端口監聽狀態..."

# WebSocket 端口 (8080)
WS_PORT=$(docker compose exec backend netstat -tlnp 2>/dev/null | grep ":8080 " || true)
if [ -n "$WS_PORT" ]; then
    echo -e "${GREEN}✅ WebSocket 端口 8080 正在監聽${NC}"
    echo "   $WS_PORT"
else
    echo -e "${RED}❌ WebSocket 端口 8080 未監聽${NC}"
fi

# 內部推送端口 (8081)
INTERNAL_PORT=$(docker compose exec backend netstat -tlnp 2>/dev/null | grep ":8081 " || true)
if [ -n "$INTERNAL_PORT" ]; then
    echo -e "${GREEN}✅ 內部推送端口 8081 正在監聽${NC}"
    echo "   $INTERNAL_PORT"
else
    echo -e "${RED}❌ 內部推送端口 8081 未監聽${NC}"
fi

# 檢查 API 狀態端點
echo -e "\n${BLUE}[4/5]${NC} 檢查 API 狀態端點..."
API_RESPONSE=$(curl -s http://localhost:8080/api/system/websocket/status || echo "")
if [ -n "$API_RESPONSE" ]; then
    echo -e "${GREEN}✅ API 狀態端點可訪問${NC}"
    
    # 使用 jq 解析 JSON（如果可用）
    if command -v jq &> /dev/null; then
        SERVICE_RUNNING=$(echo "$API_RESPONSE" | jq -r '.data.service_running')
        ACTIVE_CONN=$(echo "$API_RESPONSE" | jq -r '.data.active_connections')
        TOTAL_CONN=$(echo "$API_RESPONSE" | jq -r '.data.total_connections')
        HEALTH=$(echo "$API_RESPONSE" | jq -r '.data.health.status')
        
        echo "   服務運行: $SERVICE_RUNNING"
        echo "   活躍連線: $ACTIVE_CONN"
        echo "   總連線數: $TOTAL_CONN"
        echo "   健康狀態: $HEALTH"
        
        if [ "$HEALTH" == "healthy" ]; then
            echo -e "${GREEN}✅ 服務健康狀態良好${NC}"
        else
            echo -e "${YELLOW}⚠️  服務健康狀態異常${NC}"
        fi
    else
        echo "   (安裝 jq 以查看詳細信息)"
    fi
else
    echo -e "${RED}❌ 無法訪問 API 狀態端點${NC}"
fi

# 檢查數據庫連線記錄
echo -e "\n${BLUE}[5/5]${NC} 檢查數據庫連線記錄..."
DB_CHECK=$(docker compose exec backend php -r "
\$db = \Config\Database::connect();
\$count = \$db->table('websocket_connections')->countAllResults();
\$active = \$db->table('websocket_connections')->where('status', 'connected')->countAllResults();
echo \"total:\$count,active:\$active\";
" 2>/dev/null || echo "error")

if [ "$DB_CHECK" != "error" ]; then
    TOTAL=$(echo "$DB_CHECK" | cut -d',' -f1 | cut -d':' -f2)
    ACTIVE=$(echo "$DB_CHECK" | cut -d',' -f2 | cut -d':' -f2)
    echo -e "${GREEN}✅ 數據庫連線記錄可訪問${NC}"
    echo "   總連線記錄: $TOTAL"
    echo "   活躍連線: $ACTIVE"
else
    echo -e "${RED}❌ 無法訪問數據庫${NC}"
fi

# 總結
echo ""
echo "======================================"
echo "   檢查完成"
echo "======================================"

if [ -n "$WS_PROCESS" ] && [ -n "$WS_PORT" ] && [ -n "$INTERNAL_PORT" ]; then
    echo -e "${GREEN}✅ WebSocket 服務運行正常${NC}"
    echo ""
    echo "測試連線："
    echo "  websocat ws://localhost:8080"
    echo ""
    echo "查看日誌："
    echo "  docker compose exec backend tail -f /var/www/html/writable/logs/websocket.log"
    echo ""
    echo "前端管理介面："
    echo "  http://localhost:3000 -> 排程器管理頁面"
    exit 0
else
    echo -e "${YELLOW}⚠️  WebSocket 服務存在問題${NC}"
    echo ""
    echo "啟動服務："
    echo "  docker compose exec -d backend bash -c \"nohup php spark ws:start > /var/www/html/writable/logs/websocket.log 2>&1 &\""
    echo ""
    echo "查看日誌："
    echo "  docker compose logs -f backend"
    exit 1
fi
