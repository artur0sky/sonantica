from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from src.infrastructure.config import settings
import os

router = APIRouter()

class ConfigUpdate(BaseModel):
    threads: int = None
    downloads_path: str = None
    format: str = None

@router.get("/config")
async def get_config():
    """Get current configuration"""
    return {
        "threads": settings.threads,
        "downloads_path": str(settings.downloads_path),
        # Do not return secrets
        "version": settings.version
    }

@router.patch("/config")
async def update_config(config: ConfigUpdate = Body(...)):
    """Update configuration"""
    # In a real plugin, we might save this to a file or DB so it persists on restart.
    # For now, we update the runtime settings object (ephemeral) or update env vars if possible?
    # Containers usually have immutable env vars.
    # We should save to a JSON config file that `config.py` loads.
    
    # settings.threads = config.threads # This only works in memory
    
    # Let's assume we save to a json file in /config volume
    import json
    config_file = settings.config_path / "downloader_config.json"
    
    current = {}
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                current = json.load(f)
        except: pass
    
    if config.threads:
        current["threads"] = config.threads
        settings.threads = config.threads
    if config.downloads_path:
        current["downloads_path"] = config.downloads_path
        # Update path object?
        
    with open(config_file, "w") as f:
        json.dump(current, f)
        
    return {"status": "updated", "config": current}
