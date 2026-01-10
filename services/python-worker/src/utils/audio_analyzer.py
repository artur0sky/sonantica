import mutagen
from pathlib import Path
import logging
from .cover_extractor import extract_cover_art

logger = logging.getLogger("AudioWorker")

def analyze_audio(file_path: str, media_path: str):
    """
    Extract metadata using Mutagen
    """
    path = Path(file_path)
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
            "format": path.suffix.lower().lstrip('.'),
            "title": path.stem,
            "artist": "Unknown Artist",
            "album": "Unknown Album",
            "track_number": 0,
            "genre": "Unknown",
            "cover_path": None,
            "year": 0
        }

        if audio.info:
            metadata["duration"] = getattr(audio.info, "length", 0)
            metadata["bitrate"] = getattr(audio.info, "bitrate", 0)
            metadata["sample_rate"] = getattr(audio.info, "sample_rate", 0)
            metadata["channels"] = getattr(audio.info, "channels", 2) 

        tags = audio.tags
        if tags:
            import bleach
            
            def clean(text):
                if not text: return "Unknown"
                return bleach.clean(str(text), tags=[], strip=True)

            metadata["title"] = clean(tags.get("title", [path.stem])[0])
            metadata["artist"] = clean(tags.get("artist", ["Unknown Artist"])[0])
            metadata["album"] = clean(tags.get("album", ["Unknown Album"])[0])
            metadata["genre"] = clean(tags.get("genre", ["Unknown"])[0])
            
            # Extract Year
            year_raw = str(tags.get("date", tags.get("year", ["0"]))[0])
            try:
                metadata["year"] = int(year_raw.split('-')[0])
            except:
                pass

            track_num_raw = str(tags.get("tracknumber", ["0"])[0])
            try:
                metadata["track_number"] = int(track_num_raw.split('/')[0])
            except:
                pass
                
        # Extract Cover Art
        try:
            rel_path = str(path.relative_to(media_path))
        except ValueError:
            rel_path = str(path)

        metadata["cover_path"] = extract_cover_art(
            audio, 
            str(file_path), 
            rel_path,
            metadata["album"],
            metadata["artist"]
        )

        return metadata

    except Exception as e:
        logger.error(f"Error analyzing {file_path}: {e}")
        return None
