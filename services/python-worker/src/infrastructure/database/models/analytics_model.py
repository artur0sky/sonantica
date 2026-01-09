from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from .base import Base

class AnalyticsSession(Base):
    __tablename__ = 'analytics_sessions'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    session_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(String(255))
    platform = Column(String(50), nullable=False)
    browser = Column(String(100))
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime)
    last_heartbeat = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

class AnalyticsEvent(Base):
    __tablename__ = 'analytics_events'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    event_id = Column(postgresql.UUID(as_uuid=True), unique=True, nullable=False)
    session_id = Column(String(255), ForeignKey('analytics_sessions.session_id', ondelete='CASCADE'), nullable=False)
    event_type = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    data = Column(postgresql.JSONB, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class TrackStatistics(Base):
    __tablename__ = 'track_statistics'
    track_id = Column(postgresql.UUID(as_uuid=True), ForeignKey('tracks.id', ondelete='CASCADE'), primary_key=True)
    play_count = Column(Integer, default=0)
    complete_count = Column(Integer, default=0)
    skip_count = Column(Integer, default=0)
    total_play_time = Column(Integer, default=0)
    average_completion = Column(Float, default=0.0)
    last_played_at = Column(DateTime)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ListeningHeatmap(Base):
    __tablename__ = 'listening_heatmap'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    date = Column(DateTime, nullable=False)
    hour = Column(Integer, nullable=False)
    play_count = Column(Integer, default=0)
    unique_tracks = Column(Integer, default=0)
    total_duration = Column(Integer, default=0)
    
    __table_args__ = (UniqueConstraint('date', 'hour', name='uq_date_hour'),)

class GenreStatistics(Base):
    __tablename__ = 'genre_statistics'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    genre = Column(String(100), unique=True, nullable=False)
    play_count = Column(Integer, default=0)
    total_play_time = Column(Integer, default=0)
    unique_tracks = Column(Integer, default=0)
    last_played_at = Column(DateTime)
    updated_at = Column(DateTime, server_default=func.now())

class ListeningStreak(Base):
    __tablename__ = 'listening_streaks'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(String(255), unique=True, nullable=False)
    current_streak = Column(Integer, default=0)
    max_streak = Column(Integer, default=0)
    last_played_at = Column(DateTime)
    total_play_time = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
