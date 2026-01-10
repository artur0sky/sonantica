from abc import ABC, abstractmethod
from typing import List, Optional
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
