"""
Application Layer: Use Cases (Business Logic)
Following Single Responsibility Principle - Each use case does one thing
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional

from src.domain.entities import SeparationJob, JobStatus, StemType
from src.domain.repositories import IJobRepository, IStemSeparator
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)


class CreateSeparationJobUseCase:
    """
    Use Case: Create a new stem separation job.
    Single Responsibility: Job creation and validation.
    """
    
    def __init__(
        self,
        job_repository: IJobRepository,
        max_concurrent_jobs: int
    ):
        self.job_repository = job_repository
        self.max_concurrent_jobs = max_concurrent_jobs
    
    async def execute(
        self,
        track_id: str,
        file_path: str,
        model: str = "htdemucs",
        stems: List[StemType] = None
    ) -> SeparationJob:
        """
        Create and enqueue a separation job.
        """
        # Business Rule: Check if a job already exists (Caching/Deduplication)
        existing_job = await self.job_repository.find_by_track_id(track_id, model)
        if existing_job and existing_job.status in [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.PENDING]:
            logger.info(f"Using existing job {existing_job.id} for track {track_id}")
            return existing_job

        # Create job entity
        job_id = f"{track_id}_{datetime.utcnow().timestamp()}"
        now = datetime.utcnow()
        
        job = SeparationJob(
            id=job_id,
            track_id=track_id,
            file_path=file_path,
            model=model,
            stems=stems or list(StemType),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now
        )
        
        # Persist job
        await self.job_repository.save(job)
        
        # Enqueue for processing
        await self.job_repository.enqueue(job_id)
        
        logger.info(f"✓ Job created: {job_id} for track {track_id}")
        
        return job


class GetJobStatusUseCase:
    """
    Use Case: Retrieve job status.
    Single Responsibility: Job retrieval.
    """
    
    def __init__(self, job_repository: IJobRepository):
        self.job_repository = job_repository
    
    async def execute(self, job_id: str) -> SeparationJob:
        """
        Get job by ID.
        
        Raises:
            ValueError: If job not found
        """
        job = await self.job_repository.get_by_id(job_id)
        
        if not job:
            raise ValueError(f"Job not found: {job_id}")
        
        return job


class CancelJobUseCase:
    """
    Use Case: Cancel a job.
    Single Responsibility: Job cancellation with business rules.
    """
    
    def __init__(self, job_repository: IJobRepository):
        self.job_repository = job_repository
    
    async def execute(self, job_id: str) -> SeparationJob:
        """
        Cancel a job if allowed.
        
        Raises:
            ValueError: If job not found or cannot be cancelled
        """
        job = await self.job_repository.get_by_id(job_id)
        
        if not job:
            raise ValueError(f"Job not found: {job_id}")
        
        # Business Rule: Can only cancel pending/processing jobs
        if not job.can_be_cancelled():
            raise ValueError(f"Cannot cancel job in status: {job.status}")
        
        # Apply state transition
        cancelled_job = job.mark_cancelled()
        
        # Persist
        await self.job_repository.update(cancelled_job)
        
        logger.info(f"✓ Job cancelled: {job_id}")
        
        return cancelled_job


class ProcessSeparationJobUseCase:
    """
    Use Case: Process a stem separation job.
    Single Responsibility: Orchestrate the separation workflow.
    """
    
    _semaphore: Optional[asyncio.Semaphore] = None

    def __init__(
        self,
        job_repository: IJobRepository,
        stem_separator: IStemSeparator,
        output_base_path: str,
        max_parallel: int = 1
    ):
        self.job_repository = job_repository
        self.stem_separator = stem_separator
        self.output_base_path = output_base_path
        
        if ProcessSeparationJobUseCase._semaphore is None:
            ProcessSeparationJobUseCase._semaphore = asyncio.Semaphore(max_parallel)
    
    async def execute(self, job_id: str) -> None:
        """
        Process a separation job end-to-end.
        Handles state transitions and error recovery.
        """
        async with self._semaphore:
            try:
                # Retrieve job
                job = await self.job_repository.get_by_id(job_id)
                if not job:
                    logger.error(f"Job not found: {job_id}")
                    return
                
                # Deduplication check: if it was already processed while waiting in semaphore
                # We check string value to be safe across different enum implementations
                status_val = job.status.value if hasattr(job.status, 'value') else str(job.status)
                if status_val in ["completed", "processing"]:
                     logger.info(f"SKIP | Job {job_id} already in {status_val} state")
                     return

                # Transition to processing
                job = job.mark_processing()
                await self.job_repository.update(job)
                
                logger.info(f"🎵 Processing job {job_id}: {job.file_path}")
                
                # Prepare output directory
                import os
                output_dir = os.path.join(self.output_base_path, job_id)
                os.makedirs(output_dir, exist_ok=True)
                
                # Update progress
                job = job.update_progress(0.1)
                await self.job_repository.update(job)
                
                # Execute separation
                def get_val(x):
                    return x.value if hasattr(x, 'value') else str(x)
                    
                result = await self.stem_separator.separate(
                    audio_path=job.file_path,
                    output_dir=output_dir,
                    model=job.model,
                    stems=[get_val(stem) for stem in job.stems]
                )
                
                # Transition to completed
                job = job.mark_completed(result)
                await self.job_repository.update(job)
                
                logger.info(f"✓ Job completed: {job_id}")
                
            except Exception as e:
                logger.error(f"✗ Job failed: {job_id} - {e}")
                
                # Transition to failed
                job = await self.job_repository.get_by_id(job_id)
                if job:
                    job = job.mark_failed(str(e))
                    await self.job_repository.update(job)


class GetSystemHealthUseCase:
    """
    Use Case: Get system health status.
    Single Responsibility: Aggregate health metrics.
    """
    
    def __init__(
        self,
        job_repository: IJobRepository,
        stem_separator: IStemSeparator,
        model_cache_path: str
    ):
        self.job_repository = job_repository
        self.stem_separator = stem_separator
        self.model_cache_path = model_cache_path
    
    async def execute(self) -> dict:
        """
        Collect and return system health metrics.
        """
        from pathlib import Path
        
        # Count active jobs
        active_jobs = await self.job_repository.count_by_status([
            JobStatus.PENDING,
            JobStatus.PROCESSING
        ])
        
        # Check GPU availability
        gpu_available = self.stem_separator.is_gpu_available()
        
        # Check model cache
        cache_path = Path(self.model_cache_path)
        model_cached = (cache_path / "hub").exists() if cache_path.exists() else False
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "gpu_available": gpu_available,
            "active_jobs": active_jobs,
            "model_cached": model_cached
        }
