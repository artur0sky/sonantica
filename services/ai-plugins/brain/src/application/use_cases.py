import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional, List

from ..domain.entities import EmbeddingJob, JobStatus, HealthStatus
from ..domain.repositories import IJobRepository, IAudioEmbedder, IHealthProvider, IVectorRepository
from ..infrastructure.logging.context import set_trace_id, get_trace_id

logger = logging.getLogger(__name__)

class CreateEmbeddingJob:
    def __init__(self, repository: IJobRepository):
        self.repository = repository

    async def execute(self, track_id: str, file_path: str) -> EmbeddingJob:
        # Business Rule: Deduplication/Caching
        existing_job = await self.repository.find_by_track_id(track_id)
        if existing_job and existing_job.status in [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.PENDING]:
            logger.info(f"Using existing job {existing_job.id} for track {track_id}")
            return existing_job

        job = EmbeddingJob(
            id=str(uuid.uuid4()),
            track_id=track_id,
            file_path=file_path,
            status=JobStatus.PENDING
        )
        await self.repository.save(job)
        logger.info(f"Created embedding job {job.id} for track {track_id}")
        return job

class ProcessEmbeddingJob:
    _semaphore = asyncio.Semaphore(4) # Limit parallel heavy processing

    def __init__(self, repository: IJobRepository, embedder: IAudioEmbedder, vector_repo: IVectorRepository):
        self.repository = repository
        self.embedder = embedder
        self.vector_repo = vector_repo

    async def execute(self, job_id: str) -> None:
        set_trace_id(job_id) # Use job_id as trace_id for consistency
        async with self._semaphore:
            job = await self.repository.get_by_id(job_id)
        
        if not job or job.status != JobStatus.PENDING:
            logger.warning(f"SKIP | Job {job_id} not found or not pending (status: {job.status if job else 'N/A'})")
            return

        logger.info(f"START | Processing embedding for track {job.track_id} | Path: {job.file_path}")

        try:
            # Update to processing
            job = job.mark_processing()
            await self.repository.save(job)

            # Generate Embeddings (Heavy Task)
            embedding = await self.embedder.generate_embedding(job.file_path)
            model_version = self.embedder.get_model_version()

            # Complete Job
            job = job.mark_completed(embedding, model_version)
            await self.repository.save(job)
            
            # Persist to Vector Search Engine (Postgres)
            try:
                await self.vector_repo.save_embedding(
                    track_id=job.track_id,
                    embedding=embedding,
                    model_name=model_version
                )
            except Exception as ve:
                logger.error(f"FAIL | Vector storage | track={job.track_id} | Error: {ve}")
                # We don't fail the job if vector repo is down, but we log it
            
            logger.info(f"DONE | Successfully processed embedding for track {job.track_id}")

        except Exception as e:
            logger.exception(f"FAIL | Processing job {job_id} | Error: {str(e)}")
            job = job.mark_failed(str(e))
            await self.repository.save(job)

class GetJobStatus:
    def __init__(self, repository: IJobRepository):
        self.repository = repository

    async def execute(self, job_id: str) -> Optional[EmbeddingJob]:
        return await self.repository.get_by_id(job_id)

class GetHealth:
    def __init__(self, provider: IHealthProvider):
        self.provider = provider

    async def execute(self) -> HealthStatus:
        return await self.provider.get_status()

class GetRecommendations:
    def __init__(self, vector_repo: IVectorRepository):
        self.vector_repo = vector_repo

    async def execute(self, track_id: Optional[str] = None, limit: int = 10) -> List[dict]:
        if track_id:
            # Get similar tracks
            return await self.vector_repo.get_similar_tracks(track_id, limit)
        else:
            # Discovery mode
            return await self.vector_repo.get_discovery_tracks(limit)
