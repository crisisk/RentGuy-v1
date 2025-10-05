FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY backend_start.sh ./backend_start.sh
RUN chmod +x backend_start.sh

ENV PYTHONUNBUFFERED=1

CMD ["./backend_start.sh"]
