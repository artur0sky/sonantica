import json
import logging
from typing import Optional
from ..domain.entities import KnowledgeJob
from .redis_client import RedisClient

logger = logging.getLogger(__name__)

class RedisJobRepository:
    def __init__(self):
        self.key_prefix = "knowledge:job"
        self.ttl = 86400  # 24 hours

    async def save(self, job: KnowledgeJob) -> None:
        redis = await RedisClient.get_instance()
        job_data = job.model_dump(mode='json')
        
        # Consistent date format for Go
        job_data['created_at'] = job.created_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        job_data['updated_at'] = job.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Filter out None values
        job_data = {k: v for k, v in job_data.items() if v is not None}
        
        await redis.hset(f"{self.key_prefix}:{job.id}", mapping=job_data)
        await redis.expire(f"{self.key_prefix}:{job.id}", self.ttl)

    async def get_by_id(self, job_id: str) -> Optional[KnowledgeJob]:
        redis = await RedisClient.get_instance()
        data = await redis.hgetall(f"{self.key_prefix}:{job_id}")
        if not data:
            return None
        return KnowledgeJob(**data)
