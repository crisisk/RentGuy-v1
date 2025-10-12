from __future__ import annotations

from collections.abc import Generator
from dataclasses import dataclass
from pathlib import Path
import sys
import types

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure opentelemetry dependencies do not block tests when optional packages are missing


def _install_otel_stubs() -> None:
    if 'opentelemetry' in sys.modules:
        return

    trace_module = types.ModuleType('opentelemetry.trace')

    def _set_tracer_provider(provider) -> None:  # pragma: no cover - trivial stub
        trace_module._provider = provider

    trace_module.set_tracer_provider = _set_tracer_provider

    otel_module = types.ModuleType('opentelemetry')
    otel_module.trace = trace_module

    exporter_module = types.ModuleType('opentelemetry.exporter')
    otlp_module = types.ModuleType('opentelemetry.exporter.otlp')
    proto_module = types.ModuleType('opentelemetry.exporter.otlp.proto')
    http_module = types.ModuleType('opentelemetry.exporter.otlp.proto.http')
    trace_exporter_module = types.ModuleType('opentelemetry.exporter.otlp.proto.http.trace_exporter')

    class _DummyExporter:
        def __init__(self, *args, **kwargs) -> None:  # pragma: no cover - trivial stub
            pass

    trace_exporter_module.OTLPSpanExporter = _DummyExporter

    instrumentation_module = types.ModuleType('opentelemetry.instrumentation')
    fastapi_module = types.ModuleType('opentelemetry.instrumentation.fastapi')

    class _FastAPIInstrumentor:
        @staticmethod
        def instrument_app(*args, **kwargs) -> None:  # pragma: no cover - trivial stub
            return None

    fastapi_module.FastAPIInstrumentor = _FastAPIInstrumentor
    instrumentation_module.fastapi = fastapi_module

    resources_module = types.ModuleType('opentelemetry.sdk.resources')

    class _Resource:
        @staticmethod
        def create(mapping):  # pragma: no cover - trivial stub
            return mapping

    resources_module.Resource = _Resource

    sdk_trace_module = types.ModuleType('opentelemetry.sdk.trace')

    class _TracerProvider:
        def __init__(self, *args, **kwargs) -> None:  # pragma: no cover - trivial stub
            self.processors = []

        def add_span_processor(self, processor) -> None:
            self.processors.append(processor)

    sdk_trace_module.TracerProvider = _TracerProvider

    sdk_trace_export_module = types.ModuleType('opentelemetry.sdk.trace.export')

    class _BatchSpanProcessor:
        def __init__(self, exporter) -> None:  # pragma: no cover - trivial stub
            self.exporter = exporter

    sdk_trace_export_module.BatchSpanProcessor = _BatchSpanProcessor

    sys.modules['opentelemetry'] = otel_module
    sys.modules['opentelemetry.trace'] = trace_module
    sys.modules['opentelemetry.exporter'] = exporter_module
    sys.modules['opentelemetry.exporter.otlp'] = otlp_module
    sys.modules['opentelemetry.exporter.otlp.proto'] = proto_module
    sys.modules['opentelemetry.exporter.otlp.proto.http'] = http_module
    sys.modules['opentelemetry.exporter.otlp.proto.http.trace_exporter'] = trace_exporter_module
    sys.modules['opentelemetry.instrumentation'] = instrumentation_module
    sys.modules['opentelemetry.instrumentation.fastapi'] = fastapi_module
    sys.modules['opentelemetry.sdk'] = types.ModuleType('opentelemetry.sdk')
    sys.modules['opentelemetry.sdk.resources'] = resources_module
    sys.modules['opentelemetry.sdk.trace'] = sdk_trace_module
    sys.modules['opentelemetry.sdk.trace.export'] = sdk_trace_export_module


_install_otel_stubs()

# Ensure models are imported so metadata is populated before accessing the FastAPI app
import app.modules.inventory.models  # noqa: F401
import app.modules.projects.models  # noqa: F401

from app.core.db import Base
from app.main import app
from app.modules.auth import deps as auth_deps


def create_test_engine():
    return create_engine(
        'sqlite://',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_test_engine()
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@dataclass
class DummyUser:
    role: str
    email: str = 'test@rentguy.local'


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            db_session.rollback()

    app.dependency_overrides[auth_deps.get_db] = override_get_db
    app.dependency_overrides[auth_deps.get_current_user] = lambda: DummyUser(role='admin')

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
