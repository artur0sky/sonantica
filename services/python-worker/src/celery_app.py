from celery import Celery
from .config import celery_config

app = Celery('sonantica')
app.config_from_object(celery_config)

# Auto-discover tasks from the tasks directory
app.autodiscover_tasks(['src.infrastructure.tasks'], force=True)

if __name__ == '__main__':
    app.start()
