import asyncio
import json
import httpx
import time
from datetime import datetime
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from fastapi import FastAPI, Request, HTTPException, Header, Depends

from src.infrastructure.config import settings
from src.infrastructure.redis_client import RedisClient
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.domain.entities import KnowledgeJob, JobStatus, JobPriority
from src.application.priority_processor import job_manager

from src.infrastructure.logging.logger_config import setup_logger
from src.infrastructure.logging.context import set_trace_id

# Configure logging
logger = setup_logger("knowledge-plugin")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup/shutdown"""
    logger.info("🚀 Starting Knowledge Plugin...")
    
    # Initialize Redis
    await RedisClient.get_instance()
    
    # Start Priority Manager (process_job is defined below)
    await job_manager.start(process_job)
    
    yield
    
    logger.info("🛑 Shutting down Knowledge Plugin...")
    await job_manager.stop()
    await RedisClient.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Knowledge Enrichment Plugin (Ollama Client)",
    lifespan=lifespan
)

# Global Semaphore to avoid overloading Ollama
limit = settings.MAX_CONCURRENT_JOBS if settings.MAX_CONCURRENT_JOBS > 0 else 2
ollama_semaphore = asyncio.Semaphore(limit)

# Request/Response Models
class CreateJobRequest(BaseModel):
    track_id: str = Field(..., description="Unique track identifier")
    priority: JobPriority = Field(default=JobPriority.NORMAL, description="Job priority")

# Helpers
def get_value(x):
    return x.value if hasattr(x, 'value') else str(x)

async def verify_internal_secret(x_internal_secret: str = Header(None)):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        logger.warning("Unauthorized access attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")

# Routes
@router_post := app.post("/jobs", dependencies=[Depends(verify_internal_secret)])
async def create_job(request: CreateJobRequest):
    try:
        repo = RedisJobRepository()
        
        # 1. Deduplication
        existing = await repo.find_by_track_id(request.track_id)
        if existing and existing.status in [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.PENDING]:
            return {
                "id": existing.id,
                "track_id": existing.track_id,
                "status": get_value(existing.status),
                "priority": int(existing.priority),
                "created_at": existing.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                "updated_at": existing.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
            }

        job_id = f"knw_{request.track_id}_{int(time.time())}"
        now = datetime.utcnow()
        
        job = KnowledgeJob(
            id=job_id,
            track_id=request.track_id,
            status=JobStatus.PENDING,
            priority=request.priority,
            created_at=now,
            updated_at=now
        )
        
        await repo.save(job)
        
        # Enqueue via shared Priority Manager
        if get_value(job.status) == "pending":
            await job_manager.enqueue(job)
        else:
            logger.info(f"SKIP_QUEUE | Job {job.id} for track {request.track_id} status: {get_value(job.status)}")
        
        return {
            "id": job.id,
            "track_id": job.track_id,
            "status": get_value(job.status),
            "priority": int(job.priority),
            "created_at": job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "updated_at": job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        }
    except Exception as e:
        logger.error(f"Failed to create job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}", dependencies=[Depends(verify_internal_secret)])
async def get_job(job_id: str):
    repo = RedisJobRepository()
    job = await repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "track_id": job.track_id,
        "status": get_value(job.status),
        "progress": job.progress,
        "result": job.result,
        "error": job.error,
        "created_at": job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
        "updated_at": job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
    }

async def process_job(job_id: str):
    set_trace_id(job_id)
    repo = RedisJobRepository()
    job = await repo.get_by_id(job_id)
    if not job: 
        logger.warning(f"SKIP | Job {job_id} not found")
        return

    try:
        job.status = JobStatus.PROCESSING
        job.updated_at = datetime.utcnow()
        await repo.save(job)

        # Basic interaction with Ollama to prove it works
        # In a real scenario, we'd fetch track info from Postgres first
        prompt = f"Provide 3 interesting facts about the musical context of track ID {job.track_id}. Keep it concise."
        
        async with ollama_semaphore:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.OLLAMA_HOST}/api/generate",
                    json={
                        "model": settings.LLM_MODEL,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=30.0
                )
            
            if resp.status_code == 200:
                result_data = resp.json()
                job.result = {"enrichment": result_data.get("response"), "model": settings.LLM_MODEL}
                job.status = JobStatus.COMPLETED
                logger.info(f"DONE | Successfully enriched track {job.track_id}")
            else:
                job.error = f"Ollama error: {resp.status_code}"
                job.status = JobStatus.FAILED
                logger.error(f"FAIL | Ollama response {resp.status_code}")
                
    except Exception as e:
        logger.exception(f"FAIL | Processing job {job_id} | Error: {str(e)}")
        job.status = JobStatus.FAILED
        job.error = str(e)
    
    job.updated_at = datetime.utcnow()
    await repo.save(job)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    set_trace_id()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"DONE | {request.method} {request.url.path} | {response.status_code} | {process_time:.2f}ms")
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.exception(f"FAIL | {request.method} {request.url.path} | {process_time:.2f}ms | Error: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
