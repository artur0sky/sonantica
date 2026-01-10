import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional, List

from ..domain.entities import EmbeddingJob, JobStatus, HealthStatus, JobPriority
from ..domain.repositories import IJobRepository, IAudioEmbedder, IHealthProvider, IVectorRepository
from ..infrastructure.logging.context import set_trace_id, get_trace_id

logger = logging.getLogger(__name__)

class CreateEmbeddingJob:
    def __init__(self, repository: IJobRepository):
        self.repository = repository

    async def execute(self, track_id: str, file_path: str, priority: JobPriority = JobPriority.NORMAL, max_concurrent: int = 0, cooldown: int = 30) -> EmbeddingJob:
        # 1. Business Rule: Deduplication/Caching
        existing_job = await self.repository.find_by_track_id(track_id)
        if existing_job and existing_job.status in [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.PENDING]:
            logger.info(f"Using existing job {existing_job.id} for track {track_id}")
            return existing_job

        job = EmbeddingJob(
            id=str(uuid.uuid4()),
            track_id=track_id,
            file_path=file_path,
            status=JobStatus.PENDING,
            priority=priority
        )
        await self.repository.save(job)
        logger.info(f"Created embedding job {job.id} for track {track_id}")
        return job

class ProcessEmbeddingJob:
    _semaphore: Optional[asyncio.Semaphore] = None

    def __init__(self, repository: IJobRepository, embedder: IAudioEmbedder, vector_repo: IVectorRepository, max_parallel: int = 4):
        self.repository = repository
        self.embedder = embedder
        self.vector_repo = vector_repo
        
        # Initialize semaphore once with provided limit
        if ProcessEmbeddingJob._semaphore is None:
            limit = max_parallel if max_parallel > 0 else 4
            ProcessEmbeddingJob._semaphore = asyncio.Semaphore(limit)

    async def execute(self, job_id: str) -> None:
        set_trace_id(job_id) # Use job_id as trace_id for consistency
        
        # Adding a tiny jitter/delay to avoid stampede on batch starts
        await asyncio.sleep(0.1) 

        async with self._semaphore:
            job = await self.repository.get_by_id(job_id)
        
        if not job or job.status != JobStatus.PENDING:
            if job and job.status == JobStatus.COMPLETED:
                logger.info(f"SKIP | Job {job_id} already completed for track {job.track_id}")
            else:
                logger.warning(f"SKIP | Job {job_id} not found or not pending (status: {job.status if job else 'N/A'})")
            return

        logger.info(f"START | Processing embedding for track {job.track_id} | Path: {job.file_path}")

        try:
            # Update to processing
            job = job.mark_processing()
            await self.repository.save(job)

            # Generate Embeddings (Heavy Task)
            embedding = await self.embedder.generate_embedding(job.file_path)
            model_version = self.embedder.get_model_version()

            # Complete Job
            job = job.mark_completed(embedding, model_version)
            await self.repository.save(job)
            
            # Persist to Vector Search Engine (Postgres)
            try:
                await self.vector_repo.save_embedding(
                    track_id=job.track_id,
                    embedding=embedding,
                    model_name=model_version
                )
            except Exception as ve:
                logger.error(f"FAIL | Vector storage | track={job.track_id} | Error: {ve}")
                # We don't fail the job if vector repo is down, but we log it
            
            logger.info(f"DONE | Successfully processed embedding for track {job.track_id}")

        except Exception as e:
            logger.exception(f"FAIL | Processing job {job_id} | Error: {str(e)}")
            job = job.mark_failed(str(e))
            await self.repository.save(job)

class GetJobStatus:
    def __init__(self, repository: IJobRepository):
        self.repository = repository

    async def execute(self, job_id: str) -> Optional[EmbeddingJob]:
        return await self.repository.get_by_id(job_id)

class GetHealth:
    def __init__(self, provider: IHealthProvider):
        self.provider = provider

    async def execute(self) -> HealthStatus:
        return await self.provider.get_status()

class GetRecommendations:
    def __init__(self, vector_repo: IVectorRepository):
        self.vector_repo = vector_repo

    async def execute(self, track_id: Optional[str] = None, limit: int = 10, diversity: float = 0.2) -> List[dict]:
        if track_id:
            # 1. Fetch a larger pool of tracks to infer artists/albums
            # We fetch 3x the limit or at least 30 to get good statistics
            fetch_limit = max(limit * 3, 30)
            
            tracks = await self.vector_repo.get_similar_tracks(track_id, fetch_limit, diversity)
            
            # 2. Aggregate scores for Artists and Albums
            artist_scores = {}
            album_scores = {}
            
            for t in tracks:
                score = t.get("score", 0)
                aid = t.get("artist_id")
                alid = t.get("album_id")
                
                if aid:
                    artist_scores[aid] = artist_scores.get(aid, 0) + score
                if alid:
                    album_scores[alid] = album_scores.get(alid, 0) + score

            # 3. Create Recommendations for Top Artists/Albums
            # Sort by total score
            top_artists = sorted(artist_scores.items(), key=lambda x: x[1], reverse=True)[:3]
            top_albums = sorted(album_scores.items(), key=lambda x: x[1], reverse=True)[:3]
            
            recommendations = []
            
            # Add Tracks (trunk to original limit)
            recommendations.extend(tracks[:limit])
            
            # Add Artists (if score is significant)
            for aid, total_score in top_artists:
                 recommendations.append({
                     "id": aid,
                     "type": "artist",
                     "score": total_score / fetch_limit, # Normalize roughly
                     "reason": "Inferred from similar tracks"
                 })

            # Add Albums
            for alid, total_score in top_albums:
                 recommendations.append({
                     "id": alid,
                     "type": "album",
                     "score": total_score / fetch_limit,
                     "reason": "Inferred from similar tracks"
                 })
                 
            return recommendations
        else:
            # Discovery mode
            return await self.vector_repo.get_discovery_tracks(limit)
