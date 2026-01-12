"""
Application Layer: Download Use Case
"""
import asyncio
import logging
import uuid
from typing import Optional, Dict

from src.domain.entities import DownloadJob, JobStatus
from src.infrastructure.config import settings
from src.infrastructure.storage import Storage

from src.infrastructure.logging.logger_config import setup_logger

logger = setup_logger(__name__)

class DownloadUseCase:
    async def create_job(self, url: str, format_override: Optional[str] = None) -> DownloadJob:
        from src.application.tasks import download_source_task
        
        job_id = str(uuid.uuid4())
        
        # Save Initial State
        job_data = {
            "id": job_id,
            "url": url,
            "status": "pending",
            "format": format_override or "flac",
            "progress": 0.0,
            "message": "Queued"
        }
        Storage.save_job(job_id, job_data)
        Storage.increment_quota("download")
        
        try:
            # Dispatch Celery
            celery_task = download_source_task.apply_async(args=[url, format_override, job_id], task_id=job_id)
            
            # Update Task ID
            job_data["celery_task_id"] = celery_task.id
            Storage.save_job(job_id, job_data)
            
            return self._map_to_entity(job_data)
        except Exception as e:
            Storage.update_job_status(job_id, "failed", error=str(e))
            logger.error(f"Failed to create job: {e}")
            raise e

    def get_status(self, job_id: str) -> Optional[DownloadJob]:
        job_data = Storage.get_job(job_id)
        if not job_data:
            return None
        return self._map_to_entity(job_data)

    def _map_to_entity(self, data: Dict) -> DownloadJob:
        # Convert string status to Enum if needed, or just pass string if Entity supports it.
        # Entity uses JobStatus enum.
        status_map = {
            "pending": JobStatus.PENDING,
            "processing": JobStatus.PROCESSING,
            "completed": JobStatus.COMPLETED,
            "failed": JobStatus.FAILED,
            "cancelled": JobStatus.CANCELLED,
            "paused": JobStatus.PENDING 
        }
        
        return DownloadJob(
            id=data.get("id"),
            url=data.get("url"),
            status=status_map.get(data.get("status"), JobStatus.PENDING),
            progress=data.get("progress", 0.0),
            message=data.get("message", ""),
            created_at=data.get("created_at"), # String ISO
            updated_at=data.get("updated_at"),
            error=data.get("error_message")
        )

    def cancel_job(self, job_id: str):
        from src.infrastructure.celery_app import celery_app
        job = Storage.get_job(job_id)
        if job:
            Storage.update_job_status(job_id, "cancelled", message="Cancelled by user")
            tid = job.get("celery_task_id")
            if tid:
                celery_app.control.revoke(tid, terminate=True)

    def pause_job(self, job_id: str):
        job = Storage.get_job(job_id)
        if job and job.get("status") in ["processing", "pending"]:
            Storage.update_job_status(job_id, "paused", message="Paused")

    def resume_job(self, job_id: str):
        job = Storage.get_job(job_id)
        if job and job.get("status") == "paused":
            Storage.update_job_status(job_id, "pending", message="Resuming...")
            # Ideally retry task if it was killed? 
            # Or assume worker logic handles it. 
            # If we killed the task in pause, we MUST re-dispatch it.
            # SpotDL doesn't "pause" natively in process. We terminated it.
            # So we must re-create the task.
            from src.application.tasks import download_source_task
            url = job.get("url")
            fmt = job.get("format", "flac")
            download_source_task.apply_async(args=[url, fmt, job_id], task_id=job_id)

