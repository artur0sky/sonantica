import asyncpg
import logging
from .config import settings

logger = logging.getLogger(__name__)

_db_pool = None

async def get_db_pool() -> asyncpg.Pool:
    global _db_pool
    if _db_pool is None:
        if not settings.POSTGRES_URL:
            logger.error("❌ POSTGRES_URL not configured")
            return None
            
        try:
            logger.info("Connecting to Postgres...")
            # We limit the pool size to avoid "too many clients" error
            # especially since each analyzer task might hold a connection
            _db_pool = await asyncpg.create_pool(
                settings.POSTGRES_URL,
                min_size=1,
                max_size=10 # Cap connections per plugin instance
            )
            logger.info("✅ Postgres pool created")
        except Exception as e:
            logger.error(f"❌ Failed to create Postgres pool: {e}")
            raise e
            
    return _db_pool

async def close_db_pool():
    global _db_pool
    if _db_pool:
        await _db_pool.close()
        _db_pool = None
        logger.info("Postgres pool closed")
