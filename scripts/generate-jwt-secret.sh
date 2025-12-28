#!/bin/bash
# ===========================================
# NotifyHub - 生成 JWT Secret 腳本
# ===========================================
# 用途：自動生成安全的 JWT Secret 並更新到 .env 檔案
# 使用方式：./scripts/generate-jwt-secret.sh [--force]
# ===========================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 取得腳本所在目錄的上層（專案根目錄）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# 顯示訊息函數
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 生成安全的 JWT Secret (64 字元的隨機字串)
generate_secret() {
    # 使用 openssl 生成 48 bytes 的隨機資料，然後 base64 編碼
    # 結果約 64 字元
    if command -v openssl &> /dev/null; then
        openssl rand -base64 48 | tr -d '\n'
    else
        # 備用方案：使用 /dev/urandom
        head -c 48 /dev/urandom | base64 | tr -d '\n'
    fi
}

# 檢查 .env 檔案是否存在
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            warning ".env 檔案不存在，從 .env.example 複製..."
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            success "已建立 .env 檔案"
        else
            error ".env 和 .env.example 都不存在！請先建立環境設定檔。"
        fi
    fi
}

# 取得目前的 JWT_SECRET 值
get_current_secret() {
    grep -E "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- || echo ""
}

# 更新 JWT_SECRET
update_secret() {
    local new_secret="$1"
    
    if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        # 使用 sed 替換現有的 JWT_SECRET
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$new_secret|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$new_secret|" "$ENV_FILE"
        fi
    else
        # 如果不存在，則新增
        echo "" >> "$ENV_FILE"
        echo "JWT_SECRET=$new_secret" >> "$ENV_FILE"
    fi
}

# 主程式
main() {
    echo ""
    echo "=========================================="
    echo "  NotifyHub - JWT Secret 生成工具"
    echo "=========================================="
    echo ""

    # 檢查參數
    FORCE=false
    if [ "$1" == "--force" ] || [ "$1" == "-f" ]; then
        FORCE=true
    fi

    # 檢查 .env 檔案
    check_env_file

    # 取得目前的 secret
    current_secret=$(get_current_secret)

    # 檢查是否為預設值或空值
    default_secret="your-super-secret-jwt-key-change-in-production"
    
    if [ -n "$current_secret" ] && [ "$current_secret" != "$default_secret" ] && [ "$FORCE" != true ]; then
        warning "JWT_SECRET 已經設定為非預設值。"
        echo ""
        echo "目前值: ${current_secret:0:20}..."
        echo ""
        read -p "是否要覆蓋現有的 JWT_SECRET？ (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            info "取消操作。"
            exit 0
        fi
    fi

    # 生成新的 secret
    info "生成新的 JWT Secret..."
    new_secret=$(generate_secret)

    # 更新 .env 檔案
    info "更新 .env 檔案..."
    update_secret "$new_secret"

    echo ""
    success "JWT Secret 已更新！"
    echo ""
    echo "=========================================="
    echo -e "新的 JWT_SECRET: ${GREEN}$new_secret${NC}"
    echo "=========================================="
    echo ""
    warning "請記住：更新 JWT Secret 後，所有現有的 Token 都會失效！"
    warning "如果是 Production 環境，請確保重新啟動後端服務。"
    echo ""
}

# 執行主程式
main "$@"
