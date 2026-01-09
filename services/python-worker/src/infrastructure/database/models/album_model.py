from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from .base import Base

class Album(Base):
    __tablename__ = 'albums'
    
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String(255), nullable=False)
    artist_id = Column(postgresql.UUID(as_uuid=True), ForeignKey('artists.id', ondelete='CASCADE'))
    release_date = Column(String, nullable=True)
    cover_art = Column(String, nullable=True)
    genre = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (UniqueConstraint('title', 'artist_id', name='uq_album_title_artist'),)
