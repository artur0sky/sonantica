from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects import postgresql
from .base import Base

class Track(Base):
    __tablename__ = 'tracks'
    
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String(255), nullable=False)
    album_id = Column(postgresql.UUID(as_uuid=True), ForeignKey('albums.id', ondelete='SET NULL'))
    artist_id = Column(postgresql.UUID(as_uuid=True), ForeignKey('artists.id', ondelete='SET NULL'))
    file_path = Column(String, unique=True, nullable=False)
    
    # Audio Info
    duration_seconds = Column(Float, default=0.0)
    format = Column(String(20))
    bitrate = Column(Integer)
    sample_rate = Column(Integer)
    channels = Column(Integer)
    
    # Metadata
    track_number = Column(Integer)
    disc_number = Column(Integer, default=1)
    genre = Column(String(100))
    year = Column(Integer)
    
    # User data
    play_count = Column(Integer, default=0)
    is_favorite = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # AI Metadata
    ai_metadata = Column(postgresql.JSONB, default={})
    has_stems = Column(Boolean, default=False)
    has_embeddings = Column(Boolean, default=False)
