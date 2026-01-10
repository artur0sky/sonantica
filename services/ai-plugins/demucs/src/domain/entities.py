"""
Domain Layer: Core Business Entities
Following Clean Architecture - No external dependencies
"""

from enum import Enum
from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job lifecycle states"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StemType(str, Enum):
    """Available stem types from Demucs"""
    VOCALS = "vocals"
    DRUMS = "drums"
    BASS = "bass"
    OTHER = "other"


class SeparationJob(BaseModel):
    """
    Core domain entity representing a stem separation job.
    Immutable business logic, no infrastructure concerns.
    """
    id: str
    track_id: str
    file_path: str
    model: str = "htdemucs"
    stems: List[StemType] = Field(default_factory=lambda: list(StemType))
    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    result: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        use_enum_values = True
    
    def mark_processing(self) -> "SeparationJob":
        """Transition to processing state"""
        return self.model_copy(
            update={
                "status": JobStatus.PROCESSING,
                "updated_at": datetime.utcnow()
            }
        )
    
    def mark_completed(self, result: Dict[str, str]) -> "SeparationJob":
        """Transition to completed state with results"""
        return self.model_copy(
            update={
                "status": JobStatus.COMPLETED,
                "progress": 1.0,
                "result": result,
                "updated_at": datetime.utcnow()
            }
        )
    
    def mark_failed(self, error: str) -> "SeparationJob":
        """Transition to failed state with error"""
        return self.model_copy(
            update={
                "status": JobStatus.FAILED,
                "error": error,
                "updated_at": datetime.utcnow()
            }
        )
    
    def mark_cancelled(self) -> "SeparationJob":
        """Transition to cancelled state"""
        return self.model_copy(
            update={
                "status": JobStatus.CANCELLED,
                "updated_at": datetime.utcnow()
            }
        )
    
    def update_progress(self, progress: float) -> "SeparationJob":
        """Update job progress (0.0 to 1.0)"""
        return self.model_copy(
            update={
                "progress": max(0.0, min(1.0, progress)),
                "updated_at": datetime.utcnow()
            }
        )
    
    def can_be_cancelled(self) -> bool:
        """Business rule: only pending/processing jobs can be cancelled"""
        return self.status in [JobStatus.PENDING, JobStatus.PROCESSING]


class PluginCapability(BaseModel):
    """Plugin capability descriptor"""
    id: str = "demucs"
    name: str = "Demucs Stem Separator"
    version: str = "1.0.0"
    capability: str = "stem-separation"
    description: str = "Isolate vocals, drums, bass, and other instruments from mixed audio"
    model: str = "htdemucs"
    requirements: Dict[str, str] = Field(
        default_factory=lambda: {
            "gpu": "NVIDIA GPU with 6GB+ VRAM recommended",
            "disk": "~2.5 GB for models",
            "processing_time": "2-5 minutes per track"
        }
    )


class SystemHealth(BaseModel):
    """System health status"""
    status: str
    timestamp: datetime
    gpu_available: bool
    active_jobs: int
    model_cached: bool
