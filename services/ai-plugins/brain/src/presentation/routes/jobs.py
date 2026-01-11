import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel
from typing import List, Optional, Dict

from ...infrastructure.config import settings
from ...domain.entities import JobStatus, JobPriority
from ...application.use_cases import CreateEmbeddingJob, GetJobStatus, ProcessEmbeddingJob, IngestStems
from ...application.priority_processor import job_manager
from ...infrastructure.redis_client import get_redis_client
from ...infrastructure.redis_job_repository import RedisJobRepository
from ...infrastructure.postgres_vector_repository import PostgresVectorRepository
from ...infrastructure.audio_embedder import ClapEmbedder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Dependency Injection Helpers
async def get_repository():
    return RedisJobRepository(await get_redis_client())

# Global singleton
_embedder = None

async def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = ClapEmbedder()
    return _embedder

async def get_vector_repo():
    if not settings.POSTGRES_URL:
        raise HTTPException(status_code=501, detail="Postgres vector storage not configured")
    return PostgresVectorRepository(settings.POSTGRES_URL)

class CreateJobRequest(BaseModel):
    track_id: str
    file_path: str
    priority: JobPriority = JobPriority.NORMAL

@router.post("")
async def create_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks,
    x_internal_secret: Optional[str] = Header(None),
    repo: RedisJobRepository = Depends(get_repository),
    embedder: ClapEmbedder = Depends(get_embedder),
    vector_repo: PostgresVectorRepository = Depends(get_vector_repo)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        use_case = CreateEmbeddingJob(repo)
        job = await use_case.execute(
            request.track_id, 
            request.file_path, 
            priority=request.priority,
            max_concurrent=settings.MAX_CONCURRENT_JOBS,
            cooldown=settings.CONCURRENCY_COOLDOWN_SECONDS
        )
        
        # Process via shared Priority Manager
        if job.status == JobStatus.PENDING:
            await job_manager.enqueue(job)
        else:
            logger.info(f"SKIP_QUEUE | Job {job.id} for track {request.track_id} is already in state: {job.status}")
        
        return job.to_dict()
    except ValueError as e:
        # 429 Too Many Requests for concurrency/cooldown limits
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        logger.exception(f"FAIL | Unexpected error creating job: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{job_id}")
async def get_status(
    job_id: str,
    x_internal_secret: Optional[str] = Header(None),
    repo: RedisJobRepository = Depends(get_repository)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    use_case = GetJobStatus(repo)
    job = await use_case.execute(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job.to_dict()

class IngestStemsRequest(BaseModel):
    track_id: str
    stems: Dict[str, str]

@router.post("/stems")
async def ingest_stems(
    request: IngestStemsRequest,
    background_tasks: BackgroundTasks,
    x_internal_secret: Optional[str] = Header(None),
    embedder: ClapEmbedder = Depends(get_embedder),
    vector_repo: PostgresVectorRepository = Depends(get_vector_repo)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        use_case = IngestStems(embedder, vector_repo)
        background_tasks.add_task(use_case.execute, request.track_id, request.stems)
        return {"status": "accepted", "message": "Stems analysis queued"}
    except Exception as e:
        logger.exception(f"FAIL | Error queuing stems ingestion: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
