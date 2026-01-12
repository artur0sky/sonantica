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
from src.infrastructure.storage import Storage 
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


from src.infrastructure.logging.logger_config import setup_logger

logger = setup_logger(__name__)
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
    is_downloaded: bool = False
    download_status: Optional[str] = None

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
    # Check Quota
    if not Storage.check_quota("search", settings.daily_search_limit):
        raise HTTPException(status_code=429, detail=f"Daily search limit of {settings.daily_search_limit} exceeded")

    Storage.log_search(q, 0) # Update count later
    Storage.increment_quota("search")

    sp = get_spotify()
    results = []
    
    if not sp:
        return [SearchResult(
            id="offline-1", type="track", title=f"Search for: {q}",
            subtitle="Configure Spotify API keys for better results",
            cover_art="", url=q
        )]

    try:
        def check_status(url):
            # Check if recently downloaded
            job = Storage.find_job_by_url(url)
            if job:
                if job.get("status") == "completed": return True, "completed"
                return False, job.get("status")
            return False, None

        if "open.spotify.com" in q:
            if "/track/" in q:
                id_part = q.split("/track/")[1].split("?")[0]
                t = sp.track(id_part)
                u = t['external_urls']['spotify']
                is_dl, status = check_status(u)
                results.append(SearchResult(
                    id=t['id'], type="track", title=t['name'],
                    subtitle=t['artists'][0]['name'],
                    cover_art=t['album']['images'][0]['url'],
                    url=u,
                    is_downloaded=is_dl,
                    download_status=status
                ))
            elif "/album/" in q:
                id_part = q.split("/album/")[1].split("?")[0]
                a = sp.album(id_part)
                tracks = []
                for t in a['tracks']['items']:
                    u = t['external_urls']['spotify']
                    is_dl, status = check_status(u)
                    tracks.append(SearchResult(
                        id=t['id'], type="track", title=t['name'],
                        subtitle=t['artists'][0]['name'],
                        cover_art=a['images'][0]['url'],
                        url=u,
                        is_downloaded=is_dl,
                        download_status=status
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
                id_part = q.split("/playlist/")[1].split("?")[0]
                p = sp.playlist(id_part)
                tracks = []
                for t in p['tracks']['items']:
                    if not t['track']: continue
                    u = t['track']['external_urls']['spotify']
                    is_dl, status = check_status(u)
                    tracks.append(SearchResult(
                        id=t['track']['id'], type="track", title=t['track']['name'],
                        subtitle=t['track']['artists'][0]['name'],
                        cover_art=p['images'][0]['url'],
                        url=u,
                        is_downloaded=is_dl,
                        download_status=status
                    ))
                results.append(SearchResult(
                    id=p['id'], type="playlist", title=p['name'],
                    subtitle=p['owner']['display_name'],
                    cover_art=p['images'][0]['url'],
                    url=q,
                    track_count=p['tracks']['total'],
                    tracks=tracks
                ))
            elif "/artist/" in q:
                id_part = q.split("/artist/")[1].split("?")[0]
                a = sp.artist(id_part)
                tracks = []
                top_tracks = sp.artist_top_tracks(id_part)
                for t in top_tracks['tracks']:
                    u = t['external_urls']['spotify']
                    is_dl, status = check_status(u)
                    tracks.append(SearchResult(
                        id=t['id'], type="track", title=t['name'],
                        subtitle=t['artists'][0]['name'],
                        cover_art=t['album']['images'][0]['url'],
                        url=u,
                        is_downloaded=is_dl,
                        download_status=status
                    ))
                results.append(SearchResult(
                    id=a['id'], type="artist", title=a['name'],
                    subtitle=f"{a['followers']['total']} followers",
                    cover_art=a['images'][0]['url'],
                    url=q,
                    track_count=len(tracks),
                    tracks=tracks
                ))
        else:
            # Search fallback (only tracks for now)
            res = sp.search(q, limit=10, type="track")
            for t in res.get('tracks', {}).get('items', []):
                u = t['external_urls']['spotify']
                is_dl, status = check_status(u)
                results.append(SearchResult(
                    id=t['id'], type="track", title=t['name'],
                    subtitle=t['artists'][0]['name'],
                    cover_art=t['album']['images'][0]['url'],
                    url=u,
                    is_downloaded=is_dl,
                    download_status=status
                ))
                
    except Exception as e:
        logger.error(f"Identify failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    return results

@router.post("/jobs", dependencies=[Depends(verify_internal_secret)])
async def create_job(req: DownloadRequest):
    # Check Quota
    if not Storage.check_quota("download", settings.daily_download_limit):
        raise HTTPException(status_code=429, detail=f"Daily download limit of {settings.daily_download_limit} exceeded")

    uc = DownloadUseCase()
    job = await uc.create_job(req.url, req.format)
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

@router.get("/downloads", dependencies=[Depends(verify_internal_secret)])
async def list_downloads(status: Optional[str] = None, limit: int = 50):
    tasks = Storage.get_all_jobs(limit=limit, status_filter=status)
    return tasks

@router.post("/downloads/{job_id}/cancel", dependencies=[Depends(verify_internal_secret)])
async def cancel_download(job_id: str):
    uc = DownloadUseCase()
    uc.cancel_job(job_id)
    return {"status": "cancelled"}

@router.post("/downloads/{job_id}/pause", dependencies=[Depends(verify_internal_secret)])
async def pause_download(job_id: str):
    uc = DownloadUseCase()
    uc.pause_job(job_id)
    return {"status": "paused"}

@router.post("/downloads/{job_id}/resume", dependencies=[Depends(verify_internal_secret)])
async def resume_download(job_id: str):
    uc = DownloadUseCase()
    uc.resume_job(job_id)
    return {"status": "resumed"}
    
@router.delete("/downloads/{job_id}", dependencies=[Depends(verify_internal_secret)])
async def delete_download(job_id: str):
    Storage.delete_job(job_id)
    return {"status": "deleted"}

# Aliases
@router.post("/download", include_in_schema=False, dependencies=[Depends(verify_internal_secret)])
async def download_alias(req: DownloadRequest):
    return await create_job(req)

@router.get("/status/{job_id}", include_in_schema=False, dependencies=[Depends(verify_internal_secret)])
async def status_alias(job_id: str):
    return await get_job_status(job_id)
