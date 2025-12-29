/**
 * Library API Routes
 * 
 * Endpoints:
 * - GET /api/library/tracks
 * - GET /api/library/tracks/:id
 * - GET /api/library/artists
 * - GET /api/library/artists/:id/tracks
 * - GET /api/library/albums
 * - GET /api/library/albums/:id/tracks
 */

import { Router } from 'express';
import type { LibraryService } from '../services/LibraryService.js';

export function createLibraryRouter(libraryService: LibraryService): Router {
  const router = Router();

  // Get all tracks
  router.get('/tracks', (req, res) => {
    const tracks = libraryService.getTracks();
    res.json({
      total: tracks.length,
      tracks
    });
  });

  // Get single track
  router.get('/tracks/:id', (req, res) => {
    const track = libraryService.getTrack(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  });

  // Get all artists
  router.get('/artists', (req, res) => {
    const artists = libraryService.getArtists();
    res.json({
      total: artists.length,
      artists
    });
  });

  // Get tracks by artist
  router.get('/artists/:id/tracks', (req, res) => {
    const tracks = libraryService.getTracksByArtist(req.params.id);
    res.json({
      total: tracks.length,
      tracks
    });
  });

  // Get all albums
  router.get('/albums', (req, res) => {
    const albums = libraryService.getAlbums();
    res.json({
      total: albums.length,
      albums
    });
  });

  // Get tracks by album
  router.get('/albums/:id/tracks', (req, res) => {
    const tracks = libraryService.getTracksByAlbum(req.params.id);
    res.json({
      total: tracks.length,
      tracks
    });
  });

  return router;
}
