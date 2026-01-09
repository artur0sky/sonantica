import os

class Settings:
    REDIS_HOST: str = os.environ.get("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.environ.get("REDIS_PORT", 6379))
    REDIS_PASSWORD: str = os.environ.get("REDIS_PASSWORD", "")
    POSTGRES_URL: str = os.environ.get("POSTGRES_URL", "")
    MEDIA_PATH: str = os.environ.get("MEDIA_PATH", "/media")
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    
    @property
    def redis_url(self) -> str:
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/0"
    
    @property
    def postgres_url_sa(self) -> str:
        """SQLAlchemy compatible URL"""
        if not self.POSTGRES_URL:
            return ""
        return self.POSTGRES_URL.replace("postgres://", "postgresql://")

settings = Settings()
