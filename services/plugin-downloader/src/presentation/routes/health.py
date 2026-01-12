"""
Presentation Layer: Health Route
"""
from datetime import datetime
from fastapi import APIRouter
from src.domain.entities import SystemHealth

router = APIRouter()

@router.get("/health", response_model=SystemHealth)
async def get_health():
    """
    Returns system health status for monitoring.
    """
    return SystemHealth(
        status="ok",
        timestamp=datetime.utcnow(),
        gpu_available=False,
        active_jobs=0, # Simplified
        model_cached=True
    )
