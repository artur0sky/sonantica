"""
Domain Layer: Repository Interfaces (Ports)
Following Dependency Inversion Principle - Abstract contracts
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from src.domain.entities import SeparationJob, JobStatus


class IJobRepository(ABC):
    """
    Abstract repository for job persistence.
    Infrastructure layer will implement this interface.
    """
    
    @abstractmethod
    async def save(self, job: SeparationJob) -> None:
        """Persist a job"""
        pass
    
    @abstractmethod
    async def get_by_id(self, job_id: str) -> Optional[SeparationJob]:
        """Retrieve a job by ID"""
        pass
    
    @abstractmethod
    async def update(self, job: SeparationJob) -> None:
        """Update an existing job"""
        pass
    
    @abstractmethod
    async def delete(self, job_id: str) -> None:
        """Delete a job"""
        pass
    
    @abstractmethod
    async def count_by_status(self, statuses: List[JobStatus]) -> int:
        """Count jobs with specific statuses"""
        pass
    
    @abstractmethod
    async def enqueue(self, job_id: str) -> None:
        """Add job to processing queue"""
        pass

    @abstractmethod
    async def find_by_track_id(self, track_id: str, model: str) -> Optional[SeparationJob]:
        """Find the latest job for a specific track and model"""
        pass

    @abstractmethod
    async def set_cooldown(self, seconds: int) -> None:
        pass

    @abstractmethod
    async def is_in_cooldown(self) -> bool:
        pass


class IStemSeparator(ABC):
    """
    Abstract interface for stem separation engine.
    Allows swapping Demucs with other implementations.
    """
    
    @abstractmethod
    async def separate(
        self,
        audio_path: str,
        output_dir: str,
        model: str,
        stems: List[str]
    ) -> dict[str, str]:
        """
        Separate audio into stems.
        
        Args:
            audio_path: Path to input audio file
            output_dir: Directory to save stems
            model: Model name to use
            stems: List of stem types to extract
            
        Returns:
            Dictionary mapping stem names to output file paths
        """
        pass
    
    @abstractmethod
    def is_gpu_available(self) -> bool:
        """Check if GPU acceleration is available"""
        pass
    
    @abstractmethod
    def get_model_info(self, model: str) -> dict:
        """Get information about a specific model"""
        pass
