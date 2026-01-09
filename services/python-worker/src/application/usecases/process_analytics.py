import logging
import redis
import time
from ...config.settings import settings

logger = logging.getLogger("AudioWorker")

class ProcessAnalyticsUseCase:
    def __init__(self, analytics_repo):
        self.analytics_repo = analytics_repo

    def execute(self, event_data):
        # 1. Historical (Postgres)
        self.analytics_repo.update_event_aggregation(event_data)
        
        # 2. Real-time (Redis)
        self._update_realtime_stats(event_data)
        
        return {"status": "processed"}

    def execute_batch(self, batch_events):
        red = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, password=settings.REDIS_PASSWORD, db=0)
        count = 0
        try:
            for event_data in batch_events:
                try:
                    self.analytics_repo.update_event_aggregation(event_data)
                except Exception as ex:
                    logger.error(f"Batch Item Error (PG): {ex}")
                
                self._update_redis_stats(red, event_data)
                count += 1
        finally:
            red.close()
            
        return {"status": "processed_batch", "count": count}

    def _update_realtime_stats(self, event_data):
        red = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, password=settings.REDIS_PASSWORD, db=0)
        try:
            self._update_redis_stats(red, event_data)
        finally:
            red.close()

    def _update_redis_stats(self, red, event_data):
        try:
            now_ts = int(time.time())
            minute_bucket = (now_ts // 60) * 60
            
            # Track Active Sessions
            session_id = event_data.get("sessionId")
            if session_id:
                red.zadd("stats:realtime:active_sessions", {session_id: now_ts})
                red.zremrangebyscore("stats:realtime:active_sessions", 0, now_ts - 300)
                red.expire("stats:realtime:active_sessions", 600)
            
            # Real-time Event Counter
            red.incr(f"stats:realtime:events:{minute_bucket}")
            red.expire(f"stats:realtime:events:{minute_bucket}", 3600)

            if event_data.get("eventType") == "playback.start":
                red.incr(f"stats:realtime:plays:{minute_bucket}")
                red.expire(f"stats:realtime:plays:{minute_bucket}", 3600)
                
                track_id = event_data.get("data", {}).get("trackId")
                if track_id:
                    trending_key = f"stats:trending:tracks:{minute_bucket}"
                    red.zincrby(trending_key, 1, track_id)
                    red.expire(trending_key, 600)
        except Exception as e:
            logger.error(f"Redis Update Error: {e}")
