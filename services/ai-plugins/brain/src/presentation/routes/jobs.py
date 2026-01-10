from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel
from typing import List, Optional

from ...infrastructure.config import settings
from ...domain.entities import JobStatus
from ...application.use_cases import CreateEmbeddingJob, GetJobStatus, ProcessEmbeddingJob
from ...infrastructure.redis_client import get_redis_client # Need to create this
from ...infrastructure.redis_job_repository import RedisJobRepository
from ...infrastructure.audio_embedder import ClapEmbedder

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Dependency Injection Helpers
async def get_repository():
    return RedisJobRepository(await get_redis_client())

async def get_embedder():
    # In a real singleton pattern, we'd share this
    return ClapEmbedder()

class CreateJobRequest(BaseModel):
    track_id: str
    file_path: str

@router.post("")
async def create_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks,
    x_internal_secret: Optional[str] = Header(None),
    repo: RedisJobRepository = Depends(get_repository),
    embedder: ClapEmbedder = Depends(get_embedder)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    use_case = CreateEmbeddingJob(repo)
    job = await use_case.execute(request.track_id, request.file_path)
    
    # Process in background
    process_use_case = ProcessEmbeddingJob(repo, embedder)
    background_tasks.add_task(process_use_case.execute, job.id)
    
    return job.to_dict()

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
