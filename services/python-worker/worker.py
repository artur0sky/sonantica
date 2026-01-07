import os
import time
import redis
import json
import logging
import datetime
from pathlib import Path

# SQLAlchemy Imports
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from sqlalchemy.exc import IntegrityError

import mutagen
from mutagen.flac import FLAC
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis
from celery import Celery
from celery.schedules import crontab

# Configure Logging
log_dir = "/var/log/sonantica"
os.makedirs(log_dir, exist_ok=True)

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
            "trace_id": getattr(record, "trace_id", None)
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

json_handler = logging.FileHandler(os.path.join(log_dir, "worker.log"))
json_handler.setFormatter(JSONFormatter())

console_handler = logging.StreamHandler()
console_handler.setFormatter(JSONFormatter())

logging.basicConfig(level=logging.INFO, handlers=[json_handler, console_handler])
logger = logging.getLogger("AudioWorker")

# Configuration
REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", None)
POSTGRES_URL = os.environ.get("POSTGRES_URL")
MEDIA_PATH = os.environ.get("MEDIA_PATH", "/media")

# Celery Setup
redis_url = f"redis://{':' + REDIS_PASSWORD + '@' if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/0"
app = Celery('sonantica', broker=redis_url, backend=redis_url)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1, # Scale responsibly
    task_acks_late=True
)


# --- DOMAIN MODELS (ORM) ---
# ... (keeping existing models) ...
# I cannot easily skip lines with replace_file_content if I want to update multiple chunks.
# I will just update the formatter first, then process_job in a separate call or chunks.
# Wait, I can use multi_replace?
# Yes, checking tool definitions... "multi_replace_file_content".
# I'll use multi_replace_file_content.



from sqlalchemy.dialects import postgresql

# --- DOMAIN MODELS (ORM) ---
Base = declarative_base()

class Artist(Base):
    __tablename__ = 'artists'
    
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(255), nullable=False, unique=True)
    bio = Column(String, nullable=True)
    cover_art = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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
    
    # User data (deprecated in favor of statistics table but kept for sync)
    play_count = Column(Integer, default=0)
    is_favorite = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# --- ANALYTICS MODELS ---

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
    UNIQUE_CONSTRAINT = UniqueConstraint('date', 'hour', name='uq_date_hour')

class GenreStatistics(Base):
    __tablename__ = 'genre_statistics'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    genre = Column(String(100), unique=True, nullable=False)
    play_count = Column(Integer, default=0)
    total_play_time = Column(Integer, default=0)
    unique_tracks = Column(Integer, default=0)
    last_played_at = Column(DateTime)
    updated_at = Column(DateTime, server_default=func.now())

