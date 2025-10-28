"""Utility to validate core Alembic migrations and detect schema drift."""

from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path
from typing import Iterable, Iterator, List, Sequence

from alembic import command
from alembic.autogenerate import api as autogen_api
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import MetaData, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.schema import Column

TARGET_REVISION = "0006_billing"
TARGET_TABLES: Sequence[str] = (
    "auth_users",
    "inv_categories",
    "inv_items",
    "inv_bundles",
    "inv_bundle_items",
    "inv_maintenance_logs",
    "prj_projects",
    "prj_project_items",
    "crew_members",
    "crew_bookings",
    "calendar_accounts",
    "veh_vehicles",
    "veh_drivers",
    "veh_routes",
    "veh_route_stops",
    "bil_invoices",
    "bil_payments",
)
MODULES: Sequence[str] = (
    "app.modules.auth.models",
    "app.modules.inventory.models",
    "app.modules.projects.models",
    "app.modules.crew.models",
    "app.modules.calendar_sync.models",
    "app.modules.transport.models",
    "app.modules.billing.models",
)
DEFAULT_DB_FILENAME = "alembic_validation.db"


def _project_paths() -> Path:
    return Path(__file__).resolve().parent.parent


def _ensure_environment(backend_dir: Path) -> str:
    """Ensure a usable DATABASE_URL and supporting environment variables."""

    os.environ.setdefault("JWT_SECRET", "dev-secret-for-validation")
    os.environ.setdefault("ENV", "dev")

    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url

    tmp_dir = backend_dir / ".tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    db_path = tmp_dir / DEFAULT_DB_FILENAME
    if db_path.exists():
        db_path.unlink()

    database_url = f"sqlite:///{db_path}".replace("\\", "/")
    os.environ["DATABASE_URL"] = database_url
    return database_url


def _configure_alembic(backend_dir: Path, database_url: str) -> Config:
    """Return an Alembic config wired up for the local repository layout."""

    alembic_dir = backend_dir / "alembic"
    cfg = Config(str(alembic_dir / "alembic.ini"))
    cfg.set_main_option("script_location", str(alembic_dir))
    cfg.set_main_option("sqlalchemy.url", database_url)
    return cfg


def _load_metadata() -> MetaData:
    """Load SQLAlchemy models for the targeted tables."""

    for module in MODULES:
        importlib.import_module(module)

    from app.core.db import Base  # Imported lazily after adjusting sys.path

    metadata = MetaData()
    for name in TARGET_TABLES:
        table = Base.metadata.tables.get(name)
        if table is None:
            raise RuntimeError(f"Table '{name}' is not defined in ORM metadata")
        table.to_metadata(metadata)
    return metadata


def _flatten_diffs(diffs: Iterable[object]) -> Iterator[tuple]:
    for diff in diffs:
        if isinstance(diff, list | tuple) and diff and isinstance(diff[0], (list, tuple)):
            yield from _flatten_diffs(diff)
        else:
            if isinstance(diff, tuple):
                yield diff
            elif isinstance(diff, list):
                for item in diff:
                    if isinstance(item, tuple):
                        yield item
                    else:
                        yield from _flatten_diffs([item])


def _describe_default(column: Column) -> str | None:
    if column.server_default is not None:
        default = column.server_default.arg
        if hasattr(default, "text"):
            return f"server_default={default.text}"  # TextClause
        return f"server_default={default!r}"
    if column.default is not None:
        default = column.default.arg
        return f"default={default!r}"
    return None


def _render_clause_default(default: object) -> str:
    if default is None:
        return "None"
    if hasattr(default, "arg"):
        value = default.arg
        if hasattr(value, "text"):
            return value.text
        return repr(value)
    if hasattr(default, "text"):
        return default.text
    return repr(default)


def _describe_diff(diff: tuple, engine: Engine) -> str:
    op_type = diff[0]

    if op_type == "add_column":
        _, _schema, table_name, column = diff
        col_type = column.type.compile(dialect=engine.dialect)
        nullability = "NOT NULL" if not column.nullable else "NULLABLE"
        default = _describe_default(column)
        details = f"{table_name}.{column.name}: add {col_type} ({nullability})"
        if default:
            details += f" with {default}"
        return details

    if op_type == "modify_nullable":
        _, _schema, table_name, column_name, _params, current_nullable, expected_nullable = diff
        return (
            f"{table_name}.{column_name}: nullability differs (database={current_nullable}, "
            f"models expect {expected_nullable})"
        )

    if op_type == "modify_default":
        _, _schema, table_name, column_name, _params, existing, expected = diff
        return (
            f"{table_name}.{column_name}: server default differs (database={_render_clause_default(existing)}, "
            f"models expect {_render_clause_default(expected)})"
        )

    if op_type == "add_index":
        _, index = diff
        columns = ", ".join(column.name for column in index.columns)
        kind = "Unique index" if index.unique else "Index"
        return f"{kind} {index.name} on ({columns}) is missing"

    if op_type == "add_constraint":
        _, constraint = diff
        columns = ", ".join(column.name for column in constraint.columns)
        name = constraint.name or "(unnamed)"
        return f"Constraint {name} on ({columns}) is missing"

    return f"Unhandled diff: {diff}"  # Fallback for unexpected operations


def _detect_schema_drift(engine: Engine) -> List[str]:
    metadata = _load_metadata()
    with engine.connect() as connection:
        context = MigrationContext.configure(
            connection, opts={"compare_type": True, "compare_server_default": True}
        )
        migration_script = autogen_api.produce_migrations(context, metadata)
    raw_diffs = list(_flatten_diffs(migration_script.upgrade_ops.as_diffs()))
    return [_describe_diff(diff, engine) for diff in raw_diffs]


def main() -> int:
    backend_dir = _project_paths()
    sys.path.insert(0, str(backend_dir))

    database_url = _ensure_environment(backend_dir)
    cfg = _configure_alembic(backend_dir, database_url)

    url = make_url(database_url)
    if url.get_backend_name() == "sqlite" and url.database:
        db_file = Path(url.database)
        db_file.parent.mkdir(parents=True, exist_ok=True)

    print(f"Using database URL: {database_url}")
    print(f"Applying migrations up to {TARGET_REVISION}...")
    command.downgrade(cfg, "base")
    command.upgrade(cfg, TARGET_REVISION)

    engine = create_engine(database_url)
    drift = _detect_schema_drift(engine)

    if not drift:
        print("✅ No schema drift detected for migrations 0001-0006.")
        return 0

    print("⚠️ Schema drift detected between ORM models and migrations 0001-0006:")
    for entry in drift:
        print(f" - {entry}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
