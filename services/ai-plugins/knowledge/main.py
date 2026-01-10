import uvicorn
import logging
import time
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Request, HTTPException, Header, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
import httpx
import json

from src.infrastructure.config import settings
from src.infrastructure.redis_client import RedisClient
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.domain.entities import KnowledgeJob, JobStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "knowledge-plugin", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Knowledge Enrichment Plugin (Ollama Client)"
)

# Helpers
def get_value(x):
    return x.value if hasattr(x, 'value') else str(x)

async def verify_internal_secret(x_internal_secret: str = Header(None)):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        logger.warning("Unauthorized access attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")

# Routes
@app.get("/manifest")
async def manifest():
    return {
        "id": "sonantica-plugin-knowledge",
        "name": "Knowledge (LLM)",
        "version": settings.VERSION,
        "capability": "knowledge",
        "description": "Enriches library with metadata, lyrics, and facts using local LLM (Llama 3.1) via Ollama."
    }

@app.get("/health")
async def health():
    ollama_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.OLLAMA_HOST}/api/tags", timeout=2.0)
            if resp.status_code == 200:
                ollama_status = "connected"
            else:
                ollama_status = "error"
    except Exception:
        ollama_status = "unreachable"

    return {
        "status": "healthy",
        "service": "sonantica-plugin-knowledge",
        "version": settings.VERSION,
        "ollama": ollama_status
    }

@app.post("/jobs", dependencies=[Depends(verify_internal_secret)])
async def create_job(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        track_id = body.get("track_id")
        if not track_id:
            raise HTTPException(status_code=400, detail="track_id is required")

        repo = RedisJobRepository()
        job_id = f"knw_{track_id}_{int(time.time())}"
        now = datetime.utcnow()
        
        job = KnowledgeJob(
            id=job_id,
            track_id=track_id,
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now
        )
        
        await repo.save(job)
        background_tasks.add_task(process_job, job_id)
        
        return {
            "id": job.id,
            "track_id": job.track_id,
            "status": get_value(job.status),
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
    repo = RedisJobRepository()
    job = await repo.get_by_id(job_id)
    if not job: return

    try:
        job.status = JobStatus.PROCESSING
        job.updated_at = datetime.utcnow()
        await repo.save(job)

        # Basic interaction with Ollama to prove it works
        # In a real scenario, we'd fetch track info from Postgres first
        prompt = f"Provide 3 interesting facts about the musical context of track ID {job.track_id}. Keep it concise."
        
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
            else:
                job.error = f"Ollama error: {resp.status_code}"
                job.status = JobStatus.FAILED
                
    except Exception as e:
        logger.error(f"Processing failed for {job_id}: {e}")
        job.status = JobStatus.FAILED
        job.error = str(e)
    
    job.updated_at = datetime.utcnow()
    await repo.save(job)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    logger.info(
        f"Request {request.method} {request.url.path} processed in {process_time:.2f}ms. Status: {response.status_code}"
    )
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
