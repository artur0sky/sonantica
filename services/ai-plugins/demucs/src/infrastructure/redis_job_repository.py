"""
Infrastructure Layer: Redis Job Repository (Adapter)
Implements IJobRepository interface using Redis as storage
"""

import json
import logging
from typing import Optional, List

from src.domain.entities import SeparationJob, JobStatus
from src.domain.repositories import IJobRepository
from src.infrastructure.redis_client import RedisClient
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)


class RedisJobRepository(IJobRepository):
    """
    Redis implementation of IJobRepository.
    Follows Dependency Inversion Principle - Implements abstract interface.
    """
    
    def __init__(self):
        self.key_prefix = "demucs:job"
        self.queue_key = "demucs:queue"
        self.ttl = settings.job_timeout_seconds
    
    async def save(self, job: SeparationJob) -> None:
        """Persist a job in Redis"""
        redis = await RedisClient.get_instance()
        
        # Serialize job to dict
        job_data = job.model_dump(mode='json')
        
        # Ensure ISO strings have the Z suffix for UTC (Go core requirement)
        job_data['created_at'] = job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        job_data['updated_at'] = job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Convert stems list to JSON string safely
        def get_value(x):
            return x.value if hasattr(x, 'value') else str(x)
            
        job_data['stems'] = json.dumps([get_value(stem) for stem in job.stems])
        
        # Filter out None values for Redis hash
        job_data = {k: v for k, v in job_data.items() if v is not None}
        
        # Store in Redis hash
        await redis.hset(f"{self.key_prefix}:{job.id}", mapping=job_data)
        
        # Set status key for quick filtering
        await redis.set(f"{self.key_prefix}:{job.id}:status", get_value(job.status))
        
        # Set expiration
        await redis.expire(f"{self.key_prefix}:{job.id}", self.ttl)
        
        # Add index for track_id + model
        await redis.set(f"demucs:track:{job.track_id}:model:{job.model}", job.id)
        await redis.expire(f"demucs:track:{job.track_id}:model:{job.model}", self.ttl)

        # Maintain active IDs set
        active_key = "demucs:active_ids"
        is_terminal = job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]
        if not is_terminal:
            await redis.sadd(active_key, job.id)
        else:
            await redis.srem(active_key, job.id)

        logger.debug(f"Saved job: {job.id}")
    
    async def get_by_id(self, job_id: str) -> Optional[SeparationJob]:
        """Retrieve a job by ID"""
        redis = await RedisClient.get_instance()
        
        job_data = await redis.hgetall(f"{self.key_prefix}:{job_id}")
        
        if not job_data:
            return None
        
        # Deserialize stems
        job_data['stems'] = json.loads(job_data.get('stems', '[]'))
        
        # Deserialize result if present
        if job_data.get('result'):
            job_data['result'] = json.loads(job_data['result'])
        
        # Convert progress to float
        if 'progress' in job_data:
            job_data['progress'] = float(job_data['progress'])
        
        return SeparationJob(**job_data)
    
    async def update(self, job: SeparationJob) -> None:
        """Update an existing job"""
        # Redis hash update is same as save
        await self.save(job)
        logger.debug(f"Updated job: {job.id}")
    
    async def delete(self, job_id: str) -> None:
        """Delete a job"""
        redis = await RedisClient.get_instance()
        
        await redis.delete(f"{self.key_prefix}:{job_id}")
        await redis.delete(f"{self.key_prefix}:{job_id}:status")
        await redis.srem("demucs:active_ids", job_id)
        
        logger.debug(f"Deleted job: {job_id}")
    
    async def count_by_status(self, statuses: List[JobStatus]) -> int:
        """Count jobs with specific statuses using active set as filter"""
        redis = await RedisClient.get_instance()
        
        # Use active_ids set instead of scanning ALL keys
        active_ids = await redis.smembers("demucs:active_ids")
        if not active_ids:
            return 0
            
        count = 0
        for job_id in active_ids:
            # redis stores bytes or strings depending on client, we need string for status check
            status_val = await redis.get(f"{self.key_prefix}:{job_id}:status")
            if status_val in [s.value for s in statuses]:
                count += 1
        
        return count
    
    async def set_cooldown(self, seconds: int) -> None:
        redis = await RedisClient.get_instance()
        await redis.set("demucs:cooldown", "1", ex=seconds)

    async def is_in_cooldown(self) -> bool:
        redis = await RedisClient.get_instance()
        return await redis.exists("demucs:cooldown") > 0
    
    async def enqueue(self, job_id: str) -> None:
        """Add job to processing queue"""
        redis = await RedisClient.get_instance()
        
        await redis.lpush(self.queue_key, job_id)
        
        logger.debug(f"Enqueued job: {job_id}")

    async def find_by_track_id(self, track_id: str, model: str) -> Optional[SeparationJob]:
        """Find the latest job for a specific track and model"""
        redis = await RedisClient.get_instance()
        job_id = await redis.get(f"demucs:track:{track_id}:model:{model}")
        if not job_id:
            return None
        return await self.get_by_id(job_id)
