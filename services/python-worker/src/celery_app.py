from celery import Celery
from src.config.settings import settings

app = Celery('sonantica')

# Configure app using modern lowercase settings directly
app.conf.update(
    broker_url=settings.redis_url,
    result_backend=settings.redis_url,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_send_sent_event=True,
    worker_send_task_events=True,
    task_track_started=True,
    imports=(
        'src.infrastructure.tasks.process_audio_tasks',
        'src.infrastructure.tasks.process_analytics_tasks',
    )
)

# Auto-discover tasks from the tasks directory
app.autodiscover_tasks(['src.infrastructure.tasks'], force=True)

if __name__ == '__main__':
    app.start()
