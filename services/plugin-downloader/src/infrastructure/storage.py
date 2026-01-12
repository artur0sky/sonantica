"""
Infrastructure Layer: Storage Access
Handles data persistence using Redis for simple state management without SQL.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import redis

from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

# Redis Connection
_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password,
            decode_responses=True
        )
    return _redis_client

# Constants
JOB_PREFIX = "downloader:jobs:"
HISTORY_KEY = "downloader:history"
SEARCH_LOG_KEY = "downloader:search_log"
QUOTA_SEARCH_KEY = "downloader:quota:search:"
QUOTA_DOWNLOAD_KEY = "downloader:quota:download:"

class Storage:
    @staticmethod
    def _now_iso():
        return datetime.utcnow().isoformat()

    @staticmethod
    def save_job(job_id: str, data: Dict[str, Any]):
        r = get_redis_client()
        key = f"{JOB_PREFIX}{job_id}"
        
        # Ensure dates are serialized
        if "created_at" not in data:
            data["created_at"] = Storage._now_iso()
        data["updated_at"] = Storage._now_iso()
        
        # We store as JSON string or Hash? JSON string is easier for structure flexibility.
        r.set(key, json.dumps(data))
        
        # Add to history (Sorted Set by timestamp)
        # Use negative timestamp for "recent first" if using ZRANGE, or just standard timestamp
        timestamp = datetime.utcnow().timestamp()
        r.zadd(HISTORY_KEY, {job_id: timestamp})

    @staticmethod
    def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        r = get_redis_client()
        data = r.get(f"{JOB_PREFIX}{job_id}")
        if data:
            return json.loads(data)
        return None

    @staticmethod
    def update_job_status(job_id: str, status: str, message: str = None, progress: float = None, error: str = None, **kwargs):
        job = Storage.get_job(job_id)
        if job:
            job["status"] = status
            if message is not None: job["message"] = message
            if progress is not None: job["progress"] = progress
            if error is not None: job["error_message"] = error
            
            # Add any extra metrics (speed, eta, etc)
            for k, v in kwargs.items():
                job[k] = v
                
            Storage.save_job(job_id, job)

    @staticmethod
    def get_all_jobs(limit: int = 50, status_filter: str = None) -> List[Dict[str, Any]]:
        r = get_redis_client()
        # Get latest IDs
        job_ids = r.zrevrange(HISTORY_KEY, 0, limit * 2) # Fetch more to filter
        
        tasks = []
        for jid in job_ids:
            job = Storage.get_job(jid)
            if job:
                if status_filter and job.get("status") != status_filter:
                    continue
                tasks.append(job)
                if len(tasks) >= limit:
                    break
        return tasks

    @staticmethod
    def delete_job(job_id: str):
        r = get_redis_client()
        r.delete(f"{JOB_PREFIX}{job_id}")
        r.zrem(HISTORY_KEY, job_id)

    @staticmethod
    def find_job_by_url(url: str) -> Optional[Dict[str, Any]]:
        # This is inefficient in Redis without an index.
        # But for workshop scale it might be OK to scan active jobs?
        # Better: Maintain a secondary index URL -> JobID
        # Or Just scan 50 recent items.
        
        # Let's scan recent items as a heuristic.
        jobs = Storage.get_all_jobs(limit=100) 
        for job in jobs:
            if job.get("url") == url:
                return job
        return None

    # Quota Management
    @staticmethod
    def check_quota(type: str, limit: int) -> bool:
        r = get_redis_client()
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"{QUOTA_SEARCH_KEY}{today}" if type == "search" else f"{QUOTA_DOWNLOAD_KEY}{today}"
        
        current = r.get(key)
        if current and int(current) >= limit:
            return False
        return True

    @staticmethod
    def increment_quota(type: str):
        r = get_redis_client()
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"{QUOTA_SEARCH_KEY}{today}" if type == "search" else f"{QUOTA_DOWNLOAD_KEY}{today}"
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 86400) # 24h
        pipe.execute()

    @staticmethod
    def log_search(query: str, results_count: int):
        # We can just log to logger or keep a simple list
        r = get_redis_client()
        entry = json.dumps({
            "query": query, 
            "count": results_count, 
            "timestamp": Storage._now_iso()
        })
        r.lpush(SEARCH_LOG_KEY, entry)
        r.ltrim(SEARCH_LOG_KEY, 0, 999) # Keep last 1000
