FROM nginx:1.13-alpine

ADD ./docker/nginx.conf /etc/nginx/conf.d/default.conf
ADD ./src/ /var/www/html
RUN chown -R nginx /var/www/html