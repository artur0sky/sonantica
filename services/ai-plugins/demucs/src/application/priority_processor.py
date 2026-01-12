import asyncio
import logging
from typing import Dict, Any, List
from src.domain.entities import SeparationJob, JobPriority
from src.application.use_cases import ProcessSeparationJobUseCase
from src.infrastructure.redis_job_repository import RedisJobRepository
from src.infrastructure.demucs_separator import DemucsStemSeparator
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

class PriorityJobManager:
    """
    Manages jobs with priority using an internal PriorityQueue.
    Implements the 'Supermarket Checkout' pattern with skip-the-line priority.
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
        """Start worker tasks based on max_concurrent_jobs"""
        if self._running:
            return
        
        self._running = True
        num_workers = settings.max_concurrent_jobs if settings.max_concurrent_jobs > 0 else 1
        logger.info(f"Starting PriorityJobManager with {num_workers} workers")
        
        for i in range(num_workers):
            task = asyncio.create_task(self._worker(i))
            self.workers.append(task)
            
        # Re-enqueue pending jobs from Redis on startup
        await self._recover_pending_jobs()

    async def stop(self):
        """Stop all workers"""
        self._running = False
        for task in self.workers:
            task.cancel()
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers = []

    async def enqueue(self, job: SeparationJob):
        """Add a job to the priority queue"""
        # asyncio.PriorityQueue sorts by first element of tuple (lowest first)
        # We use a tuple: (priority_val, timestamp, job_id)
        # timestamp ensures FIFO among same priority
        priority_val = int(job.priority)
        from datetime import datetime
        
        # Safely get priority name for logging
        try:
            priority_name = JobPriority(priority_val).name
        except (ValueError, TypeError):
            priority_name = str(priority_val)
            
        entry = (priority_val, job.created_at.timestamp(), job.id)
        await self.queue.put(entry)
        logger.info(f"Enqueued job {job.id} with priority {priority_name}")

    async def _worker(self, worker_id: int):
        """Worker loop to process jobs from the queue"""
        logger.info(f"Worker {worker_id} started")
        
        # Initialize dependencies once per worker or use factory
        job_repository = RedisJobRepository()
        stem_separator = DemucsStemSeparator()
        
        use_case = ProcessSeparationJobUseCase(
            job_repository=job_repository,
            stem_separator=stem_separator,
            output_base_path=str(settings.output_path),
            max_parallel=settings.max_concurrent_jobs # Semaphore still exists as safety, but workers handle flow
        )

        while self._running:
            try:
                # Wait for next job
                priority, timestamp, job_id = await self.queue.get()
                
                logger.info(f"Worker {worker_id} picked up job {job_id} (priority={priority})")
                
                try:
                    await use_case.execute(job_id)
                except Exception as e:
                    logger.exception(f"Worker {worker_id} failed processing job {job_id}: {e}")
                finally:
                    self.queue.task_done()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)

    async def _recover_pending_jobs(self):
        """Scan Redis for pending jobs and enqueue them"""
        try:
            from src.domain.entities import JobStatus
            from src.infrastructure.redis_client import RedisClient
            repo = RedisJobRepository()
            
            redis = await RedisClient.get_instance()
            active_ids = await redis.smembers("demucs:active_ids")
            
            count = 0
            for job_id_bytes in active_ids:
                job_id = job_id_bytes.decode() if isinstance(job_id_bytes, bytes) else job_id_bytes
                job = await repo.get_by_id(job_id)
                if job and job.status == JobStatus.PENDING:
                    await self.enqueue(job)
                    count += 1
            
            if count > 0:
                logger.info(f"Recovered {count} pending jobs from Redis")
        except Exception as e:
            logger.error(f"Failed to recover pending jobs: {e}")

# Global instance
job_manager = PriorityJobManager()
