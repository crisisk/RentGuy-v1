from __future__ import annotations

from collections.abc import Generator
from dataclasses import dataclass
from pathlib import Path
import importlib.metadata as importlib_metadata
import os
import sys
import types

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.types import UserDefinedType

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

# Provide light-weight stand-ins for optional geoalchemy2 dependency that is not
# required for the current test-suite but imported by several modules.
def _install_geoalchemy_stubs() -> None:
    if 'geoalchemy2' in sys.modules:
        return

    geoalchemy_module = types.ModuleType('geoalchemy2')

    class _Geometry(UserDefinedType):
        def __init__(self, *args, **kwargs) -> None:  # pragma: no cover - trivial stub
            self.args = args
            self.kwargs = kwargs

        def get_col_spec(self, **kwargs):  # pragma: no cover - trivial stub
            return "GEOMETRY"

    class _WKBElement:
        def __init__(self, data=None, srid: int | None = None) -> None:  # pragma: no cover - trivial stub
            self.data = data
            self.srid = srid

    geoalchemy_module.Geometry = _Geometry
    geoalchemy_module.WKBElement = _WKBElement

    elements_module = types.ModuleType('geoalchemy2.elements')

    class _WKTElement(str):
        pass

    elements_module.WKTElement = _WKTElement

    shape_module = types.ModuleType('geoalchemy2.shape')

    def _from_shape(shape, srid=None):  # pragma: no cover - trivial stub
        return shape

    shape_module.from_shape = _from_shape

    sys.modules['geoalchemy2'] = geoalchemy_module
    sys.modules['geoalchemy2.elements'] = elements_module
    sys.modules['geoalchemy2.shape'] = shape_module


_install_geoalchemy_stubs()

# Provide lightweight stub for optional email_validator dependency required by pydantic
def _install_email_validator_stub() -> None:
    if 'email_validator' in sys.modules:
        return

    module = types.ModuleType('email_validator')

    class _EmailNotValidError(ValueError):
        pass

    def _validate_email(email, *_args, **_kwargs):  # pragma: no cover - trivial stub
        return types.SimpleNamespace(email=email, original_email=email, local_part=email)

    module.EmailNotValidError = _EmailNotValidError
    module.validate_email = _validate_email
    sys.modules['email_validator'] = module

    original_version = importlib_metadata.version
    original_discover = importlib_metadata.Distribution.discover

    def _version(name: str) -> str:  # pragma: no cover - simple shim
        if name == 'email-validator':
            return '2.0.0'
        return original_version(name)

    @classmethod
    def _discover(cls, **kwargs):  # pragma: no cover - simple shim
        if kwargs.get('name') == 'email-validator':
            yield types.SimpleNamespace(version='2.0.0')
        else:
            yield from original_discover.__func__(cls, **kwargs)  # type: ignore[attr-defined]

    importlib_metadata.version = _version  # type: ignore[assignment]
    importlib_metadata.Distribution.discover = _discover  # type: ignore[assignment]


_install_email_validator_stub()

# Provide sensible defaults for configuration values expected by the settings model
os.environ.setdefault('DATABASE_URL', 'sqlite://')
os.environ.setdefault('JWT_SECRET', 'test-secret')
os.environ.setdefault('MRDJ_SSO_AUTHORITY', 'https://login.test/tenant')
os.environ.setdefault('MRDJ_SSO_CLIENT_ID', 'test-client-id')
os.environ.setdefault('MRDJ_SSO_REDIRECT_URI', 'https://mr-dj.nl/auth/callback')
os.environ.setdefault('MRDJ_PLATFORM_REDIRECT_URL', 'https://mr-dj.rentguy.nl/crm')
os.environ.setdefault('MRDJ_LEAD_CAPTURE_CAPTCHA_ENDPOINT', 'https://captcha.test/verify')
os.environ.setdefault('MRDJ_LEAD_CAPTURE_CAPTCHA_SECRET', 'dummy-secret')

# Ensure models are imported so metadata is populated before accessing the FastAPI app
import app.modules.auth.models  # noqa: F401
import app.modules.chat.models  # noqa: F401
import app.modules.crew.models  # noqa: F401
import app.modules.inventory.models  # noqa: F401
import app.modules.projects.models  # noqa: F401
import app.modules.platform.secrets.models  # noqa: F401
import app.modules.crm.models  # noqa: F401
import app.modules.jobboard.models  # noqa: F401
import app.modules.subrenting.models  # noqa: F401

from app.core.db import Base


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
    from app.main import app
    from app.modules.auth import deps as auth_deps

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


@pytest.fixture
def anyio_backend():
    """Force AnyIO-based tests to run on asyncio only during unit tests."""

    return "asyncio"
