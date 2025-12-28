#!/bin/bash

# ===========================================
# phpMyAdmin 診斷腳本
# 用於排查 PMA_ABSOLUTE_URI 設定問題
# ===========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo " phpMyAdmin 診斷工具"
echo "=========================================="
echo ""

# 1. 檢查 .env 檔案中的 PMA_ABSOLUTE_URI
echo -e "${BLUE}[1/6] 檢查 .env 檔案中的 PMA_ABSOLUTE_URI${NC}"
if [ -f .env ]; then
    PMA_URI=$(grep "^PMA_ABSOLUTE_URI" .env | cut -d'=' -f2-)
    if [ -z "$PMA_URI" ]; then
        echo -e "${RED}  ✗ PMA_ABSOLUTE_URI 未設定！${NC}"
        echo -e "${YELLOW}  → 請在 .env 中新增: PMA_ABSOLUTE_URI=https://notify.try-8verything.com/pma/${NC}"
    else
        echo -e "  目前值: ${YELLOW}${PMA_URI}${NC}"
        if [[ "$PMA_URI" == *"/pma/"* ]]; then
            echo -e "${GREEN}  ✓ 設定正確（包含 /pma/ 路徑）${NC}"
        else
            echo -e "${RED}  ✗ 設定可能不正確，應該包含 /pma/ 路徑${NC}"
            echo -e "${YELLOW}  → 應該設定為: https://notify.try-8verything.com/pma/${NC}"
        fi
    fi
else
    echo -e "${RED}  ✗ 找不到 .env 檔案！${NC}"
fi

echo ""

# 2. 檢查 phpMyAdmin 容器是否運行
echo -e "${BLUE}[2/6] 檢查 phpMyAdmin 容器狀態${NC}"
CONTAINER_STATUS=$(docker compose ps phpmyadmin --format "{{.Status}}" 2>/dev/null)
if [ -z "$CONTAINER_STATUS" ]; then
    echo -e "${RED}  ✗ phpMyAdmin 容器未運行${NC}"
else
    echo -e "  狀態: ${GREEN}${CONTAINER_STATUS}${NC}"
fi

echo ""

# 3. 檢查容器內的環境變數
echo -e "${BLUE}[3/6] 檢查容器內的 PMA_ABSOLUTE_URI 環境變數${NC}"
CONTAINER_PMA_URI=$(docker compose exec -T phpmyadmin printenv PMA_ABSOLUTE_URI 2>/dev/null)
if [ -z "$CONTAINER_PMA_URI" ]; then
    echo -e "${RED}  ✗ 容器內 PMA_ABSOLUTE_URI 未設定${NC}"
else
    echo -e "  容器內環境變數: ${YELLOW}${CONTAINER_PMA_URI}${NC}"
    if [[ "$CONTAINER_PMA_URI" == *"/pma/"* ]]; then
        echo -e "${GREEN}  ✓ 容器環境變數正確${NC}"
    else
        echo -e "${RED}  ✗ 容器環境變數不正確，需要重啟容器${NC}"
    fi
fi

echo ""

# 4. 比較 .env 和容器內的設定
echo -e "${BLUE}[4/6] 比較 .env 與容器內設定${NC}"
if [ "$PMA_URI" != "$CONTAINER_PMA_URI" ]; then
    echo -e "${RED}  ✗ .env 與容器內設定不一致！${NC}"
    echo -e "     .env 設定:    ${PMA_URI}"
    echo -e "     容器內設定:   ${CONTAINER_PMA_URI}"
    echo -e "${YELLOW}  → 需要重啟容器: docker compose up -d phpmyadmin${NC}"
else
    if [ -n "$PMA_URI" ]; then
        echo -e "${GREEN}  ✓ 設定一致${NC}"
    fi
fi

echo ""

# 5. 檢查 phpMyAdmin 的 HTML 輸出
echo -e "${BLUE}[5/6] 檢查 phpMyAdmin 生成的資源路徑${NC}"
HTML_CONTENT=$(curl -s http://localhost:9303/ | head -50)
CSS_PATH=$(echo "$HTML_CONTENT" | grep -oP 'href="[^"]*jquery-ui\.css[^"]*"' | head -1)
if [ -z "$CSS_PATH" ]; then
    echo -e "${YELLOW}  無法取得 CSS 路徑，phpMyAdmin 可能未正常回應${NC}"
else
    echo -e "  CSS 路徑: ${YELLOW}${CSS_PATH}${NC}"
    if [[ "$CSS_PATH" == *"/pma/"* ]]; then
        echo -e "${GREEN}  ✓ 路徑正確（包含 /pma/）${NC}"
    else
        echo -e "${RED}  ✗ 路徑不正確（應該包含 /pma/）${NC}"
    fi
fi

echo ""

# 6. 容器啟動時間
echo -e "${BLUE}[6/6] 容器資訊${NC}"
CONTAINER_ID=$(docker compose ps -q phpmyadmin 2>/dev/null)
if [ -n "$CONTAINER_ID" ]; then
    CREATED=$(docker inspect --format='{{.Created}}' "$CONTAINER_ID" 2>/dev/null)
    echo -e "  容器建立時間: ${YELLOW}${CREATED}${NC}"
    echo -e "  容器 ID: ${CONTAINER_ID:0:12}"
fi

echo ""
echo "=========================================="
echo " 診斷結果"
echo "=========================================="
echo ""

# 總結建議
if [[ "$PMA_URI" != *"/pma/"* ]] || [[ "$CONTAINER_PMA_URI" != *"/pma/"* ]]; then
    echo -e "${RED}問題: PMA_ABSOLUTE_URI 設定不正確${NC}"
    echo ""
    echo "請執行以下修復步驟:"
    echo ""
    echo -e "${YELLOW}# 1. 修改 .env 檔案${NC}"
    echo "sed -i 's|^PMA_ABSOLUTE_URI=.*|PMA_ABSOLUTE_URI=https://notify.try-8verything.com/pma/|' .env"
    echo ""
    echo -e "${YELLOW}# 2. 重啟 phpMyAdmin 容器${NC}"
    echo "docker compose up -d phpmyadmin"
    echo ""
    echo -e "${YELLOW}# 3. 確認修復${NC}"
    echo "./diagnose-pma.sh"
elif [ "$PMA_URI" != "$CONTAINER_PMA_URI" ]; then
    echo -e "${RED}問題: .env 已更新但容器尚未重啟${NC}"
    echo ""
    echo "請執行:"
    echo "docker compose up -d phpmyadmin"
else
    echo -e "${GREEN}✓ 設定看起來正確！${NC}"
    echo ""
    echo "如果問題仍然存在，可能是瀏覽器快取問題。"
    echo "請嘗試清除瀏覽器快取或使用無痕模式。"
fi

echo ""
