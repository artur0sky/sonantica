import asyncio
import logging
from typing import Dict, Any, List
from src.domain.entities import EmbeddingJob, JobPriority, JobStatus
from src.application.use_cases import ProcessEmbeddingJob
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.infrastructure.audio_embedder import ClapEmbedder
from src.infrastructure.postgres_vector_repository import PostgresVectorRepository
from src.infrastructure.config import settings
from src.infrastructure.redis_client import get_redis_client

logger = logging.getLogger(__name__)

class PriorityJobManager:
    """
    Manages embedding jobs with priority using an internal PriorityQueue.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PriorityJobManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.queue = asyncio.PriorityQueue()
        self.workers = []
        self._initialized = True
        self._running = False

    async def start(self):
        if self._running:
            return
        
        self._running = True
        num_workers = settings.MAX_CONCURRENT_JOBS if settings.MAX_CONCURRENT_JOBS > 0 else 2
        logger.info(f"Starting Brain PriorityJobManager with {num_workers} workers")
        
        for i in range(num_workers):
            task = asyncio.create_task(self._worker(i))
            self.workers.append(task)
            
        await self._recover_pending_jobs()

    async def stop(self):
        self._running = False
        for task in self.workers:
            task.cancel()
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers = []

    async def enqueue(self, job: EmbeddingJob):
        priority_val = int(job.priority)
        # Safely get priority name for logging
        try:
            priority_name = JobPriority(priority_val).name
        except (ValueError, TypeError):
            priority_name = str(priority_val)
            
        entry = (priority_val, job.created_at.timestamp(), job.id)
        await self.queue.put(entry)
        logger.info(f"Enqueued Brain job {job.id} with priority {priority_name}")

    async def _worker(self, worker_id: int):
        logger.info(f"Brain Worker {worker_id} started")
        
        redis = await get_redis_client()
        job_repository = RedisJobRepository(redis)
        embedder = ClapEmbedder()
        vector_repo = PostgresVectorRepository(settings.POSTGRES_URL)
        
        use_case = ProcessEmbeddingJob(
            repository=job_repository,
            embedder=embedder,
            vector_repo=vector_repo,
            max_parallel=settings.MAX_CONCURRENT_JOBS
        )

        while self._running:
            try:
                priority, timestamp, job_id = await self.queue.get()
                logger.info(f"Brain Worker {worker_id} picked up job {job_id} (priority={priority})")
                
                try:
                    await use_case.execute(job_id)
                except Exception as e:
                    logger.exception(f"Brain Worker {worker_id} failed processing job {job_id}: {e}")
                finally:
                    self.queue.task_done()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Brain Worker {worker_id} error: {e}")
                await asyncio.sleep(1)

    async def _recover_pending_jobs(self):
        try:
            redis = await get_redis_client()
            repo = RedisJobRepository(redis)
            
            # We need to find pending jobs.
            # In Brain, we use a set 'brain:active_ids'
            active_ids = await redis.smembers("brain:active_ids")
            
            count = 0
            for job_id_bytes in active_ids:
                job_id = job_id_bytes.decode() if isinstance(job_id_bytes, bytes) else job_id_bytes
                job = await repo.get_by_id(job_id)
                if job and job.status == JobStatus.PENDING:
                    await self.enqueue(job)
                    count += 1
            
            if count > 0:
                logger.info(f"Recovered {count} pending Brain jobs from Redis")
        except Exception as e:
            logger.error(f"Failed to recover pending Brain jobs: {e}")

# Global instance
job_manager = PriorityJobManager()
