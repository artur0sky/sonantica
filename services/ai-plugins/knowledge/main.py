import uvicorn
import logging
import time
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Request, HTTPException, Header, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
import httpx
import json
import asyncio

from src.infrastructure.config import settings
from src.infrastructure.redis_client import RedisClient
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.domain.entities import KnowledgeJob, JobStatus

from src.infrastructure.logging.logger_config import setup_logger
from src.infrastructure.logging.context import set_trace_id

# Configure logging
logger = setup_logger("knowledge-plugin")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Knowledge Enrichment Plugin (Ollama Client)"
)

# Global Semaphore to avoid overloading Ollama
# supermarket box behavior: N slots, others wait in line
limit = settings.MAX_CONCURRENT_JOBS if settings.MAX_CONCURRENT_JOBS > 0 else 2
ollama_semaphore = asyncio.Semaphore(limit)

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
        
        # 1. Deduplication
        existing = await repo.find_by_track_id(track_id)
        if existing and existing.status in [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.PENDING]:
            return {
                "id": existing.id,
                "track_id": existing.track_id,
                "status": get_value(existing.status),
                "created_at": existing.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                "updated_at": existing.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
            }

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
        
        # Schedule background processing only if pending
        if get_value(job.status) == "pending":
            background_tasks.add_task(process_job, job_id)
        else:
            logger.info(f"SKIP_QUEUE | Job {job.id} for track {track_id} status: {get_value(job.status)}")
        
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
