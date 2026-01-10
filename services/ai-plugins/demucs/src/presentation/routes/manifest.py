"""
Presentation Layer: Manifest Route
Exposes plugin capabilities for discovery
"""

from fastapi import APIRouter

from src.domain.entities import PluginCapability

router = APIRouter()


@router.get("/manifest", response_model=PluginCapability)
async def get_manifest():
    """
    Returns plugin identity and capabilities.
    Public endpoint (no auth required) for discovery.
    """
    return PluginCapability()
