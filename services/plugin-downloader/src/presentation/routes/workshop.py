"""
Presentation Layer: Workshop Routes (The Hunter)
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Depends
from pydantic import BaseModel

from src.application.use_cases.download import DownloadUseCase
from src.presentation.auth import verify_internal_secret
from src.infrastructure.config import settings
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

logger = logging.getLogger(__name__)
router = APIRouter()

# Models
class DownloadRequest(BaseModel):
    url: str
    format: Optional[str] = None

class SearchResult(BaseModel):
    id: str
    type: str # track, album, playlist, artist
    title: str
    subtitle: str
    cover_art: str
    url: str
    track_count: Optional[int] = None
    tracks: Optional[List['SearchResult']] = None

# Set up forward reference for recursive model
SearchResult.update_forward_refs()

# Spotify Lazy Client
_sp = None
def get_spotify():
    global _sp
    if _sp is None and settings.spotify_client_id and settings.spotify_client_secret:
        auth_manager = SpotifyClientCredentials(
            client_id=settings.spotify_client_id,
            client_secret=settings.spotify_client_secret
        )
        _sp = spotipy.Spotify(auth_manager=auth_manager)
    return _sp

@router.get("/identify", response_model=List[SearchResult], dependencies=[Depends(verify_internal_secret)])
async def identify(q: str = Query(...)):
    """Identifies tracks, albums, or playlists from URL or query"""
    sp = get_spotify()
    results = []
    
    if not sp:
        # Fallback simulation
        return [SearchResult(
            id="offline-1", type="track", title=f"Search for: {q}",
            subtitle="Configure Spotify API keys for better results",
            cover_art="", url=q
        )]

    try:
        if "open.spotify.com" in q:
            if "/track/" in q:
                id = q.split("/track/")[1].split("?")[0]
                t = sp.track(id)
                results.append(SearchResult(
                    id=t['id'], type="track", title=t['name'],
                    subtitle=t['artists'][0]['name'],
                    cover_art=t['album']['images'][0]['url'],
                    url=q
                ))
            elif "/album/" in q:
                id = q.split("/album/")[1].split("?")[0]
                a = sp.album(id)
                tracks = []
                for t in a['tracks']['items']:
                    tracks.append(SearchResult(
                        id=t['id'], type="track", title=t['name'],
                        subtitle=t['artists'][0]['name'],
                        cover_art=a['images'][0]['url'],
                        url=t['external_urls']['spotify']
                    ))
                results.append(SearchResult(
                    id=a['id'], type="album", title=a['name'],
                    subtitle=a['artists'][0]['name'],
                    cover_art=a['images'][0]['url'],
                    url=q,
                    track_count=a['total_tracks'],
                    tracks=tracks
                ))
            elif "/playlist/" in q:
                id = q.split("/playlist/")[1].split("?")[0]
                p = sp.playlist(id)
                tracks = []
                for item in p['tracks']['items']:
                    if not item or not item['track']: continue
                    t = item['track']
                    tracks.append(SearchResult(
                        id=t['id'], type="track", title=t['name'],
                        subtitle=t['artists'][0]['name'],
                        cover_art=t['album']['images'][0]['url'],
                        url=t['external_urls']['spotify']
                    ))
                results.append(SearchResult(
                    id=p['id'], type="playlist", title=p['name'],
                    subtitle=p['owner']['display_name'],
                    cover_art=p['images'][0]['url'],
                    url=q,
                    track_count=p['tracks']['total'],
                    tracks=tracks
                ))
        else:
            # Search fallback
            res = sp.search(q, limit=5, type="track,album,playlist")
            
            # Add Tracks
            for t in res.get('tracks', {}).get('items', []):
                results.append(SearchResult(
                    id=t['id'], type="track", title=t['name'],
                    subtitle=t['artists'][0]['name'],
                    cover_art=t['album']['images'][0]['url'],
                    url=t['external_urls']['spotify']
                ))
            
            # Add Albums
            for a in res.get('albums', {}).get('items', []):
                results.append(SearchResult(
                    id=a['id'], type="album", title=a['name'],
                    subtitle=a['artists'][0]['name'],
                    cover_art=a['images'][0]['url'],
                    url=a['external_urls']['spotify'],
                    track_count=a['total_tracks']
                ))

            # Add Playlists
            for p in res.get('playlists', {}).get('items', []):
                results.append(SearchResult(
                    id=p['id'], type="playlist", title=p['name'],
                    subtitle=p['owner']['display_name'],
                    cover_art=p['images'][0]['url'],
                    url=p['external_urls']['spotify'],
                    track_count=p['tracks']['total']
                ))
                
    except Exception as e:
        logger.error(f"Identify failed: {e}")
        
    return results

@router.post("/jobs", dependencies=[Depends(verify_internal_secret)])
async def create_job(req: DownloadRequest):
    uc = DownloadUseCase()
    job = await uc.create_job(req.url, req.format)
    # The process is already dispatched via Celery inside create_job
    return {
        "id": job.id,
        "status": job.status,
        "message": job.message
    }

@router.get("/jobs/{job_id}", dependencies=[Depends(verify_internal_secret)])
async def get_job_status(job_id: str):
    uc = DownloadUseCase()
    job = uc.get_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# Aliases for backward compatibility with go-core custom proxy
@router.post("/download", include_in_schema=False, dependencies=[Depends(verify_internal_secret)])
async def download_alias(req: DownloadRequest):
    return await create_job(req)

@router.get("/status/{job_id}", include_in_schema=False, dependencies=[Depends(verify_internal_secret)])
async def status_alias(job_id: str):
    return await get_job_status(job_id)
