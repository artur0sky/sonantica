from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
import uuid

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class CapabilityType(str, Enum):
    EMBEDDINGS = "embeddings"

@dataclass(frozen=True)
class PluginCapability:
    type: CapabilityType
    name: str
    version: str
    description: str

@dataclass(frozen=True)
class EmbeddingJob:
    id: str
    track_id: str
    file_path: str
    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    embedding: Optional[List[float]] = None
    model_version: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "track_id": self.track_id,
            "file_path": self.file_path,
            "status": self.status.value,
            "progress": self.progress,
            "embedding": self.embedding,
            "model_version": self.model_version,
            "error": self.error,
            "created_at": self.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "updated_at": self.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        }

@dataclass(frozen=True)
class HealthStatus:
    status: str
    version: str
    uptime_seconds: float
    gpu_available: bool
    gpu_name: Optional[str] = None
    memory_usage_mb: float = 0.0
    active_jobs: int = 0
