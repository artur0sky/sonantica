import json
import logging
from typing import Optional, List
import redis.asyncio as redis
from datetime import datetime

from ..domain.entities import EmbeddingJob, JobStatus
from ..domain.repositories import IJobRepository

logger = logging.getLogger(__name__)

class RedisJobRepository(IJobRepository):
    def __init__(self, redis_client: redis.Redis, prefix: str = "brain:jobs:"):
        self.redis = redis_client
        self.prefix = prefix

    def _get_key(self, job_id: str) -> str:
        return f"{self.prefix}{job_id}"

    async def save(self, job: EmbeddingJob) -> None:
        key = self._get_key(job.id)
        # Store as JSON string
        data = job.to_dict()
        await self.redis.set(key, json.dumps(data), ex=86400 * 7) # 7 days TTL

    async def get_by_id(self, job_id: str) -> Optional[EmbeddingJob]:
        key = self._get_key(job_id)
        data = await self.redis.get(key)
        if not data:
            return None
        
        d = json.loads(data)
        return EmbeddingJob(
            id=d["id"],
            track_id=d["track_id"],
            file_path=d.get("file_path", ""),
            status=JobStatus(d["status"]),
            progress=d["progress"],
            embedding=d.get("embedding"),
            model_version=d.get("model_version"),
            error=d.get("error"),
            created_at=datetime.strptime(d["created_at"], '%Y-%m-%dT%H:%M:%SZ'),
            updated_at=datetime.strptime(d["updated_at"], '%Y-%m-%dT%H:%M:%SZ')
        )

    async def get_active_count(self) -> int:
        # This is a simplified version. In production we'd use a dedicated set for active jobs.
        keys = await self.redis.keys(f"{self.prefix}*")
        return len(keys)
