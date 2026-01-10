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
        
        # Convert datetime objects to ISO strings
        job_data['created_at'] = job.created_at.isoformat()
        job_data['updated_at'] = job.updated_at.isoformat()
        
        # Convert stems list to JSON string
        job_data['stems'] = json.dumps([stem.value for stem in job.stems])
        
        # Store in Redis hash
        await redis.hset(f"{self.key_prefix}:{job.id}", mapping=job_data)
        
        # Set status key for quick filtering
        await redis.set(f"{self.key_prefix}:{job.id}:status", job.status.value)
        
        # Set expiration
        await redis.expire(f"{self.key_prefix}:{job.id}", self.ttl)
        
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
        
        logger.debug(f"Deleted job: {job_id}")
    
    async def count_by_status(self, statuses: List[JobStatus]) -> int:
        """Count jobs with specific statuses"""
        redis = await RedisClient.get_instance()
        
        # Get all status keys
        status_keys = await redis.keys(f"{self.key_prefix}:*:status")
        
        count = 0
        for key in status_keys:
            status = await redis.get(key)
            if status in [s.value for s in statuses]:
                count += 1
        
        return count
    
    async def enqueue(self, job_id: str) -> None:
        """Add job to processing queue"""
        redis = await RedisClient.get_instance()
        
        await redis.lpush(self.queue_key, job_id)
        
        logger.debug(f"Enqueued job: {job_id}")
