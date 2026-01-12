"""
Sonántica Downloader Plugin: The Workshop
Following AI Plugin Standards
"""
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.infrastructure.config import settings
from src.presentation.routes import manifest, health, workshop

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="True FLAC and MP3 preservation from external sources."
)

# Register routes
app.include_router(manifest.router, tags=["Discovery"])
app.include_router(health.router, tags=["Monitoring"])
app.include_router(workshop.router, tags=["Workshop"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        print(f"DONE | {request.method} {request.url.path} | {response.status_code} | {process_time:.2f}ms")
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        print(f"FAIL | {request.method} {request.url.path} | {process_time:.2f}ms | Error: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
