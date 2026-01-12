import asyncio
import logging
from src.infrastructure.celery_app import celery_app
from src.infrastructure.config import settings
from src.infrastructure.storage import Storage

from src.infrastructure.logging.logger_config import setup_logger
from src.infrastructure.logging.context import set_trace_id

logger = setup_logger(__name__)

@celery_app.task(bind=True, name="download_source")
def download_source_task(self, url: str, format_override: str = "flac", job_id: str = None):
    """
    Celery task to handle audio download/preservation.
    Updates task state with progress and handles Redis persistence.
    """
    output_format = format_override or "flac"
    output_dir = settings.downloads_path
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not job_id:
        logger.warning("No job_id provided for download task")
        # Generate one strictly for tracking if missing?
        # Ideally we shouldn't get here without ID.
    
    return asyncio.run(_process_download(self, url, output_format, output_dir, job_id))

async def _process_download(task, url: str, output_format: str, output_dir: str, job_id: str):
    # Update status to processing
    if job_id:
        Storage.update_job_status(job_id, "processing", message="Initializing recapture...")

    args = [
        "spotdl", "download", url,
        "--format", output_format,
        "--output", str(output_dir / "{artist}/{album}/{title}"),
        "--threads", str(settings.threads),
        "--simple-tui"
    ]

    logger.info(f"Task {task.request.id} starting spotdl: {' '.join(args)}")
    
    task.update_state(state="PROCESSING", meta={"progress": 0.05, "message": "Initializing recapture..."})

    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        progress_val = 0.05
        
        while True:
            # Check for cancellation or pause via Storage
            if job_id:
                job = Storage.get_job(job_id)
                if job:
                    if job.get("status") == "cancelled":
                        process.terminate()
                        logger.info("Task cancelled by user.")
                        return {"status": "cancelled", "message": "Cancelled by user"}
                    if job.get("status") == "paused":
                        process.terminate()
                        return {"status": "paused", "message": "Paused"}

            # Read stdout
            try:
                line = await asyncio.wait_for(process.stdout.readline(), timeout=0.1)
                if line:
                    line_str = line.decode().strip()
                    # Parsing logic...
            except asyncio.TimeoutError:
                pass
                
            if process.returncode is not None:
                break
                
            if process.stdout.at_eof() and process.stderr.at_eof():
                break
            
            if progress_val < 0.9:
                progress_val += 0.005 
                
            # Update Celery & Storage
            if job_id and int(progress_val * 100) % 5 == 0:
                Storage.update_job_status(job_id, "processing", progress=round(progress_val * 100))

            task.update_state(state="PROCESSING", meta={"progress": round(progress_val * 100), "message": "Preserving..."})
            await asyncio.sleep(0.1)

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode()
            logger.error(f"Download failed: {error_msg}")
            if job_id:
                Storage.update_job_status(job_id, "failed", error=error_msg)
            return {
                "status": "failed", 
                "progress": round(progress_val * 100),
                "error": error_msg
            }

        # Success
        if job_id:
            Storage.update_job_status(job_id, "completed", progress=100.0, message="Completed")

        # Trigger Analysis on Core
        if "stream-core" in settings.core_internal_url: # basic check
             import httpx
             async with httpx.AsyncClient() as client:
                try:
                    scan_payload = {"path": str(output_dir)} 
                    await client.post(f"{settings.core_internal_url}/api/library/scan", json=scan_payload, timeout=5.0)
                    logger.info("Library scan triggered")
                except Exception as e:
                    logger.error(f"Library scan trigger failed: {e}")

        return {
            "status": "completed",
            "progress": 100,
            "message": "Harmonic preservation complete."
        }

    except Exception as e:
        logger.exception("Unexpected error in download task")
        if job_id:
            Storage.update_job_status(job_id, "failed", error=str(e))
        return {"status": "failed", "error": str(e)}

