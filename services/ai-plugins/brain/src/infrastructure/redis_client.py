import redis.asyncio as redis
import logging
from .config import settings

logger = logging.getLogger(__name__)

_redis_client = None

async def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        logger.info(f"Connecting to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
    return _redis_client

async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")
