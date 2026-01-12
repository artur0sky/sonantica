"""
Sonántica AI Plugin: Demucs Stem Separation
Philosophy: "Respect for sound" - Preserve audio intention through isolation

Entry point for the FastAPI application.
Follows Clean Architecture principles with clear separation of concerns.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.infrastructure.config import settings
from src.infrastructure.redis_client import RedisClient
from src.presentation.routes import health, jobs, manifest

from src.infrastructure.logging.logger_config import setup_logger
from src.infrastructure.logging.context import set_trace_id

# Initialize standard logger
logger = setup_logger("demucs-plugin")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting Demucs Plugin...")
    
    try:
        # Initialize Redis connection
        await RedisClient.initialize()
        logger.info("✓ Redis connection established")
        
        # Ensure output directory exists
        settings.output_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"✓ Output directory ready: {settings.output_path}")
        
        # Start Priority Job Manager
        from src.application.priority_processor import job_manager
        await job_manager.start()
        
        # Check GPU availability
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"✓ GPU detected: {gpu_name}")
        else:
            logger.warning("⚠ No GPU detected, will use CPU (slow)")
            
    except Exception as e:
        logger.error(f"✗ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Demucs Plugin...")
    from src.application.priority_processor import job_manager
    await job_manager.stop()
    await RedisClient.close()
    logger.info("✓ Cleanup complete")


# Initialize FastAPI app
app = FastAPI(
    title="Sonántica Demucs Plugin",
    description="AI Stem Separation using Demucs",
    version="1.0.0",
    lifespan=lifespan
)

# Register routes
app.include_router(manifest.router, tags=["Discovery"])
app.include_router(health.router, tags=["Monitoring"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    # Generate and set trace_id for this request
    trace_id = set_trace_id()
    
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
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
