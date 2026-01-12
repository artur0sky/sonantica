"""
Presentation Layer: Manifest Route
"""
from fastapi import APIRouter
from src.domain.entities import PluginCapability

router = APIRouter()

@router.get("/manifest", response_model=PluginCapability)
async def get_manifest():
    """
    Returns plugin identity and capabilities for discovery.
    """
    return PluginCapability()
