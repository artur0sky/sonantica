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

class RecommendationRequest(BaseModel):
    track_id: Optional[str] = None
    limit: int = 10
    context: Optional[List[str]] = None

@router.post("")
async def get_recommendations(
    request: RecommendationRequest,
    x_internal_secret: Optional[str] = Header(None),
    vector_repo: PostgresVectorRepository = Depends(get_vector_repo)
):
    if x_internal_secret != settings.INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    use_case = GetRecommendations(vector_repo)
    recs = await use_case.execute(request.track_id, request.limit)
    return recs
