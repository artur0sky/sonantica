import os
import hashlib
import logging

logger = logging.getLogger("AudioWorker")

def extract_cover_art(audio, full_path: str, rel_path: str, album_name: str = None, artist_name: str = None) -> str:
    """
    Extracts cover art and returns path to the image file.
    Prioritizes folder.jpg/cover.jpg, then embedded tags.
    """
    dir_path = os.path.dirname(full_path)
    rel_dir = os.path.dirname(rel_path)
    
    # 1. Check for existing cover files in the source directory
    common_names = ["cover.jpg", "folder.jpg", "cover.png", "folder.png", "front.jpg"]
    for name in common_names:
        if os.path.exists(os.path.join(dir_path, name)):
            return os.path.join(rel_dir, name)

    # 2. Extract from Embedded Tags
    art_data = None
    
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
    except Exception as e:
        logger.warning(f"Error checking embedded art: {e}")

    if art_data:
        identifier = f"{artist_name}_{album_name}".encode('utf-8')
        file_hash = hashlib.md5(identifier).hexdigest()
        
        cache_dir = settings.COVER_PATH
        os.makedirs(cache_dir, exist_ok=True)
            
        save_path = os.path.join(cache_dir, f"{file_hash}.jpg")
        
        if not os.path.exists(save_path):
            try:
                # Security: Use Pillow to sanitize image
                from PIL import Image
                import io

                image = Image.open(io.BytesIO(art_data))
                
                # Convert to RGB to avoid issues with CMYK/RGBA in JPEGs
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")
                
                # Verify it's a valid image structure
                image.verify()
                
                # Re-open to save (verify closes the file)
                image = Image.open(io.BytesIO(art_data))
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")

                # Save new file (strips EXIF/Metadata payloads)
                # Respect original quality and format as much as possible
                original_format = image.format if image.format else "JPEG"
                if original_format == "JPEG":
                    image.save(save_path, format="JPEG", quality=95, optimize=True, subsampling=0)
                elif original_format == "PNG":
                     image.save(save_path, format="PNG", optimize=True)
                else:
                    # Fallback for others (BMP, etc) -> Convert to high quality JPEG
                    if image.mode != "RGB":
                         image = image.convert("RGB")
                    image.save(save_path, format="JPEG", quality=95, subsampling=0)

                logger.info(f"🖼️ Extracted and sanitized cover art to {save_path} (fmt={original_format})")
                
            except Exception as e:
                logger.error(f"Failed to process cover art (security check failed): {e}")
                return None
        
        return save_path
            
    return None
