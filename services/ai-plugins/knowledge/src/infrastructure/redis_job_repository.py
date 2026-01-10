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
        # Index by track
        await redis.set(f"knowledge:track:{job.track_id}", job.id, ex=self.ttl)
        
        # Maintain active IDs set
        active_key = "knowledge:active_ids"
        is_terminal = job.status in ["completed", "failed", "cancelled"]
        if not is_terminal:
            await redis.sadd(active_key, job.id)
        else:
            await redis.srem(active_key, job.id)

    async def get_by_id(self, job_id: str) -> Optional[KnowledgeJob]:
        redis = await RedisClient.get_instance()
        data = await redis.hgetall(f"{self.key_prefix}:{job_id}")
        if not data:
            return None
        return KnowledgeJob(**data)

    async def get_active_count(self) -> int:
        redis = await RedisClient.get_instance()
        return await redis.scard("knowledge:active_ids")

    async def set_cooldown(self, seconds: int) -> None:
        redis = await RedisClient.get_instance()
        await redis.set("knowledge:cooldown", "1", ex=seconds)

    async def is_in_cooldown(self) -> bool:
        redis = await RedisClient.get_instance()
        return await redis.exists("knowledge:cooldown") > 0

    async def find_by_track_id(self, track_id: str) -> Optional[KnowledgeJob]:
        redis = await RedisClient.get_instance()
        job_id = await redis.get(f"knowledge:track:{track_id}")
        if not job_id:
            return None
        return await self.get_by_id(job_id)
