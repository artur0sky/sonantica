from celery import shared_task
from ...config.settings import settings
from ...application.usecases.analyze_audio import AnalyzeAudioUseCase
from ...infrastructure.database.repositories.audio_repository import AudioRepository
from ...infrastructure.logging.context import set_trace_id
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger("AudioWorker")

engine = create_engine(settings.postgres_url_sa)
SessionLocal = sessionmaker(bind=engine)
audio_repo = AudioRepository(SessionLocal)
analyze_use_case = AnalyzeAudioUseCase(audio_repo)

@shared_task(name="sonantica.analyze_audio", bind=True, max_retries=3)
def analyze_audio_task(self, job_data):
    trace_id = set_trace_id(job_data.get("trace_id"))
    try:
        return analyze_use_case.execute(job_data)
    except Exception as e:
        logger.error(f"Analysis Task Error: {e}", extra={"trace_id": trace_id})
        raise self.retry(exc=e, countdown=10)
