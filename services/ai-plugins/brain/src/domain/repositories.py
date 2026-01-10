from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from .entities import EmbeddingJob, HealthStatus

class IJobRepository(ABC):
    @abstractmethod
    async def save(self, job: EmbeddingJob) -> None:
        pass

    @abstractmethod
    async def get_by_id(self, job_id: str) -> Optional[EmbeddingJob]:
        pass

    @abstractmethod
    async def get_active_count(self) -> int:
        pass

    @abstractmethod
    async def find_by_track_id(self, track_id: str) -> Optional[EmbeddingJob]:
        pass

class IAudioEmbedder(ABC):
    @abstractmethod
    async def list_models(self) -> List[str]:
        pass

    @abstractmethod
    async def generate_embedding(self, file_path: str) -> List[float]:
        """Generates a high-dimensional vector for the given audio file."""
        pass

    @abstractmethod
    def get_model_version(self) -> str:
        pass

class IHealthProvider(ABC):
    @abstractmethod
    async def get_status(self) -> HealthStatus:
        pass

class IVectorRepository(ABC):
    @abstractmethod
    async def save_embedding(self, track_id: str, embedding: List[float], model_name: str) -> None:
        pass

    @abstractmethod
    async def get_similar_tracks(self, track_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_discovery_tracks(self, limit: int = 10) -> List[Dict[str, Any]]:
        pass
