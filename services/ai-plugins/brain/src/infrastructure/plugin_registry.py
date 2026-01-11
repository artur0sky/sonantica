import httpx
import logging
from typing import Dict
from .config import settings

logger = logging.getLogger(__name__)

class PluginRegistry:
    _instance = None
    
    def __init__(self):
        self.plugins = {
            "knowledge": {"url": settings.KNOWLEDGE_PLUGIN_URL, "enabled": False},
            "demucs": {"url": settings.DEMUCS_PLUGIN_URL, "enabled": False}
        }
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = PluginRegistry()
        return cls._instance

    async def check_plugin_health(self, name: str) -> bool:
        plugin = self.plugins.get(name)
        if not plugin:
            return False
            
        url = f"{plugin['url']}/health"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    plugin["enabled"] = True
                    return True
        except Exception:
            pass
            
        plugin["enabled"] = False
        return False

    async def initialize(self):
        """Checks all plugins on startup"""
        logger.info("🔌 Detecting neighbor plugins...")
        for name in self.plugins:
            is_up = await self.check_plugin_health(name)
            status_icon = "✓" if is_up else "✗"
            logger.info(f"{status_icon} Plugin '{name}' detected at {self.plugins[name]['url']}")

    def is_enabled(self, name: str) -> bool:
        return self.plugins.get(name, {}).get("enabled", False)
        
    def get_url(self, name: str) -> str:
        return self.plugins.get(name, {}).get("url", "")