# --- REPOSITORY LAYER ---
class AudioRepository:
    def __init__(self, db_url):
        self.engine = create_engine(db_url, pool_pre_ping=True)
        # Base.metadata.create_all(self.engine) # Schema management is handled by Go migrations
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        logger.info("✅ Database connected via SQLAlchemy.")

    def get_or_create_artist(self, session: Session, name: str) -> str:
        name = name.strip().replace("\x00", "")
        artist = session.query(Artist).filter(Artist.name == name).first()
        if artist:
            return artist.id
            
        try:
            new_artist = Artist(name=name)
            session.add(new_artist)
            session.commit()
            return new_artist.id
        except IntegrityError:
            session.rollback()
            return session.query(Artist).filter(Artist.name == name).first().id

    def get_or_create_album(self, session: Session, title: str, artist_id: str, cover_path: str = None, year: int = 0) -> str:
        title = title.strip().replace("\x00", "")
        album = session.query(Album).filter(Album.title == title, Album.artist_id == artist_id).first()
        
        release_date = None
        if year and year > 0:
            release_date = f"{year}-01-01"

        if album:
            changed = False
            if not album.cover_art and cover_path:
                album.cover_art = cover_path
                changed = True
            if not album.release_date and release_date:
                album.release_date = release_date
                changed = True
            if changed:
                session.commit()
            return album.id
            
        try:
            new_album = Album(title=title, artist_id=artist_id, cover_art=cover_path, release_date=release_date)
            session.add(new_album)
            session.commit()
            return new_album.id
        except IntegrityError:
            session.rollback()
            album = session.query(Album).filter(Album.title == title, Album.artist_id == artist_id).first()
            if album:
                changed = False
                if not album.cover_art and cover_path:
                    album.cover_art = cover_path
                    changed = True
                if not album.release_date and release_date:
                    album.release_date = release_date
                    changed = True
                if changed:
                    session.commit()
            return album.id

    def save_track(self, meta: dict, file_path_rel: str):
        session = self.SessionLocal()
        try:
            artist_id = self.get_or_create_artist(session, meta["artist"])
            album_id = self.get_or_create_album(session, meta["album"], artist_id, meta.get("cover_path"), meta.get("year", 0))
            
            track = session.query(Track).filter(Track.file_path == file_path_rel).first()
            
            if track:
                track.title = meta["title"]
                track.artist_id = artist_id
                track.album_id = album_id
                track.duration_seconds = meta["duration"]
                track.track_number = meta["track_number"]
                track.genre = meta["genre"]
                track.year = meta.get("year", 0)
                track.format = meta["format"]
                track.bitrate = meta["bitrate"]
                track.updated_at = datetime.datetime.now(datetime.timezone.utc)
                action = "Updated"
            else:
                track = Track(
                    title=meta["title"],
                    file_path=file_path_rel,
                    artist_id=artist_id,
                    album_id=album_id,
                    duration_seconds=meta["duration"],
                    format=meta["format"],
                    bitrate=meta["bitrate"],
                    sample_rate=meta["sample_rate"],
                    channels=meta["channels"],
                    track_number=meta["track_number"],
                    genre=meta["genre"],
                    year=meta.get("year", 0)
                )
                session.add(track)
                action = "Created"
            
            session.commit()
            logger.info(f"💾 {action} Track: {meta['title']} ({track.id})")
            
        except Exception as e:
            session.rollback()
            logger.error(f"❌ Failed to save track: {e}")
        finally:
            session.close()

    def update_event_aggregation(self, event_data: dict):
        """
        Updates aggregated stats based on a single event.
        Following the stock-market / high-volume pattern.
        """
        session = self.SessionLocal()
        try:
            event_type = event_data.get("eventType")
            data = event_data.get("data", {})
            track_id = data.get("trackId")
            timestamp_ms = event_data.get("timestamp", time.time() * 1000)
            dt = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=datetime.timezone.utc)
            date = dt.date()
            hour = dt.hour

            if not track_id:
                return

            # 1. Update Track Statistics
            stats = session.query(TrackStatistics).filter(TrackStatistics.track_id == track_id).first()
            if not stats:
                stats = TrackStatistics(track_id=track_id)
                session.add(stats)

            stats.last_played_at = dt
            
            # 2. Update Heatmap
            heatmap = session.query(ListeningHeatmap).filter(
                ListeningHeatmap.date == date, 
                ListeningHeatmap.hour == hour
            ).first()
            if not heatmap:
                heatmap = ListeningHeatmap(date=date, hour=hour)
                session.add(heatmap)

            if event_type == "playback.start":
                stats.play_count += 1
                heatmap.play_count += 1
                heatmap.unique_tracks += 1 # Rough estimate per event
            elif event_type == "playback.complete":
                stats.complete_count += 1
                duration = data.get("duration", 0)
                stats.total_play_time += int(duration)
                heatmap.total_duration += int(duration)
                stats.average_completion = 100.0 # It completed!
            elif event_type == "playback.skip":
                stats.skip_count += 1
                pos = data.get("position", 0)
                dur = data.get("duration", 1)
                stats.total_play_time += int(pos)
                heatmap.total_duration += int(pos)
                stats.average_completion = (pos / dur) * 100.0 if dur > 0 else 0

            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"❌ Failed to aggregate event: {e}")
        finally:
            session.close()

# Global Repo
repo = None

def get_repo():
    global repo
    if not repo and POSTGRES_URL:
        # Translate postgres:// to postgresql:// for SQLAlchemy if needed
        url = POSTGRES_URL.replace("postgres://", "postgresql://")
        repo = AudioRepository(url)
    return repo

