from celery import shared_task
from ...config.settings import settings
from ...application.usecases.analyze_audio import AnalyzeAudioUseCase
from ...infrastructure.database.repositories.audio_repository import AudioRepository
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
    try:
        return analyze_use_case.execute(job_data)
    except Exception as e:
        logger.error(f"Analysis Task Error: {e}")
        raise self.retry(exc=e, countdown=10)
