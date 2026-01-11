import asyncpg
import logging
import json
import random
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
                        INSERT INTO embeddings_audio_spectral (track_id, embedding, model_name)
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
                    logger.info(f"✓ Embedding saved for track {track_id} in Postgres (Audio Spectral)")
                except Exception as e:
                    logger.error(f"Failed to save embedding in Postgres: {e}")
                    raise e

    async def save_stem_embedding(self, track_id: str, embedding: List[float], stem_type: str, model_name: str):
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                try:
                    vector_str = "[" + ",".join(map(str, embedding)) + "]"
                    await conn.execute(
                        """
                        INSERT INTO embeddings_audio_stems (track_id, embedding, stem_type, model_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (track_id, stem_type) DO UPDATE 
                        SET embedding = $2, model_name = $4, updated_at = NOW()
                        """,
                        track_id, vector_str, stem_type, model_name
                    )
                    logger.info(f"✓ Stem embedding saved for track {track_id} type {stem_type}")
                except Exception as e:
                    logger.error(f"Failed to save stem embedding: {e}")
                    raise e

    async def get_similar_tracks(self, track_id: str, limit: int = 10, diversity: float = 0.2, weights: dict = None) -> List[Dict[str, Any]]:
        # Prepare weights
        w_audio = weights.get("audio", 0.0)
        w_lyrics = weights.get("lyrics", 0.0)
        w_visual = weights.get("visual", 0.0)
        w_stems = weights.get("stems", 0.0)
        
        # Determine active queries based on weights > 0
        active_sources = []
        if w_audio > 0: active_sources.append("audio")
        if w_lyrics > 0: active_sources.append("lyrics")
        if w_visual > 0: active_sources.append("visual")
        if w_stems > 0: active_sources.append("stems")
        
        if not active_sources:
             # Default to audio if nothing selected, or handle gracefully
             w_audio = 1.0
             active_sources = ["audio"]

        pool = await self._get_pool()
        async with pool.acquire() as conn:
            # 1. Fetch source embeddings for the requested track
            # We need to fetch all relevant embeddings first
            queries = []
            if w_audio > 0:
                queries.append(f"SELECT embedding::text as vec, 'audio' as type FROM embeddings_audio_spectral WHERE track_id = '{track_id}'")
            if w_lyrics > 0:
                 queries.append(f"SELECT embedding::text as vec, 'lyrics' as type FROM embeddings_lyrics_semantic WHERE track_id = '{track_id}'")
            if w_visual > 0:
                 queries.append(f"SELECT embedding::text as vec, 'visual' as type FROM embeddings_visual_aesthetic WHERE track_id = '{track_id}'")
            if w_stems > 0:
                 queries.append(f"SELECT embedding::text as vec, 'stems' as type FROM embeddings_audio_stems WHERE track_id = '{track_id}'")
            
            union_query = " UNION ALL ".join(queries)
            source_vecs = await conn.fetch(union_query)
            
            vec_map = {r['type']: r['vec'] for r in source_vecs}
            
            # If primary modality missing, fallback or return empty
            if w_audio > 0 and 'audio' not in vec_map:
                logger.warning(f"Missing audio embedding for source {track_id}")
                return []

            # 2. Build Multi-Modal Query
            # We use a CTE to calculating individual scores then aggregate
            
            # CTE Parts
            ctes = []
            selects = []
            
            if w_audio > 0 and 'audio' in vec_map:
                ctes.append(f"""
                audio_scores AS (
                    SELECT track_id, (1 - (embedding <=> '{vec_map['audio']}'::vector)) as score
                    FROM embeddings_audio_spectral
                    WHERE track_id != '{track_id}'
                     -- Optimization: pre-filter top K per modality if needed, but for now scan all
                )
                """)
                selects.append(f"COALESCE(a.score, 0) * {w_audio}")
            
            if w_lyrics > 0 and 'lyrics' in vec_map:
                ctes.append(f"""
                lyrics_scores AS (
                    SELECT track_id, (1 - (embedding <=> '{vec_map['lyrics']}'::vector)) as score
                    FROM embeddings_lyrics_semantic
                    WHERE track_id != '{track_id}'
                )
                """)
                selects.append(f"COALESCE(l.score, 0) * {w_lyrics}")
                
            if w_visual > 0 and 'visual' in vec_map:
                ctes.append(f"""
                visual_scores AS (
                    SELECT track_id, (1 - (embedding <=> '{vec_map['visual']}'::vector)) as score
                    FROM embeddings_visual_aesthetic
                    WHERE track_id != '{track_id}'
                )
                """)
                selects.append(f"COALESCE(v.score, 0) * {w_visual}")
                
            if w_stems > 0 and 'stems' in vec_map:
                 ctes.append(f"""
                stems_scores AS (
                    SELECT track_id, (1 - (embedding <=> '{vec_map['stems']}'::vector)) as score
                    FROM embeddings_audio_stems
                    WHERE track_id != '{track_id}'
                )
                """)
                 selects.append(f"COALESCE(s.score, 0) * {w_stems}")

            # Construct Aggregate Query
            cte_sql = ",\n".join(ctes)
            
            # Base logic: Join all existing score tables
            # We start from audio sources usually as it's the most abundant, or full outer join equivalent
            # For simplicity & performance, we drive from the tracks table or the most populated embedding table
            
            join_clause = "FROM audio_scores a"
            if w_lyrics > 0 and 'lyrics' in vec_map: join_clause += " FULL OUTER JOIN lyrics_scores l ON a.track_id = l.track_id"
            if w_visual > 0 and 'visual' in vec_map: join_clause += " FULL OUTER JOIN visual_scores v ON COALESCE(a.track_id, l.track_id) = v.track_id"
            # Note: The join logic gets complex with FULL OUTER JOINS for > 2 tables.
            # Simpler approach: UNION ALL track_ids and scores, then Group By track_id
            
            # REVISED APPROACH: UNION ALL for simpler aggregation
            union_parts = []
            if w_audio > 0 and 'audio' in vec_map:
                union_parts.append(f"SELECT track_id, (1 - (embedding <=> '{vec_map['audio']}'::vector)) * {w_audio} as weighted_score FROM embeddings_audio_spectral WHERE track_id != '{track_id}'")
            if w_lyrics > 0 and 'lyrics' in vec_map:
                union_parts.append(f"SELECT track_id, (1 - (embedding <=> '{vec_map['lyrics']}'::vector)) * {w_lyrics} as weighted_score FROM embeddings_lyrics_semantic WHERE track_id != '{track_id}'")
            if w_visual > 0 and 'visual' in vec_map:
                union_parts.append(f"SELECT track_id, (1 - (embedding <=> '{vec_map['visual']}'::vector)) * {w_visual} as weighted_score FROM embeddings_visual_aesthetic WHERE track_id != '{track_id}'")
            if w_stems > 0 and 'stems' in vec_map:
                 # Note: Stems might have multiple entries per track_id (vocals, drums). We should avg or max them?
                 # For simplicity, assumed stems table has one vector or we query specific stem type. 
                 # Schema 007 has stem_type. We should probably match same stem type.
                 # For this iteration, let's assume one main stem vector or avg. 
                 # *Refinement*: Brain generates one audio vector. Demucs generates 4.
                 # Let's Skip stems complexity for this step and focus on Audio/Lyrics/Visual 1:1 mapping.
                 pass

            full_union = " UNION ALL ".join(union_parts)
            
            total_weight = sum([w_audio if 'audio' in vec_map else 0, w_lyrics if 'lyrics' in vec_map else 0, w_visual if 'visual' in vec_map else 0])
            if total_weight == 0: total_weight = 1.0

            pool_factor = 1 + (diversity * 4) 
            pool_limit = int(limit * pool_factor)

            final_sql = f"""
            WITH combined_scores AS (
                {full_union}
            ),
            aggregated AS (
                SELECT track_id, sum(weighted_score) / {total_weight} as final_score
                FROM combined_scores
                GROUP BY track_id
            )
            SELECT 
                ag.track_id, 
                ag.final_score,
                t.artist_id, 
                t.album_id
            FROM aggregated ag
            JOIN tracks t ON ag.track_id = t.id
            ORDER BY final_score DESC
            LIMIT {pool_limit}
            """
            
            rows = await conn.fetch(final_sql)
            
            # Dynamic Reason Generation
            top_modality = "Audio"
            if w_lyrics > w_audio: top_modality = "Lyrical"
            if w_visual > max(w_audio, w_lyrics): top_modality = "Visual"
            if abs(w_audio - w_lyrics) < 0.2 and w_audio > 0.3: top_modality = "Balanced"
             
            results = [{
                "id": str(r["track_id"]),
                "score": float(r["final_score"]),
                "type": "track",
                "reason": f"{top_modality} Match",
                "artist_id": str(r["artist_id"]) if r["artist_id"] else None,
                "album_id": str(r["album_id"]) if r["album_id"] else None
            } for r in rows]

            # Apple Diversity
            if diversity > 0.1 and len(results) > limit:
                random.shuffle(results)
                results = results[:limit]
            else:
                results = results[:limit]
                
            return results

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
