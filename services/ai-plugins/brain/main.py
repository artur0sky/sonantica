import uvicorn
import logging
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.infrastructure.config import settings
from src.presentation.routes import jobs # Need to expose router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "brain-plugin", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Audio Similarity Plugin for Sonantica"
)

# Routes
app.include_router(jobs.router, prefix=settings.API_V1_STR)

@app.get("/manifest")
async def manifest():
    return {
        "id": "sonantica-plugin-brain",
        "name": "Audio Brain (Embeddings)",
        "version": settings.VERSION,
        "capability": "embeddings",
        "description": "Calculates high-dimensional audio vectors for similarity search using CLAP models."
    }

@app.get("/health")
async def health():
    # Basic health, in production we'd include GPU stats
    return {
        "status": "healthy",
        "service": "sonantica-plugin-brain",
        "version": settings.VERSION,
        "gpu": torch.cuda.is_available() if "torch" in globals() else False
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
    import torch # Import here to avoid overhead if not running as main
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
