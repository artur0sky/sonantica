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
        # Ensure directory permissions
        import os
        output_dir.mkdir(parents=True, exist_ok=True)
        try: os.chmod(str(output_dir), 0o777)
        except: pass

        process = await asyncio.create_subprocess_exec(
            *args,
            "--overwrite", "skip",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        
        progress_val = 0.05
        
        async def read_output():
            nonlocal progress_val
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                
                line_str = line.decode().strip()
                if line_str:
                    logger.info(f"[spotdl] {line_str}")
                    
                    # Detect rate limits
                    if "rate/request limit" in line_str.lower():
                        logger.error("Spotify rate limit hit. Try again later or configure Client ID/Secret.")
                        Storage.update_job_status(job_id, "failed", error="Rate limit hit (Spotify)")
                        process.terminate()
                        break

                    if "ffmpeg" in line_str.lower() and "not found" in line_str.lower():
                        logger.error("FFmpeg not found in system.")
                        Storage.update_job_status(job_id, "failed", error="FFmpeg missing on worker")
                        process.terminate()
                        break

                    # Rich parsing
                    import re
                    
                    # Progress
                    p_match = re.search(r"(\d+)%", line_str)
                    if p_match:
                        progress_val = float(p_match.group(1)) / 100.0
                    
                    # Track count detection (e.g. 1/12)
                    t_match = re.search(r"(\d+)/(\d+)", line_str)
                    track_info = f"Track {t_match.group(1)} of {t_match.group(2)}" if t_match else None

                    # Speed (e.g. 1.2 MB/s)
                    s_match = re.search(r"(\d+\.?\d*\s*[kMG]B/s)", line_str)
                    speed_val = s_match.group(1) if s_match else None
                    
                    # ETA (handles both "ETA: 00:05" and "...<00:05")
                    e_match = re.search(r"(?:ETA:\s*|<)(\d+:\d+)", line_str)
                    eta_val = e_match.group(1) if e_match else None

                    # Stage/Phase detection
                    phase = "Preserving..."
                    if "Downloading" in line_str: phase = "Downloading..."
                    elif "Converting" in line_str: phase = "Converting/Recoding..."
                    elif "Embedding" in line_str: phase = "Embedding Metadata..."
                    elif "Syncing" in line_str: phase = "Syncing Signal..."
                    
                    if track_info:
                        phase = f"{track_info} - {phase}"

                    if job_id:
                        update_data = {
                            "progress": round(progress_val * 100),
                            "message": phase
                        }
                        if speed_val: update_data["speed"] = speed_val
                        if eta_val: update_data["eta"] = eta_val
                        
                        # Only update if something changed
                        job = Storage.get_job(job_id)
                        if job:
                            has_changed = (
                                update_data["progress"] > job.get("progress", 0) or 
                                update_data["message"] != job.get("message") or
                                update_data.get("speed") != job.get("speed") or
                                update_data.get("eta") != job.get("eta")
                            )
                            if has_changed:
                                Storage.update_job_status(job_id, "processing", **update_data)

        # Run output reader in background
        output_task = asyncio.create_task(read_output())
        
        while process.returncode is None:
            # Check for cancellation or pause
            if job_id:
                job = Storage.get_job(job_id)
                if job and job.get("status") in ["cancelled", "paused"]:
                    process.terminate()
                    break

            # Simulate slow progress if spotdl is slow at reporting
            if progress_val < 0.95:
                progress_val += 0.0005 # Slowest simulation
                
            if job_id:
                current_percent = round(progress_val * 100)
                job = Storage.get_job(job_id)
                if job and current_percent > job.get("progress", 0):
                    Storage.update_job_status(job_id, "processing", progress=current_percent)

            task.update_state(state="PROCESSING", meta={"progress": round(progress_val * 100)})
            await asyncio.sleep(0.5)

        await output_task
        await process.wait()

        if process.returncode != 0:
            error_msg = f"spotdl failed with code {process.returncode}"
            if process.returncode == -15 or process.returncode == 15:
                logger.warning("spotdl process terminated externally (likely rate limit)")
                return {"status": "failed", "error": "Preservation interrupted (Rate Limit or other)"}

            logger.error(error_msg)
            if job_id:
                Storage.update_job_status(job_id, "failed", error=error_msg)
            return {"status": "failed", "error": error_msg}

        # Double check if any files were actually created
        has_files = False
        try:
            for ext in ['mp3', 'flac', 'opus', 'm4a', 'wav']:
                if list(output_dir.glob(f"**/*.{ext}")):
                    has_files = True
                    break
        except: pass

        if not has_files:
            error_msg = "No files found after download (likely rate limit or track not found)"
            logger.error(error_msg)
            if job_id:
                Storage.update_job_status(job_id, "failed", error="Track not found or provider error")
            return {"status": "failed", "error": "Track not found or provider error"}

        # Success
        if job_id:
            Storage.update_job_status(job_id, "completed", progress=100.0, message="Completed", speed=None, eta=None)

        # Trigger Analysis on Core
        try:
             import httpx
             async with httpx.AsyncClient() as client:
                scan_payload = {"path": str(output_dir)} 
                resp = await client.post(f"{settings.core_internal_url}/api/scan/start", json=scan_payload, timeout=5.0)
                if resp.status_code == 202:
                    logger.info("Core library scan triggered successfully")
                else:
                    logger.warning(f"Core scan trigger returned {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Failed to trigger core library scan: {e}")

        return {
            "status": "completed",
            "progress": 100,
            "message": "Harmonic preservation completed successfully."
        }

    except Exception as e:
        logger.exception("Unexpected error in download task")
        if job_id:
            Storage.update_job_status(job_id, "failed", error=str(e))
        return {"status": "failed", "error": str(e)}

