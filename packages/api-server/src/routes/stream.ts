/**
 * Audio Streaming Routes
 * 
 * Endpoints:
 * - GET /api/stream/:trackId - Stream audio file with range support
 */

import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export function createStreamRouter(mediaPath: string): Router {
  const router = Router();

  router.get('/:filePath(*)', async (req, res) => {
    try {
      const filePath = path.join(mediaPath, req.params.filePath);
      
      // Security: Prevent directory traversal
      if (!filePath.startsWith(mediaPath)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return res.status(404).json({ error: 'File not found' });
      }

      const fileSize = stat.size;
      const range = req.headers.range;

      // Support range requests for seeking
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'audio/mpeg', // TODO: Detect from file extension
        });

        const stream = (await import('fs')).createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // Full file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg', // TODO: Detect from file extension
        });

        const stream = (await import('fs')).createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Failed to stream file' });
    }
  });

  return router;
}
