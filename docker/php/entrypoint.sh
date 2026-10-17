#!/bin/sh
set -e
cd /var/www/html

[ -d vendor ] || composer install --no-interaction --prefer-dist
grep -q '^APP_KEY=base64' .env || php artisan key:generate --force

mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 777 storage bootstrap/cache

php artisan config:clear
php artisan migrate --force

# Демо-данные только в пустую базу, чтобы перезапуск не стирал данные
if [ "$(php artisan tinker --execute='echo \App\Models\User::count();')" = "0" ]; then
  php artisan db:seed --force
  php artisan db:seed --class=DemoSeeder --force || echo "WARN: демо-данные не загружены"
fi

exec "$@"