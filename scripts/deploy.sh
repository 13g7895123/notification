#!/bin/bash

# ==============================================================================
# NotifyHub - Unified Deployment Script
# 
# Usage:
#   ./scripts/deploy.sh [environment]
#   ./scripts/deploy.sh build [blue|green]
#   ./scripts/deploy.sh switch [blue|green]
# 
# Example:
#   ./scripts/deploy.sh production
# ==============================================================================

set -e

# 切換到專案根目錄
cd "$(dirname "$0")/.."

COMMAND=$1
PARAM=$2

# ===========================================
# 功能：同步環境設定檔
# ===========================================
sync_env() {
    local target_env=$1
    local env_src="docker/envs/.env.$target_env"
    
    if [ ! -f "$env_src" ]; then
        echo "❌ Error: Environment file $env_src not found."
        exit 1
    fi
    
    echo "📝 Syncing environment files for [$target_env]..."
    cp "$env_src" .env
    cp .env backend/.env
    echo "✅ Environment files synced."
}

# ===========================================
# 功能：切換流量 (藍綠部署)
# ===========================================
switch_traffic() {
    local version=$1
    local nginx_conf="docker/frontend-proxy/conf.d/default.conf"
    
    echo "🔄 Switching traffic to [$version]..."
    
    if [ "$version" == "blue" ]; then
        sed -i 's/set $active_host "frontend-green";/set $active_host "frontend-blue";/g' "$nginx_conf"
    elif [ "$version" == "green" ]; then
        sed -i 's/set $active_host "frontend-blue";/set $active_host "frontend-green";/g' "$nginx_conf"
    else
        echo "❌ Error: Invalid version [$version]. Use blue or green."
        exit 1
    fi
    
    # 重啟 Nginx 以套用設定
    docker compose --env-file .env -f docker/docker-compose.yml up -d --force-recreate nginx
    echo "✅ Traffic switched to [$version]."
}

# ===========================================
# 主邏輯
# ===========================================
case "$COMMAND" in
    "production" | "development")
        sync_env "$COMMAND"
        echo "🐳 Starting Docker containers ($COMMAND)..."
        docker compose --env-file .env -f docker/docker-compose.yml down
        docker compose --env-file .env -f docker/docker-compose.yml up -d --build
        echo "🚀 Deployment successful!"
        ;;
        
    "build")
        # 僅用於 CI/CD 流程中的特定版本建構
        VERSION=$PARAM
        if [ "$VERSION" != "blue" ] && [ "$VERSION" != "green" ]; then
            echo "❌ Error: Build target must be blue or green."
            exit 1
        fi
        
        # 預設建構時同步最近一次的 .env (通常由 CI/CD 提前生成)
        echo "🏗️ Building frontend-$VERSION..."
        docker compose --env-file .env -f docker/docker-compose.yml up -d --build "frontend-$VERSION"
        ;;
        
    "switch")
        # 用於藍綠部署切換
        switch_traffic "$PARAM"
        ;;
        
    *)
        echo "Usage:"
        echo "  $0 [production|development]"
        echo "  $0 build [blue|green]"
        echo "  $0 switch [blue|green]"
        exit 1
        ;;
esac