import hashlib

def extract_cover_art(audio, full_path, rel_path, album_name=None, artist_name=None):
    """
    Extracts cover art and returns relative path to the image file.
    Prioritizes folder.jpg/cover.jpg, then embedded tags.
    If extracted, saves to /covers volume to avoid read-only FS errors.
    """
    dir_path = os.path.dirname(full_path)
    rel_dir = os.path.dirname(rel_path)
    
    # 1. Check for existing cover files in the source directory (preferred)
    common_names = ["cover.jpg", "folder.jpg", "cover.png", "folder.png", "front.jpg"]
    for name in common_names:
        if os.path.exists(os.path.join(dir_path, name)):
            # If it exists on disk, we just return the path relative to media root
            # The Go backend will resolve it against /media
            return os.path.join(rel_dir, name)

    # 2. Extract from Embedded Tags
    art_data = None
    ext = ".jpg"
    
    try:
        if hasattr(audio, 'tags'):
            # ID3 (MP3)
            if 'APIC:' in audio.tags: 
                 for key in audio.tags.keys():
                     if key.startswith('APIC'):
                         art_data = audio.tags[key].data
                         break
            # FLAC
            elif hasattr(audio, 'pictures') and audio.pictures:
                art_data = audio.pictures[0].data
            # Ogg / Vorbis
            elif 'metadata_block_picture' in audio.tags:
                 pass
    except Exception as e:
        logger.warning(f"Error checking embedded art: {e}")

    if art_data:
        # Save extracted art to /covers (Writable Volume)
        # Naming convention: hash of (Artist + Album) to ensure uniqueness
        identifier = f"{artist_name}_{album_name}".encode('utf-8')
        file_hash = hashlib.md5(identifier).hexdigest()
        
        # Ensure /covers exists (it should be mounted)
        cache_dir = "/covers"
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir, exist_ok=True)
            
        save_path = os.path.join(cache_dir, f"{file_hash}.jpg")
        
        # If already exists, don't overwrite to save I/O
        if not os.path.exists(save_path):
            try:
                with open(save_path, "wb") as f:
                    f.write(art_data)
                logger.info(f"🖼️ Extracted cover art to {save_path}")
            except Exception as e:
                logger.error(f"Failed to write cover art to cache: {e}")
                return None
        
        # Return absolute path. The Go backend's resolveMediaPath will see it's absolute and serve it directly.
        return save_path
            
    return None

def analyze_audio(file_path):
    """
    Extract metadata using Mutagen (Fast & Secure)
    """
    path = Path(file_path)
    # Check if file exists
    if not path.exists():
        logger.error(f"File not found during analysis: {file_path}")
        return None

    try:
        audio = mutagen.File(file_path)
        if not audio:
            logger.warning(f"Could not open file with Mutagen: {file_path}")
            return None
            
        metadata = {
            "duration": 0,
            "bitrate": 0,
            "sample_rate": 0,
            "channels": 0,
            "format": path.suffix.lower().lstrip('.'), # Correct format extraction
            "title": path.stem, # Default to filename
            "artist": "Unknown Artist",
            "album": "Unknown Album",
            "track_number": 0,
            "genre": "Unknown",
            "cover_path": None
        }

        # Technical Metadata
        if audio.info:
            metadata["duration"] = getattr(audio.info, "length", 0)
            metadata["bitrate"] = getattr(audio.info, "bitrate", 0)
            metadata["sample_rate"] = getattr(audio.info, "sample_rate", 0)
            metadata["channels"] = getattr(audio.info, "channels", 2) 

        # Tags Safe Extraction
        tags = audio.tags
        if tags:
            metadata["title"] = str(tags.get("title", [path.stem])[0])
            metadata["artist"] = str(tags.get("artist", ["Unknown Artist"])[0])
            metadata["album"] = str(tags.get("album", ["Unknown Album"])[0])
            metadata["genre"] = str(tags.get("genre", ["Unknown"])[0])
            
            # Extract Year
            year_raw = str(tags.get("date", tags.get("year", ["0"]))[0])
            try:
                # Handle YYYY-MM-DD or just YYYY
                metadata["year"] = int(year_raw.split('-')[0])
            except:
                pass

            track_num_raw = str(tags.get("tracknumber", ["0"])[0])
            try:
                metadata["track_number"] = int(track_num_raw.split('/')[0])
            except:
                pass
                
        # Extract Cover Art
        metadata["cover_path"] = extract_cover_art(
            audio, 
            str(file_path), 
            str(Path(file_path).relative_to(MEDIA_PATH)), # Use relative path for calculation
            metadata["album"],
            metadata["artist"]
        )

        return metadata

    except Exception as e:
        logger.error(f"Error analyzing {file_path}: {e}")
        return None

