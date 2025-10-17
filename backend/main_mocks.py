"""
RentGuy Mock API Server for Staging/Testing
Serves all mock endpoints without requiring full database setup
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="RentGuy Mock API",
    version="1.0.0",
    description="Mock backend for RentGuy staging deployment"
)

# Configure CORS to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "rentguy-mock-api"}

# Import and mount all mock routers
try:
    from mocks.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load auth router: {e}")

try:
    from mocks.projects import router as projects_router
    app.include_router(projects_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load projects router: {e}")

try:
    from mocks.crm import crm_router
    app.include_router(crm_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load crm router: {e}")

try:
    from mocks.finance import router as finance_router
    app.include_router(finance_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load finance router: {e}")

try:
    from mocks.admin import admin_router
    app.include_router(admin_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load admin router: {e}")

try:
    from mocks.crew import router as crew_router
    app.include_router(crew_router, prefix="/api/v1")
except Exception as e:
    print(f"Warning: Could not load crew router: {e}")

@app.get("/")
def root():
    return {
        "message": "RentGuy Mock API Server",
        "version": "1.0.0",
        "endpoints": [
            "/api/v1/auth/*",
            "/api/v1/projects/*",
            "/api/v1/crm/*",
            "/api/v1/finance/*",
            "/api/v1/admin/*",
            "/api/v1/crew/*",
        ],
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
