"""
Infrastructure Layer: Redis Client (Singleton)
Manages Redis connection lifecycle
"""

import logging
from typing import Optional
import redis.asyncio as redis

from src.infrastructure.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """
    Singleton Redis client manager.
    Follows Single Responsibility Principle - Only manages Redis connection.
    """
    
    _instance: Optional[redis.Redis] = None
    
    @classmethod
    async def initialize(cls) -> None:
        """Initialize Redis connection"""
        if cls._instance is None:
            cls._instance = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await cls._instance.ping()
            logger.info("✓ Redis client initialized")
    
    @classmethod
    async def get_instance(cls) -> redis.Redis:
        """Get Redis client instance"""
        if cls._instance is None:
            await cls.initialize()
        return cls._instance
    
    @classmethod
    async def close(cls) -> None:
        """Close Redis connection"""
        if cls._instance:
            await cls._instance.close()
            cls._instance = None
            logger.info("✓ Redis client closed")
