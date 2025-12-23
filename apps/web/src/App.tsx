/**
 * Sonántica Web App
 * 
 * Main application component.
 * This is the wiring layer - it connects the UI to the core.
 * 
 * "Apps never implement domain logic."
 */

import { useState, useEffect } from 'react';
import { PlayerEngine } from '@sonantica/player-core';
import { APP_NAME, PlaybackState, formatTime, type MediaSource } from '@sonantica/shared';
import './App.css';

function App() {
  const [player] = useState(() => new PlayerEngine());
  const [state, setState] = useState(PlaybackState.IDLE);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    // Subscribe to player events
    const unsubscribeState = player.on('player:state-change', (event) => {
      setState((event.data as any).newState);
    });

    const unsubscribeTime = player.on('player:time-update', (event) => {
      setCurrentTime((event.data as any).currentTime);
      setDuration((event.data as any).duration);
    });

    const unsubscribeVolume = player.on('player:volume-change', (event) => {
      if ((event.data as any).volume !== undefined) {
        setVolume((event.data as any).volume);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeState();
      unsubscribeTime();
      unsubscribeVolume();
      player.dispose();
    };
  }, [player]);

  const handleLoadDemo = async () => {
    // Demo audio file (public domain)
    const demoSource: MediaSource = {
      id: 'demo-1',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      mimeType: 'audio/mpeg',
      metadata: {
        title: 'SoundHelix Song #1',
        artist: 'SoundHelix',
        album: 'Demo Album',
      },
    };

    try {
      await player.load(demoSource);
    } catch (error) {
      console.error('Failed to load demo:', error);
    }
  };

  const handlePlay = () => {
    player.play().catch(console.error);
  };

  const handlePause = () => {
    player.pause();
  };

  const handleStop = () => {
    player.stop();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    player.setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    player.seek(newTime);
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">{APP_NAME}</h1>
        <p className="subtitle">Audio-first multimedia player</p>
      </header>

      <main className="main">
        <div className="player-card">
          <div className="status-section">
            <div className="status-badge" data-state={state}>
              {state}
            </div>
            <p className="philosophy">
              "Every file has an intention."
            </p>
          </div>

          <div className="controls-section">
            <button
              className="btn btn-primary"
              onClick={handleLoadDemo}
              disabled={state === PlaybackState.LOADING}
            >
              Load Demo Track
            </button>

            <div className="playback-controls">
              <button
                className="btn btn-control"
                onClick={handlePlay}
                disabled={state === PlaybackState.IDLE || state === PlaybackState.PLAYING}
              >
                ▶️ Play
              </button>
              <button
                className="btn btn-control"
                onClick={handlePause}
                disabled={state !== PlaybackState.PLAYING}
              >
                ⏸️ Pause
              </button>
              <button
                className="btn btn-control"
                onClick={handleStop}
                disabled={state === PlaybackState.IDLE || state === PlaybackState.STOPPED}
              >
                ⏹️ Stop
              </button>
            </div>
          </div>

          {state !== PlaybackState.IDLE && (
            <>
              <div className="timeline-section">
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  className="slider timeline-slider"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!duration}
                />
              </div>

              <div className="volume-section">
                <span className="volume-label">🔊 Volume</span>
                <input
                  type="range"
                  className="slider volume-slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                />
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </>
          )}
        </div>

        <div className="info-card">
          <h2>Hello World - Sonántica Core</h2>
          <p>
            This is a minimal demonstration of the Sonántica architecture:
          </p>
          <ul className="architecture-list">
            <li>
              <strong>@sonantica/shared</strong> - Common types and utilities
            </li>
            <li>
              <strong>@sonantica/player-core</strong> - Audio playback engine (UI-agnostic)
            </li>
            <li>
              <strong>@sonantica/web</strong> - React PWA (this app)
            </li>
          </ul>
          <p className="note">
            The player core has no knowledge of React or the UI.
            All communication happens through events and contracts.
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>"Respect the intention of the sound and the freedom of the listener."</p>
      </footer>
    </div>
  );
}

export default App;
