from celery import Celery
from src.infrastructure.config import settings

def create_celery_app():
    celery = Celery(
        "sonantica_downloader",
        broker=f"redis://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}/0",
        backend=f"redis://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}/0",
        include=["src.application.tasks"]
    )

    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=3600, # 1 hour
        task_default_queue="downloader",
    )
    
    return celery

celery_app = create_celery_app()
