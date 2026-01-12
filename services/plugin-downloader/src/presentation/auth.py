"""
Presentation Layer: Authentication
"""
import logging
from fastapi import Header, HTTPException
from src.infrastructure.config import settings

logger = logging.getLogger(__name__)

async def verify_internal_secret(x_internal_secret: str = Header(None)):
    """Validate internal API secret for security"""
    if x_internal_secret != settings.internal_api_secret:
        logger.warning("Unauthorized access attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")
