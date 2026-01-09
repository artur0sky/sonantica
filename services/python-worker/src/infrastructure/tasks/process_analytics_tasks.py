from celery import shared_task
from ...config.settings import settings
from ...application.usecases.process_analytics import ProcessAnalyticsUseCase
from ...infrastructure.database.repositories.analytics_repository import AnalyticsRepository
from ...infrastructure.logging.context import set_trace_id
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger("AudioWorker")

engine = create_engine(settings.postgres_url_sa)
SessionLocal = sessionmaker(bind=engine)
analytics_repo = AnalyticsRepository(SessionLocal)
analytics_use_case = ProcessAnalyticsUseCase(analytics_repo)

@shared_task(name="sonantica.process_analytics", bind=True, max_retries=5)
def process_analytics_task(self, event_data):
    trace_id = set_trace_id(event_data.get("traceId"))
    try:
        return analytics_use_case.execute(event_data)
    except Exception as e:
        logger.error(f"Analytics Task Error: {e}", extra={"trace_id": trace_id})
        raise self.retry(exc=e, countdown=5)

@shared_task(name="sonantica.process_analytics_batch", bind=True, max_retries=5)
def process_analytics_batch_task(self, batch_events):
    # For batches, we don't have a single trace ID usually, 
    # but we can set one for the batch process itself
    set_trace_id() 
    try:
        return analytics_use_case.execute_batch(batch_events)
    except Exception as e:
        logger.error(f"Analytics Batch Task Error: {e}")
        raise self.retry(exc=e, countdown=5)
