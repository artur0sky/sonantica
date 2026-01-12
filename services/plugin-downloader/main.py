"""
Sonántica Downloader Plugin: The Workshop
Following AI Plugin Standards
"""
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.infrastructure.config import settings
from src.presentation.routes import manifest, health, workshop, config


from src.infrastructure.logging.logger_config import setup_logger
from src.infrastructure.logging.context import set_trace_id, get_trace_id

# Initialize Logger
logger = setup_logger(
    name="downloader-plugin",
    log_level=settings.log_level,
    log_format=settings.log_format,
    log_enabled=settings.log_enabled
)

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="True FLAC and MP3 preservation from external sources."
)

@app.on_event("startup")
def on_startup():
    logger.info("Service started", extra={"version": settings.version})

# Register routes
app.include_router(manifest.router, tags=["Discovery"])
app.include_router(health.router, tags=["Monitoring"])
app.include_router(workshop.router, tags=["Workshop"])
app.include_router(config.router, tags=["Config"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    trace_id = set_trace_id(request.headers.get("X-Trace-Id"))
    import time
    start_time = time.time()
    
    logger.info(f"Incoming request {request.method} {request.url.path}", extra={
        "trace_id": trace_id,
        "method": request.method,
        "path": request.url.path
    })
    
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        
        logger.info(f"Request completed {response.status_code}", extra={
            "trace_id": trace_id,
            "status_code": response.status_code,
            "duration_ms": process_time
        })
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"Request failed: {str(e)}", extra={
            "trace_id": trace_id, 
            "duration_ms": process_time,
            "error": str(e)
        }, exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
