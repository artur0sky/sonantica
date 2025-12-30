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

  // Handle CORS preflight
  router.options('/:serverId/:filePath(*)', (req, res) => {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
  });

  // Route: /api/stream/:serverId/:filePath
  // serverId is ignored for now (single server), but accepted for multi-server compatibility
  router.get('/:serverId/:filePath(*)', async (req, res) => {
    try {
      const { serverId, filePath: relativeFilePath } = req.params;
      
      // Resolve paths to handle OS differences (forward/backslash) and ensure absolute paths
      const absoluteMediaPath = path.resolve(mediaPath);
      const filePath = path.resolve(mediaPath, relativeFilePath);
      
      console.log(`🎵 Stream request: serverId=${serverId}, file=${relativeFilePath}`);
      
      // Security: Prevent directory traversal
      // We use startsWith on resolved absolute paths which ensures safety and OS compatibility
      if (!filePath.startsWith(absoluteMediaPath)) {
        console.error('❌ Access denied:', filePath, 'Must be within:', absoluteMediaPath);
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        console.error('❌ File not found:', filePath);
        return res.status(404).json({ error: 'File not found' });
      }

      const fileSize = stat.size;
      const range = req.headers.range;
      
      // Detect content type from file extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.flac': 'audio/flac',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.opus': 'audio/opus',
        '.wav': 'audio/wav',
        '.aiff': 'audio/aiff',
      };
      const contentType = contentTypeMap[ext] || 'audio/mpeg';

      // Support range requests for seeking
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Fix: Clamp end to file size BEFORE checking validity
        // Spec allows requesting bytes past the end (return available bytes)
        end = Math.min(end, fileSize - 1);

        // Validate range (start must be within file)
        if (start >= fileSize) {
          console.error(`❌ Invalid range: ${start}-${end} for file size ${fileSize}`);
          return res.status(416).json({ error: 'Range not satisfiable' });
        }
        
        const chunkSize = (end - start) + 1;
        
        console.log(`📦 Range request: ${start}-${end}/${fileSize}, chunk: ${chunkSize}`);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          // CORS headers
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        });

        const stream = (await import('fs')).createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // Full file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          // CORS headers
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        });

        const stream = (await import('fs')).createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      console.error('❌ Stream error:', error);
      res.status(500).json({ error: 'Failed to stream file' });
    }
  });

  return router;
}
