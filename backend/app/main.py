import sys
from pathlib import Path

# Ensure project root and backend are on sys.path
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent
_project_root = _backend_dir.parent

for _p in [str(_current_dir), str(_backend_dir), str(_project_root)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.projects import router as projects_router
from app.api.v1.upload import router as upload_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.reports import router as reports_router
from app.api.v1.pipeline import router as pipeline_router
from app.api.v1.disaster import router as disaster_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API V1 routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(auth_router, prefix=settings.API_V1_STR, tags=["Auth"])
app.include_router(projects_router, prefix=settings.API_V1_STR, tags=["Projects"])
app.include_router(upload_router, prefix=settings.API_V1_STR, tags=["Data Ingestion"])
app.include_router(analysis_router, prefix=settings.API_V1_STR, tags=["Analysis Engine"])
app.include_router(disaster_router, prefix=settings.API_V1_STR, tags=["Disaster Intelligence"])
app.include_router(reports_router, prefix=settings.API_V1_STR, tags=["Reports Engine"])
app.include_router(pipeline_router, prefix=settings.API_V1_STR, tags=["Pipeline Engine"])

import os
from fastapi.staticfiles import StaticFiles

# Ensure upload directory exists
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
async def startup_event():
    from app.db.mongodb import init_mongodb
    await init_mongodb()

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "auth": f"{settings.API_V1_STR}/register",
        "projects": f"{settings.API_V1_STR}/projects",
        "upload": f"{settings.API_V1_STR}/upload/init",
        "analysis": f"{settings.API_V1_STR}/analysis/run",
        "reports": f"{settings.API_V1_STR}/reports/generate",
    }
