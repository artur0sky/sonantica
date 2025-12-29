/**
 * Sonántica API Server
 * 
 * Philosophy: "User autonomy" - Self-hosted music streaming
 * 
 * Responsibilities:
 * - Serve audio files via HTTP streaming
 * - Expose library metadata (tracks, artists, albums)
 * - Handle library scanning and indexing
 * - Provide real-time updates via Server-Sent Events
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createLibraryRouter } from './routes/library.js';
import { createStreamRouter } from './routes/stream.js';
import { createScanRouter } from './routes/scan.js';
import { LibraryService } from './services/LibraryService.js';

// Load environment variables
config();

const app: Express = express();
const PORT = process.env.API_PORT || 8080;
const MEDIA_PATH = process.env.MEDIA_PATH || '/media';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sonántica API Server',
    version: '0.1.0',
    mediaPath: MEDIA_PATH
  });
});

// Initialize library service
const libraryService = new LibraryService(MEDIA_PATH);

// Routes
app.use('/api/library', createLibraryRouter(libraryService));
app.use('/api/stream', createStreamRouter(MEDIA_PATH));
app.use('/api/scan', createScanRouter(libraryService));

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Sonántica API Server running on http://localhost:${PORT}`);
  console.log(`📂 Media path: ${MEDIA_PATH}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'all origins'}`);
  
  // Auto-scan library on startup
  console.log('🔍 Starting automatic library scan...');
  libraryService.scan().then(() => {
    const stats = libraryService.getStats();
    console.log('✅ Initial scan complete:', {
      tracks: stats.tracks,
      artists: stats.artists,
      albums: stats.albums
    });
  }).catch((error) => {
    console.error('❌ Initial scan failed:', error);
  });
});

export { app };
