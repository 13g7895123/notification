# ===========================================
# 前端 - 多階段建構
# ===========================================

# 階段 1: 建構
FROM node:20-alpine AS builder

WORKDIR /app

# 接收建構參數
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製原始碼
COPY . .

# 建構
RUN npm run build

# ===========================================
# 階段 2: 生產環境
# ===========================================
FROM nginx:alpine

# 複製 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 複製建構產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 開放 Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
