import asyncio
import logging
import time
from datetime import datetime
from src.domain.entities import KnowledgeJob, JobPriority, JobStatus
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

class PriorityJobManager:
    """
    Manages knowledge enrichment jobs with priority using an internal PriorityQueue.
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

    async def start(self, processor_func):
        """
        Start worker tasks. 
        processor_func: The function that actually does the work (process_job).
        """
        if self._running:
            return
        
        self._running = True
        num_workers = settings.MAX_CONCURRENT_JOBS if settings.MAX_CONCURRENT_JOBS > 0 else 2
        logger.info(f"Starting Knowledge PriorityJobManager with {num_workers} workers")
        
        for i in range(num_workers):
            task = asyncio.create_task(self._worker(i, processor_func))
            self.workers.append(task)
            
        await self._recover_pending_jobs()

    async def stop(self):
        self._running = False
        for task in self.workers:
            task.cancel()
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers = []

    async def enqueue(self, job: KnowledgeJob):
        priority_val = int(job.priority)
        # Safely get priority name for logging
        try:
            priority_name = JobPriority(priority_val).name
        except (ValueError, TypeError):
            priority_name = str(priority_val)
            
        entry = (priority_val, job.created_at.timestamp(), job.id)
        await self.queue.put(entry)
        logger.info(f"Enqueued Knowledge job {job.id} with priority {priority_name}")

    async def _worker(self, worker_id: int, processor_func):
        logger.info(f"Knowledge Worker {worker_id} started")
        
        while self._running:
            try:
                priority, timestamp, job_id = await self.queue.get()
                logger.info(f"Knowledge Worker {worker_id} picked up job {job_id} (priority={priority})")
                
                try:
                    await processor_func(job_id)
                except Exception as e:
                    logger.exception(f"Knowledge Worker {worker_id} failed processing job {job_id}: {e}")
                finally:
                    self.queue.task_done()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Knowledge Worker {worker_id} error: {e}")
                await asyncio.sleep(1)

    async def _recover_pending_jobs(self):
        try:
            repo = RedisJobRepository()
            from src.infrastructure.redis_client import RedisClient
            redis = await RedisClient.get_instance()
            
            active_ids = await redis.smembers("knowledge:active_ids")
            
            count = 0
            for job_id_bytes in active_ids:
                job_id = job_id_bytes.decode() if isinstance(job_id_bytes, bytes) else job_id_bytes
                job = await repo.get_by_id(job_id)
                if job and job.status == JobStatus.PENDING:
                    await self.enqueue(job)
                    count += 1
            
            if count > 0:
                logger.info(f"Recovered {count} pending Knowledge jobs from Redis")
        except Exception as e:
            logger.error(f"Failed to recover pending Knowledge jobs: {e}")

# Global instance
job_manager = PriorityJobManager()
