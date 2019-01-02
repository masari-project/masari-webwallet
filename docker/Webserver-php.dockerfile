FROM php:7.2-fpm-alpine

RUN set -ex && docker-php-ext-install opcache

WORKDIR /var/www/html
ADD ./docker/php.ini /usr/local/etc/php/conf.d/zz.ini
ADD ./src_api/ .
RUN chown -R www-data /var/www/html

RUN mkdir /cache && chmod 777 /cache
VOLUME /cache