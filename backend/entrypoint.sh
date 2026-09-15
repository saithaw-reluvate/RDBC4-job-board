#!/bin/sh
# Production entrypoint only -- invoked by docker-compose.prod.yml, which sets
# it explicitly (`entrypoint: ["sh", "/app/entrypoint.sh"]`). The dev
# docker-compose.yml does not reference this file at all, so backend/Dockerfile
# and the dev workflow (manage.py runserver, manual migrate) are unaffected.
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
