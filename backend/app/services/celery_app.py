from app.core.config import settings

try:
    from celery import Celery

    celery_app = Celery(
        "corvus_tasks",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )

    @celery_app.task(name="ping_task")
    def ping_task():
        return {"status": "pong", "message": "Celery worker active"}

except ImportError:
    celery_app = None
