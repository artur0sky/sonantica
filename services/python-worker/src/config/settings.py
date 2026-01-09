from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    POSTGRES_URL: str = "postgres://sonantica:sonantica@postgres:5432/sonantica?sslmode=disable"
    MEDIA_PATH: str = "/media"
    LOG_LEVEL: str = "INFO"
    
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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
