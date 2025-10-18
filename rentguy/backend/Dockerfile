FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1     PIP_NO_CACHE_DIR=off     APP_PORT=8001

WORKDIR /app
RUN apt-get update && apt-get install -y build-essential curl libpq-dev && rm -rf /var/lib/apt/lists/*

# install requirements first for better caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# copy everything
COPY . /app

# Alembic config
ENV ALEMBIC_CONFIG=alembic/alembic.ini

# entrypoint: snapshot -> alembic upgrade -> uvicorn
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8001
CMD ["entrypoint.sh"]
