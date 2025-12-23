/**
 * Player Page
 * 
 * Main player interface.
 */

import { Button } from '../../shared/components/atoms';
import { usePlayerStore } from '../../shared/store/playerStore';
import { PlayerControls } from './components/PlayerControls';
import { NowPlaying } from './components/NowPlaying';
import { Timeline } from './components/Timeline';
import { VolumeControl } from './components/VolumeControl';

export function PlayerPage() {
  const { loadTrack } = usePlayerStore();

  const handleLoadDemo = async () => {
    try {
      await loadTrack({
        id: 'demo-1',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
        metadata: {
          title: 'SoundHelix Song #1',
          artist: 'SoundHelix',
          album: 'Demo Album',
        },
      });
    } catch (error) {
      console.error('Failed to load demo:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Now Playing */}
      <NowPlaying />

      {/* Controls */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        <PlayerControls />
        
        <Timeline />
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button onClick={handleLoadDemo} variant="ghost" size="sm">
            🎵 Load Demo Track
          </Button>
          
          <VolumeControl />
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-3">About Sonántica</h3>
        <p className="text-sm text-text-muted mb-4">
          Navigate your music library or load a demo track to start listening.
        </p>
        <ul className="text-sm text-text-muted space-y-2">
          <li>• <span className="text-accent font-mono">@sonantica/player-core</span> - Audio engine</li>
          <li>• <span className="text-accent font-mono">@sonantica/media-library</span> - Library indexing</li>
          <li>• <span className="text-accent font-mono">@sonantica/web</span> - This PWA</li>
        </ul>
      </div>
    </div>
  );
}
