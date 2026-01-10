import uvicorn
import logging
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx

from src.infrastructure.config import settings

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

@app.get("/manifest")
async def manifest():
    return {
        "id": "sonantica-plugin-knowledge",
        "name": "Knowledge (LLM)",
        "version": settings.VERSION,
        "capability": "knowledge",
        "description": "Enriches library with metadata, lyrics, and facts using local LLMs via Ollama."
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
