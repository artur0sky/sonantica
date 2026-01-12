from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobPriority(int, Enum):
    """Job priority levels (Lower value = Higher priority)"""
    STREAMING = 0   # Immediate priority
    NORMAL = 10     # Standard
    LOW = 20        # Background

class KnowledgeJob(BaseModel):
    id: str
    track_id: str
    status: JobStatus = JobStatus.PENDING
    priority: JobPriority = JobPriority.NORMAL
    progress: float = 0.0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True
