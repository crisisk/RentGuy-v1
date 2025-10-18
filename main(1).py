from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from app.core.errors import AppError, app_error_handler
from app.core.config import settings

setup_logging()
app = FastAPI(title="Rentguyapp API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

@app.get("/healthz")
def healthz():
    return {"status":"ok"}

@app.get("/readyz")
def readyz():
    return {"status":"ready"}

# Mount module routers
from app.modules.auth.routes import router as auth_router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

from app.modules.inventory.routes import router as inventory_router
app.include_router(inventory_router, prefix="/api/v1/inventory", tags=["inventory"])

from app.modules.projects.routes import router as projects_router
app.include_router(projects_router, prefix="/api/v1", tags=["projects"])

from app.modules.calendar_sync.routes import router as calendar_router
app.include_router(calendar_router, prefix="/api/v1", tags=["calendar"])

from app.modules.crew.routes import router as crew_router
app.include_router(crew_router, prefix="/api/v1", tags=["crew"])

from app.modules.transport.routes import router as transport_router
app.include_router(transport_router, prefix="/api/v1", tags=["transport"])

from app.modules.billing.routes import router as billing_router
app.include_router(billing_router, prefix="/api/v1", tags=["billing"])

from app.modules.warehouse.routes import router as warehouse_router
app.include_router(warehouse_router, prefix="/api/v1", tags=["warehouse"])

from app.modules.reporting.routes import router as reporting_router
app.include_router(reporting_router, prefix="/api/v1", tags=["reporting"])

from app.modules.onboarding.routes import router as onboarding_router
app.include_router(onboarding_router, prefix="/api/v1", tags=["onboarding"])
