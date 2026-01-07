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


# --- DOMAIN MODELS (ORM) ---
# ... (keeping existing models) ...
# I cannot easily skip lines with replace_file_content if I want to update multiple chunks.
# I will just update the formatter first, then process_job in a separate call or chunks.
# Wait, I can use multi_replace?
# Yes, checking tool definitions... "multi_replace_file_content".
# I'll use multi_replace_file_content.



# --- DOMAIN MODELS (ORM) ---
Base = declarative_base()

class Artist(Base):
    __tablename__ = 'artists'
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid()) # Use PG UUID gen
    name = Column(String(255), nullable=False, unique=True)
    bio = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Album(Base):
    __tablename__ = 'albums'
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String(255), nullable=False)
    artist_id = Column(String, ForeignKey('artists.id', ondelete='CASCADE'))
    release_year = Column(Integer, nullable=True)
    cover_art_path = Column(String, nullable=True)
    folder_path = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (UniqueConstraint('title', 'artist_id', name='uq_album_title_artist'),)

class Track(Base):
    __tablename__ = 'tracks'
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String(255), nullable=False)
    album_id = Column(String, ForeignKey('albums.id', ondelete='CASCADE'))
    artist_id = Column(String, ForeignKey('artists.id', ondelete='SET NULL'))
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
    
    # User data
    play_count = Column(Integer, default=0)
    is_favorite = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# --- REPOSITORY LAYER ---
class AudioRepository:
    def __init__(self, db_url):
        self.engine = create_engine(db_url, pool_pre_ping=True)
        Base.metadata.create_all(self.engine) # Idempotent schema creation
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        logger.info("✅ Database connected via SQLAlchemy.")

    def get_or_create_artist(self, session: Session, name: str) -> str:
        name = name.strip().replace("\x00", "")
        # Try to find first (optimization)
        artist = session.query(Artist).filter(Artist.name == name).first()
        if artist:
            return artist.id
            
        try:
            # Create new
            new_artist = Artist(name=name)
            session.add(new_artist)
            session.commit()
            return new_artist.id
        except IntegrityError:
            session.rollback()
            # Race condition handling: someone else created it
            return session.query(Artist).filter(Artist.name == name).first().id

    def get_or_create_album(self, session: Session, title: str, artist_id: str, cover_path: str = None) -> str:
        title = title.strip().replace("\x00", "")
        album = session.query(Album).filter(Album.title == title, Album.artist_id == artist_id).first()
        
        if album:
            # Update cover if missing
            if not album.cover_art_path and cover_path:
                album.cover_art_path = cover_path
                session.commit()
            return album.id
            
        try:
            new_album = Album(title=title, artist_id=artist_id, cover_art_path=cover_path)
            session.add(new_album)
            session.commit()
            return new_album.id
        except IntegrityError:
            session.rollback()
            album = session.query(Album).filter(Album.title == title, Album.artist_id == artist_id).first()
            if album and not album.cover_art_path and cover_path:
                album.cover_art_path = cover_path
                session.commit()
            return album.id

    def save_track(self, meta: dict, file_path_rel: str):
        session = self.SessionLocal()
        try:
            # 1. Resolve Dependencies
            artist_id = self.get_or_create_artist(session, meta["artist"])
            # Pass cover_path to album creation
            album_id = self.get_or_create_album(session, meta["album"], artist_id, meta.get("cover_path"))
            
            # 2. Check if Track exists (Update vs Insert)
            track = session.query(Track).filter(Track.file_path == file_path_rel).first()
            
            if track:
                # Update existing
                track.title = meta["title"]
                track.artist_id = artist_id
                track.album_id = album_id
                track.duration_seconds = meta["duration"]
                track.track_number = meta["track_number"]
                track.genre = meta["genre"]
                track.format = meta["format"]  # Should update format if it somehow changes (e.g. re-rip)
                track.bitrate = meta["bitrate"] # Should update quality stats too
                track.updated_at = datetime.datetime.now(datetime.timezone.utc)
                action = "Updated"
            else:
                # Insert new
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
                    genre=meta["genre"]
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

def process_job(job_data):
    rel_path = job_data.get("file_path")
    full_path = os.path.join(job_data.get("root", MEDIA_PATH), rel_path)
    trace_id = job_data.get("trace_id", "N/A")
    
    logger.info(f"🎧 Analyzing: {rel_path}", extra={"trace_id": trace_id})
    
    meta = analyze_audio(full_path)
    if meta:
        logger.debug(f"Metadata extracted: {meta}", extra={"trace_id": trace_id})
        try:
            r = get_repo()
            if r:
                r.save_track(meta, rel_path)
        except Exception as e:
            logger.error(f"DB Error: {e}", extra={"trace_id": trace_id})
    else:
        logger.warning(f"❌ Failed to extract metadata for {rel_path}", extra={"trace_id": trace_id})


def main():
    logger.info("🚀 Sonántica Audio Worker Started (Python 3.12 + SQLAlchemy)")
    
    # Init Repo
    try:
        get_repo()
    except Exception as e:
        logger.error(f"Critical repo init error: {e}")

    # Wait for Redis
    r = None
    while True:
        try:
            r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, db=0)
            r.ping()
            logger.info(f"✅ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            break
        except redis.ConnectionError:
            logger.warning("⏳ Waiting for Redis...")
            time.sleep(2)

    # Main Loop
    while True:
        # Blocking pop from 'analysis_queue'
        item = r.blpop("analysis_queue", timeout=5)
        
        if item:
            queue, data = item
            try:
                job_data = json.loads(data)
                process_job(job_data)
            except Exception as e:
                logger.error(f"❌ Error processing job: {e}")

if __name__ == "__main__":
    main()
