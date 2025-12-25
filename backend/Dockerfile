# ===========================================
# CodeIgniter 4 - PHP 8.3 FPM Alpine
# ===========================================
FROM php:8.3-fpm-alpine

# 安裝系統依賴和 PHP 擴展
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    zip \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    intl \
    mbstring \
    zip \
    opcache \
    && rm -rf /var/cache/apk/*

# 安裝 Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 設定 nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/http.d/default.conf

# 設定 supervisor
COPY docker/supervisord.conf /etc/supervisord.conf

# 設定 PHP
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# 設定工作目錄
WORKDIR /var/www/html

# 複製應用程式
COPY . .

# 設定權限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/writable

# 安裝 Composer 依賴
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 開放 Port
EXPOSE 80

# 啟動 supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
