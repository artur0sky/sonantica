import asyncpg
import logging
import json
from typing import List, Optional, Dict, Any
from ..domain.entities import Recommendation
from .database import get_db_pool

logger = logging.getLogger(__name__)

class PostgresVectorRepository:
    def __init__(self, dsn: str):
        self.dsn = dsn

    async def _get_pool(self):
        return await get_db_pool()

    async def save_embedding(self, track_id: str, embedding: List[float], model_name: str):
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                try:
                    # pgvector expects a string representation of the vector for asyncpg or a specific type
                    # but often [1,2,3] works if the driver is configured. 
                    # For basic asyncpg, we might need to pass it as a string '[1,2,3]'
                    vector_str = "[" + ",".join(map(str, embedding)) + "]"
                    
                    await conn.execute(
                        """
                        INSERT INTO track_embeddings (track_id, embedding, model_name)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (track_id) DO UPDATE 
                        SET embedding = $2, model_name = $3, updated_at = NOW()
                        """,
                        track_id, vector_str, model_name
                    )
                    # Also update tracks table
                    await conn.execute(
                        "UPDATE tracks SET has_embeddings = TRUE WHERE id = $1",
                        track_id
                    )
                    logger.info(f"✓ Embedding saved for track {track_id} in Postgres")
                except Exception as e:
                    logger.error(f"Failed to save embedding in Postgres: {e}")
                    raise e

    async def get_similar_tracks(self, track_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            # Get the embedding for the given track
            embedding_str = await conn.fetchval(
                "SELECT embedding::text FROM track_embeddings WHERE track_id = $1",
                track_id
            )
            if not embedding_str:
                logger.warning(f"No embedding found for track {track_id}")
                return []

            # Find similar using cosine distance (<=>)
            # Result score converted from distance to similarity (1 - distance)
            rows = await conn.fetch(
                """
                SELECT track_id, (1 - (embedding <=> $2::vector)) as score
                FROM track_embeddings
                WHERE track_id != $1
                ORDER BY embedding <=> $2::vector
                LIMIT $3
                """,
                track_id, embedding_str, limit
            )
            return [{"id": str(r["track_id"]), "score": float(r["score"]), "type": "track", "reason": "Sonic similarity (AI Brain)"} for r in rows]

    async def get_discovery_tracks(self, limit: int = 10) -> List[Dict[str, Any]]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            # Simple discovery logic: random analyzed tracks
            rows = await conn.fetch(
                """
                SELECT id as track_id
                FROM tracks
                WHERE has_embeddings = TRUE
                ORDER BY RANDOM()
                LIMIT $1
                """,
                limit
            )
            return [{"id": str(r["track_id"]), "score": 0.8, "type": "track", "reason": "Fresh discovery (AI Brain)"} for r in rows]
