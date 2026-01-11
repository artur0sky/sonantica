from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional

from ...infrastructure.config import settings
from ...application.use_cases import GetRecommendations
from ...infrastructure.postgres_vector_repository import PostgresVectorRepository

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

async def get_vector_repo():
    if not settings.POSTGRES_URL:
        raise HTTPException(status_code=501, detail="Postgres vector storage not configured")
    return PostgresVectorRepository(settings.POSTGRES_URL)

class Weights(BaseModel):
    audio: float = 1.0
    lyrics: float = 0.0
    visual: float = 0.0
    stems: float = 0.0

class RecommendationRequest(BaseModel):
    track_id: Optional[str] = None
    limit: int = 10
    context: Optional[List[str]] = None
    diversity: float = 0.2
    weights: Weights = Weights()

@router.post("")
async def get_recommendations(
    request: RecommendationRequest,
    x_internal_secret: Optional[str] = Header(None),
    vector_repo: PostgresVectorRepository = Depends(get_vector_repo)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Check Plugin Availability for requested weights
    from ...infrastructure.plugin_registry import PluginRegistry
    registry = PluginRegistry.get_instance()
    
    if request.weights.lyrics > 0 and not registry.is_enabled("knowledge"):
        # We don't fail, just warn effectively by ignoring (or could add warning field in response)
        # For now, we proceed but the use case handles the zero-ing if data missing
        pass

    if request.weights.stems > 0 and not registry.is_enabled("demucs"):
        pass

    use_case = GetRecommendations(vector_repo)
    recs = await use_case.execute(
        track_id=request.track_id, 
        limit=request.limit, 
        diversity=request.diversity,
        weights=request.weights.dict()
    )
    return recs
