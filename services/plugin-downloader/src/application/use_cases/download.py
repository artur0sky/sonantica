"""
Application Layer: Download Use Case
"""
import asyncio
import logging
import os
import subprocess
import uuid
from datetime import datetime
from typing import Optional, Dict
import httpx

from src.domain.entities import DownloadJob, JobStatus, JobPriority
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

# In-memory store for now, in a real scenario use Redis as in Demucs
jobs: Dict[str, DownloadJob] = {}

class DownloadUseCase:
    async def create_job(self, url: str, format_override: Optional[str] = None) -> DownloadJob:
        from src.application.tasks import download_source_task
        
        # Dispatch to Celery
        task = download_source_task.delay(url, format_override)
        
        job_id = task.id
        now = datetime.utcnow()
        job = DownloadJob(
            id=job_id,
            url=url,
            status=JobStatus.PENDING,
            message="Dispatching to sonic hunter...",
            created_at=now,
            updated_at=now
        )
        # Note: We don't necessarily need to store it in 'jobs' dict anymore 
        # as Celery backend (Redis) has the state, but we'll keeper it for fast lookup 
        # or remove it if we rely purely on Celery result.
        jobs[job_id] = job
        return job

    async def process(self, *args, **kwargs):
        # Deprecated: processing now happens in Celery worker
        pass

    def get_status(self, job_id: str) -> Optional[DownloadJob]:
        from src.infrastructure.celery_app import celery_app
        task = celery_app.AsyncResult(job_id)
        
        # Priority: Map Celery states to our JobStatus
        status_map = {
            "PENDING": JobStatus.PENDING,
            "RECEIVED": JobStatus.PENDING,
            "STARTED": JobStatus.PROCESSING,
            "PROCESSING": JobStatus.PROCESSING,
            "SUCCESS": JobStatus.COMPLETED,
            "FAILURE": JobStatus.FAILED,
            "REVOKED": JobStatus.CANCELLED
        }

        # If we have it in the local jobs dict, update it from Celery
        job = jobs.get(job_id)
        if not job:
            # Reconstruct if missing (e.g. after restart)
            job = DownloadJob(
                id=job_id,
                url="untracked", # We don't store the URL in Celery result by default
                status=JobStatus.PENDING,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            jobs[job_id] = job

        job.status = status_map.get(task.state, JobStatus.PROCESSING)
        
        if task.state == "PROCESSING":
            meta = task.info or {}
            job.progress = meta.get("progress", 0.0)
            job.message = meta.get("message", "Synthesizing...")
        elif task.state == "SUCCESS":
            result = task.result or {}
            job.progress = 1.0
            job.message = result.get("message", "Done.")
        elif task.state == "FAILURE":
            job.status = JobStatus.FAILED
            job.message = str(task.result)
            job.error = str(task.result)

        job.updated_at = datetime.utcnow()
        return job
