# ===========================================
# CodeIgniter 4 - PHP 8.3 FPM Alpine
# ===========================================
FROM php:8.3-fpm-alpine

# 安裝系統依賴和 PHP 擴展
RUN apk add --no-cache \
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
    dcron \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    intl \
    mbstring \
    zip \
    opcache \
    && rm -rf /var/cache/apk/*

# 設定時區
ENV TZ=Asia/Taipei

# 安裝 Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 設定工作目錄
WORKDIR /var/www/html

# 複製 entrypoint 腳本 (由 docker-compose 掛載或複製)
# 注意：在開發環境通常使用 volumes 掛載原始碼，但在 Dockerfile 中 COPY 可以作為基礎

# 設定權限基礎 (開發環境會被 volume 蓋掉，但在生產環境有用)
# RUN chown -R www-data:www-data /var/www/html

# 開放 FastCGI Port
EXPOSE 9000

# 預設啟動命令會在 entrypoint 中處理
