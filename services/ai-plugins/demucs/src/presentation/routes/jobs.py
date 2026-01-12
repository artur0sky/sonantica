"""
Presentation Layer: Jobs Routes
Handles job creation, status, and cancellation
"""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks, Header, Depends
from pydantic import BaseModel, Field

from src.application.use_cases import (
    CreateSeparationJobUseCase,
    GetJobStatusUseCase,
    CancelJobUseCase,
    ProcessSeparationJobUseCase
)
from src.domain.entities import StemType, JobPriority
from src.infrastructure.logging.context import set_trace_id
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.infrastructure.demucs_separator import DemucsStemSeparator
from src.application.priority_processor import job_manager
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

def get_value(x):
    """Safely get value from Enum or string"""
    return x.value if hasattr(x, 'value') else str(x)


# Request/Response Models
class CreateJobRequest(BaseModel):
    """Request model for creating a separation job"""
    track_id: str = Field(..., description="Unique track identifier")
    file_path: str = Field(..., description="Relative path to audio file in /media")
    model: str = Field(default="htdemucs", description="Demucs model to use")
    priority: JobPriority = Field(default=JobPriority.NORMAL, description="Job priority (0=Streaming, 10=Normal, 20=Low)")
    stems: list[StemType] = Field(
        default_factory=lambda: list(StemType),
        description="Stems to extract"
    )


class JobResponse(BaseModel):
    """Response model for job operations"""
    id: str
    track_id: str
    status: str
    priority: int = 10
    progress: float = 0.0
    result: dict[str, str] | None = None
    error: str | None = None
    created_at: str
    updated_at: str


# Dependency: Verify internal API secret
async def verify_internal_secret(x_internal_secret: str = Header(None)):
    """Security middleware: Validate internal API secret"""
    if x_internal_secret != settings.internal_api_secret:
        logger.warning(f"Unauthorized access attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("", response_model=JobResponse, dependencies=[Depends(verify_internal_secret)])
async def create_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks
):
    """
    Create a new stem separation job.
    Requires internal API secret for authentication.
    """
    try:
        # Validate file exists
        file_path = settings.media_path / request.file_path
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {request.file_path}"
            )
        
        # Initialize dependencies
        job_repository = RedisJobRepository()
        
        # Execute use case
        use_case = CreateSeparationJobUseCase(
            job_repository=job_repository,
            max_concurrent_jobs=settings.max_concurrent_jobs
        )
        
        job = await use_case.execute(
            track_id=request.track_id,
            file_path=str(file_path),
            model=request.model,
            priority=request.priority,
            stems=request.stems
        )
        
        # Enqueue via shared Priority Manager instead of random background task
        if get_value(job.status) == "pending":
            await job_manager.enqueue(job)
        else:
            logger.info(f"SKIP_QUEUE | Job {job.id} for track {request.track_id} status: {get_value(job.status)}")
        
        return JobResponse(
            id=job.id,
            track_id=job.track_id,
            status=get_value(job.status),
            priority=int(job.priority),
            progress=job.progress,
            created_at=job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
            updated_at=job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        )
        
    except ValueError as e:
        # Business rule violation (e.g., max concurrent jobs)
        raise HTTPException(status_code=429, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.get("/{job_id}", response_model=JobResponse, dependencies=[Depends(verify_internal_secret)])
async def get_job_status(job_id: str):
    """
    Get status and result of a separation job.
    """
    try:
        # Initialize dependencies
        job_repository = RedisJobRepository()
        
        # Execute use case
        use_case = GetJobStatusUseCase(job_repository=job_repository)
        job = await use_case.execute(job_id)
        
        return JobResponse(
            id=job.id,
            track_id=job.track_id,
            status=get_value(job.status),
            progress=job.progress,
            result=job.result,
            error=job.error,
            created_at=job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
            updated_at=job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.delete("/{job_id}", dependencies=[Depends(verify_internal_secret)])
async def cancel_job(job_id: str):
    """
    Cancel a pending or processing job.
    """
    try:
        # Initialize dependencies
        job_repository = RedisJobRepository()
        
        # Execute use case
        use_case = CancelJobUseCase(job_repository=job_repository)
        job = await use_case.execute(job_id)
        
        return {
            "message": f"Job {job_id} cancelled successfully",
            "status": get_value(job.status)
        }
        
    except ValueError as e:
        # Job not found or cannot be cancelled
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


# Background task function
async def process_job_background(job_id: str):
    """
    Background task to process a separation job.
    Runs asynchronously after job creation.
    """
    set_trace_id(job_id)
    try:
        # Initialize dependencies
        job_repository = RedisJobRepository()
        stem_separator = DemucsStemSeparator()
        
        logger.info(f"START | Background job {job_id}")
        
        # Execute use case
        use_case = ProcessSeparationJobUseCase(
            job_repository=job_repository,
            stem_separator=stem_separator,
            output_base_path=str(settings.output_path),
            max_parallel=settings.max_concurrent_jobs
        )
        
        await use_case.execute(job_id)
        logger.info(f"DONE | Background job {job_id}")
        
    except Exception as e:
        logger.exception(f"FAIL | Background job processing failed: {job_id} | Error: {str(e)}")
