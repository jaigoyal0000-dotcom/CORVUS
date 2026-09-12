from fastapi import APIRouter
from app.core.config import settings
from app.services.minio_service import minio_service
from app.db.mongodb import check_mongodb_health

router = APIRouter()

@router.get("/health")
async def health_check():
    mongo_status = await check_mongodb_health()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "type": "MongoDB",
            "status": mongo_status.get("status"),
            "name": settings.MONGODB_DB_NAME,
        },
    }

@router.get("/health/mongodb")
async def mongodb_health():
    return await check_mongodb_health()

@router.get("/health/db")
async def db_health():
    # Primary active database: MongoDB
    mongo_status = await check_mongodb_health()
    return {
        "primary_database": "MongoDB",
        "mongodb": mongo_status,
        "secondary_postgres": {
            "service": "PostgreSQL / PostGIS",
            "configured_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL,
            "status": "configured",
        }
    }

@router.get("/health/minio")
async def minio_health():
    res = minio_service.check_health()
    return {
        "service": "MinIO Object Storage",
        "endpoint": settings.MINIO_ENDPOINT,
        "details": res,
    }

@router.get("/health/redis")
async def redis_health():
    try:
        import redis
        r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, socket_timeout=1)
        r.ping()
        return {"service": "Redis", "status": "healthy"}
    except ImportError:
        return {"service": "Redis", "status": "configured", "redis_sdk_installed": False}
    except Exception as e:
        return {"service": "Redis", "status": "unreachable", "error": str(e)}
