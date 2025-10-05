from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.core.db import Base
from app.modules.auth.models import User

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = os.getenv("DATABASE_URL", "postgresql+psycopg://rentguy:rentguy@db:5432/rentguy")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config({}, prefix="sqlalchemy.", poolclass=pool.NullPool, url=os.getenv("DATABASE_URL", "postgresql+psycopg://rentguy:rentguy@db:5432/rentguy"))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
