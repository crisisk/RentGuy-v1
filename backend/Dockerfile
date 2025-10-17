FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app
COPY alembic ./alembic

# Copy startup script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Run the application with migrations
CMD ["./docker-entrypoint.sh"]
