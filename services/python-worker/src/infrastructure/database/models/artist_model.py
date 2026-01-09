from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects import postgresql
from .base import Base

class Artist(Base):
    __tablename__ = 'artists'
    
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(255), nullable=False, unique=True)
    bio = Column(String, nullable=True)
    cover_art = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
