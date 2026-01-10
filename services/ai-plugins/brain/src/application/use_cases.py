import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional, List

from ..domain.entities import EmbeddingJob, JobStatus, HealthStatus
from ..domain.repositories import IJobRepository, IAudioEmbedder, IHealthProvider

logger = logging.getLogger(__name__)

class CreateEmbeddingJob:
    def __init__(self, repository: IJobRepository):
        self.repository = repository

    async def execute(self, track_id: str, file_path: str) -> EmbeddingJob:
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
    def __init__(self, repository: IJobRepository, embedder: IAudioEmbedder):
        self.repository = repository
        self.embedder = embedder

    async def execute(self, job_id: str) -> None:
        job = await self.repository.get_by_id(job_id)
        if not job or job.status != JobStatus.PENDING:
            return

        try:
            # Update to processing
            job = EmbeddingJob(
                **{**job.__dict__, "status": JobStatus.PROCESSING, "updated_at": datetime.now()}
            )
            await self.repository.save(job)

            # Generate Embeddings (Heavy Task)
            # We run this in a thread pool if it's not native async, but embedder should handle it
            embedding = await self.embedder.generate_embedding(job.file_path)
            model_version = self.embedder.get_model_version()

            # Complete Job
            job = EmbeddingJob(
                **{
                    **job.__dict__, 
                    "status": JobStatus.COMPLETED, 
                    "progress": 100.0,
                    "embedding": embedding,
                    "model_version": model_version,
                    "updated_at": datetime.now()
                }
            )
            await self.repository.save(job)
            logger.info(f"Successfully processed embedding job {job_id}")

        except Exception as e:
            logger.error(f"Failed to process job {job_id}: {str(e)}")
            job = EmbeddingJob(
                **{
                    **job.__dict__, 
                    "status": JobStatus.FAILED, 
                    "error": str(e),
                    "updated_at": datetime.now()
                }
            )
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
