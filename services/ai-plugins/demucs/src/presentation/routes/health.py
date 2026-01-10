"""
Presentation Layer: Health Check Route
Provides system health status for monitoring
"""

from fastapi import APIRouter, HTTPException

from src.domain.entities import SystemHealth
from src.application.use_cases import GetSystemHealthUseCase
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.infrastructure.demucs_separator import DemucsStemSeparator
from src.infrastructure.config import settings

router = APIRouter()


@router.get("/health", response_model=SystemHealth)
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns system status and metrics.
    """
    try:
        # Initialize dependencies
        job_repository = RedisJobRepository()
        stem_separator = DemucsStemSeparator()
        
        # Execute use case
        use_case = GetSystemHealthUseCase(
            job_repository=job_repository,
            stem_separator=stem_separator,
            model_cache_path=str(settings.torch_home)
        )
        
        health_data = await use_case.execute()
        
        return SystemHealth(**health_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )
