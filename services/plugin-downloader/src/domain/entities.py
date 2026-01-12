"""
Domain Layer: Entities
"""
from enum import Enum
from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobPriority(int, Enum):
    STREAMING = 0
    NORMAL = 10
    LOW = 20

class DownloadJob(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    artist: Optional[str] = None
    cover_art: Optional[str] = None
    status: JobStatus = JobStatus.PENDING
    priority: JobPriority = JobPriority.NORMAL
    progress: float = 0.0
    message: str = ""
    speed: Optional[str] = None
    eta: Optional[str] = None
    result: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True

class PluginCapability(BaseModel):
    id: str = "sonantica-downloader"
    name: str = "The Workshop"
    version: str = "0.2.0"
    capability: str = "download"
    description: str = "True FLAC and MP3 preservation from external sources."
    settings_schema: Dict = Field(default_factory=lambda: {
        "output_format": ["flac", "alac", "mp3", "opus", "wav"],
        "quality": ["best", "320", "128"],
        "download_lyrics": "boolean",
        "embed_metadata": "boolean",
        "create_artist_folder": "boolean",
        "create_album_folder": "boolean"
    })

class SystemHealth(BaseModel):
    status: str
    timestamp: datetime
    gpu_available: bool = False
    active_jobs: int = 0
    model_cached: bool = True
