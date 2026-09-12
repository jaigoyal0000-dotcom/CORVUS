from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

try:
    from minio import Minio
    HAS_MINIO_SDK = True
except ImportError:
    Minio = None
    HAS_MINIO_SDK = False

class MinIOService:
    def __init__(self):
        self.client = None
        if HAS_MINIO_SDK:
            try:
                self.client = Minio(
                    endpoint=settings.MINIO_ENDPOINT,
                    access_key=settings.MINIO_ACCESS_KEY,
                    secret_key=settings.MINIO_SECRET_KEY,
                    secure=settings.MINIO_USE_SSL,
                )
            except Exception as e:
                logger.warning(f"Could not initialize MinIO client: {e}")

    def check_health(self) -> dict:
        if not HAS_MINIO_SDK:
            return {"status": "configured", "sdk_installed": False, "endpoint": settings.MINIO_ENDPOINT}
        if not self.client:
            return {"status": "unavailable", "reason": "Client not initialized"}
        try:
            buckets = self.client.list_buckets()
            return {"status": "healthy", "buckets": [b.name for b in buckets]}
        except Exception as e:
            return {"status": "degraded", "error": str(e)}

    def ensure_bucket_exists(self, bucket_name: str = None) -> bool:
        target_bucket = bucket_name or settings.MINIO_BUCKET_NAME
        if not self.client:
            return False
        try:
            if not self.client.bucket_exists(target_bucket):
                self.client.make_bucket(target_bucket)
            return True
        except Exception as e:
            logger.error(f"Error ensuring MinIO bucket '{target_bucket}': {e}")
            return False

minio_service = MinIOService()
