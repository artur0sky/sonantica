from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from ..models.artist_model import Artist
from ..models.album_model import Album
from ..models.track_model import Track
import logging

logger = logging.getLogger("AudioWorker")

class AudioRepository:
    def __init__(self, session_factory):
        self.SessionLocal = session_factory

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
        with self.SessionLocal() as session:
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
                    track.updated_at = datetime.now(timezone.utc)
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
                raise
