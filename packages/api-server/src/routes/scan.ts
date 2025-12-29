/**
 * Library Scanning Routes
 * 
 * Endpoints:
 * - POST /api/scan/start - Trigger library scan
 * - GET /api/scan/status - Get scan status
 * - GET /api/scan/events - SSE endpoint for real-time updates
 */

import { Router } from 'express';
import type { LibraryService } from '../services/LibraryService.js';

export function createScanRouter(libraryService: LibraryService): Router {
  const router = Router();

  // Start scan
  router.post('/start', async (req, res) => {
    try {
      if (libraryService.getScanningStatus()) {
        return res.status(409).json({ error: 'Scan already in progress' });
      }

      // Start scan asynchronously
      libraryService.scan().catch(err => {
        console.error('Scan error:', err);
      });

      res.json({ message: 'Scan started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start scan' });
    }
  });

  // Get scan status
  router.get('/status', (req, res) => {
    res.json({
      isScanning: libraryService.getScanningStatus(),
      stats: {
        tracks: libraryService.getTracks().length,
        artists: libraryService.getArtists().length,
        albums: libraryService.getAlbums().length
      }
    });
  });

  // Server-Sent Events for real-time updates
  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onTrackIndexed = (track: any) => {
      res.write(`data: ${JSON.stringify({ type: 'track:indexed', track })}\n\n`);
    };

    const onScanComplete = (stats: any) => {
      res.write(`data: ${JSON.stringify({ type: 'scan:complete', stats })}\n\n`);
    };

    const onScanStart = () => {
      res.write(`data: ${JSON.stringify({ type: 'scan:start' })}\n\n`);
    };

    libraryService.on('track:indexed', onTrackIndexed);
    libraryService.on('scan:complete', onScanComplete);
    libraryService.on('scan:start', onScanStart);

    req.on('close', () => {
      libraryService.off('track:indexed', onTrackIndexed);
      libraryService.off('scan:complete', onScanComplete);
      libraryService.off('scan:start', onScanStart);
    });
  });

  return router;
}
