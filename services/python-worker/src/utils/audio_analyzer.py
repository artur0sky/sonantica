import mutagen
from pathlib import Path
import logging
from .cover_extractor import extract_cover_art
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.fft import rfft, rfftfreq

logger = logging.getLogger("AudioWorker")

def analyze_tech_quality(file_path: str):
    """
    Perform deep signal analysis for technical metadata and quality auditing.
    """
    try:
        # Load audio
        data, rate = sf.read(file_path)
        
        # 1. Loudness Analysis (LUFS)
        meter = pyln.Meter(rate)
        loudness = meter.integrated_loudness(data)
        
        # 2. Dynamic Range & Peaks
        peak = np.max(np.abs(data))
        rms = np.sqrt(np.mean(data**2))
        dr_score = 20 * np.log10(peak / rms) if rms > 0 else 0
        
        # 3. Quality Audit (Lossless vs Upscaled)
        sample_start = int(len(data) // 2)
        sample_len = min(int(rate * 2), len(data) - sample_start)
        
        if sample_len < rate: # Too short to analyze
            return {"lufs": float(loudness), "dr": float(dr_score)}

        sample = data[sample_start : sample_start + sample_len]
        if len(sample.shape) > 1:
            sample = np.mean(sample, axis=1)
            
        yf = rfft(sample)
        xf = rfftfreq(len(sample), 1/rate)
        ps = np.abs(yf)**2
        
        idx_18k = np.where(xf >= 18000)[0][0] if any(xf >= 18000) else None
        energy_high = np.sum(ps[idx_18k:]) if idx_18k is not None else 0
        energy_total = np.sum(ps)
        
        is_upscaled = False
        if energy_total > 0:
            ratio = (energy_high / energy_total) * 100
            if ratio < 0.005 and rate >= 44100: # Very aggressive threshold for 18kHz+ energy
                is_upscaled = True
                
        return {
            "lufs": round(float(loudness), 2),
            "dr": round(float(dr_score), 2),
            "peak": round(float(peak), 4),
            "is_upscaled": is_upscaled,
            "quality_audit": "lossless_verified" if not is_upscaled else "potential_upscale"
        }
    except Exception as e:
        logger.error(f"Technical analysis failed for {file_path}: {e}")
        return {}

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
            "year": 0,
            "tech": {}
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

        # Deep Technical Analysis (The "Critical Ear" Phase)
        metadata["tech"] = analyze_tech_quality(file_path)

        return metadata

    except Exception as e:
        logger.error(f"Error analyzing {file_path}: {e}")
        return None
