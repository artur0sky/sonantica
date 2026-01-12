import asyncio
import logging
import os
from datetime import datetime
import httpx
from src.infrastructure.celery_app import celery_app
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="download_source")
def download_source_task(self, url: str, format_override: str = "flac"):
    """
    Celery task to handle audio download/preservation.
    Updates task state with progress for the frontend.
    """
    output_format = format_override or "flac"
    output_dir = settings.media_path / "Downloads"
    output_dir.mkdir(parents=True, exist_ok=True)

    # We use a wrapper to run async code in sync celery task
    return asyncio.run(_process_download(self, url, output_format, output_dir))

async def _process_download(task, url: str, output_format: str, output_dir: str):
    args = [
        "spotdl", "download", url,
        "--format", output_format,
        "--output", str(output_dir / "{artist}/{album}/{title}"),
        "--threads", str(settings.threads),
    ]

    logger.info(f"Task {task.request.id} starting spotdl: {' '.join(args)}")
    
    task.update_state(state="PROCESSING", meta={"progress": 0.05, "message": "Initializing recapture..."})

    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        # Progress simulation: spotdl logs progress per track.
        progress_val = 0.05
        while process.returncode is None:
            try:
                # Use wait_for to check return code without blocking indefinitely
                await asyncio.wait_for(process.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                # Still running, update progress
                if progress_val < 0.9:
                    progress_val += 0.05
                    task.update_state(
                        state="PROCESSING", 
                        meta={
                            "progress": round(progress_val * 100), 
                            "message": f"Capturing high-fidelity packets... ({round(progress_val * 100)}%)"
                        }
                    )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode()
            logger.error(f"Download failed: {error_msg}")
            return {
                "status": "failed", 
                "progress": round(progress_val * 100),
                "error": error_msg,
                "message": "Preservation failed. Check connection."
            }

        # Trigger Library Scan in Core
        async with httpx.AsyncClient() as client:
            try:
                await client.post(f"{settings.core_internal_url}/api/library/scan", timeout=5.0)
                logger.info("Library scan triggered")
            except Exception as e:
                logger.error(f"Library scan trigger failed: {e}")

        return {
            "status": "completed",
            "progress": 100,
            "message": "Harmonic preservation complete. Check your library."
        }

    except Exception as e:
        logger.exception("Unexpected error in download task")
        return {"status": "failed", "error": str(e)}