# --- CELERY TASKS ---

@app.task(name="sonantica.analyze_audio")
def task_analyze_audio(job_data):
    rel_path = job_data.get("file_path")
    full_path = os.path.join(job_data.get("root", MEDIA_PATH), rel_path)
    trace_id = job_data.get("trace_id", "N/A")
    
    logger.info(f"🎧 Celery Analysis: {rel_path}", extra={"trace_id": trace_id})
    
    meta = analyze_audio(full_path)
    if meta:
        try:
            r = get_repo()
            if r:
                r.save_track(meta, rel_path)
            return {"status": "success", "track": meta["title"]}
        except Exception as e:
            logger.error(f"DB Error: {e}")
            return {"status": "error", "message": str(e)}
    return {"status": "failed", "path": rel_path}

@app.task(name="sonantica.process_analytics")
def task_process_analytics(event_data):
    """
    High-volume analytics processing.
    1. Updates Postgres for historical data.
    2. Updates Redis for real-time streaming view.
    """
    try:
        # 1. Historical Aggregation (Postgres)
        r = get_repo()
        if r:
            r.update_event_aggregation(event_data)
        
        # 2. Real-time Streaming (Redis)
        # We store hits per minute in a sorted set or hash to allow "Ticker" style updates
        red = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=0)
        
        now_ts = int(time.time())
        minute_bucket = (now_ts // 60) * 60
        
        # Track Active Sessions (Last 5 minutes)
        session_id = event_data.get("sessionId")
        if session_id:
            red.zadd("stats:realtime:active_sessions", {session_id: now_ts})
            # Cleanup sessions older than 5 mins
            red.zremrangebyscore("stats:realtime:active_sessions", 0, now_ts - 300)
            red.expire("stats:realtime:active_sessions", 600)
        
        # Real-time Event Counter
        red.incr(f"stats:realtime:events:{minute_bucket}")
        red.expire(f"stats:realtime:events:{minute_bucket}", 3600)

        if event_data.get("eventType") == "playback.start":
            red.incr(f"stats:realtime:plays:{minute_bucket}")
            red.expire(f"stats:realtime:plays:{minute_bucket}", 3600)
            
            # Update "Trending" Tracks in Redis (Last 10 minutes)
            track_id = event_data.get("data", {}).get("trackId")
            if track_id:
                # Use a sorted set for trending
                trending_key = f"stats:trending:tracks:{minute_bucket}"
                red.zincrby(trending_key, 1, track_id)
                red.expire(trending_key, 600) # Bucket expires in 10 mins

        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Analytics Task Error: {e}")
        return {"status": "error", "message": str(e)}

@app.task(name="sonantica.sync_cache")
def task_sync_cache():
    """
    Periodic task to refresh complex dashboard aggregates in cache.
    Reduces pressure on Postgres during peaks.
    """
    logger.info("🔄 Syncing Dashboard Cache...")
    # Implementation: Query top tracks/stats from Postgres and update global Redis cached dashboard
    # This ensures "Gigante cantidad de usuarios" see fast cached results.
    pass

def main():
    logger.info("🚀 Sonántica Worker Environment Initialized")
    # This main is typically not called when running via 'celery worker'
    # But kept for sanity checks or legacy mode
    if os.environ.get("RUN_MODE") == "legacy":
        # ... (original blpop loop if needed) ...
        pass

if __name__ == "__main__":
    main()
