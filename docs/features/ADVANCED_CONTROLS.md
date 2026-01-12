# Advanced Controls - Sonántica

## Overview

Sonántica now includes comprehensive **Advanced Controls** that provide seamless integration with your operating system and hardware, following our philosophy: *"Respect the intention of the sound and the freedom of the listener."*

---

## ✅ Implemented Features

### 1. **Media Session API** ✅

Full integration with the browser's Media Session API provides:

- **Lockscreen Controls** (Mobile): Control playback directly from your phone's lockscreen
- **Media Keys** (Desktop): Use dedicated media keys on your keyboard
- **Headset/Bluetooth Controls**: Play, pause, skip tracks from your headphones or car stereo
- **System Notifications**: Rich media notifications with album art and track info
- **Seek Bar**: Visual progress in system notifications (where supported)

**Supported Actions:**
- Play/Pause
- Next/Previous Track
- Seek Forward/Backward (±10 seconds)
- Seek to specific time
- Stop

**Browser Support:**
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 13.4+)
- ✅ Firefox (Desktop)
- ⚠️ Limited on older browsers

---

### 2. **Keyboard Shortcuts** ✅

Complete keyboard control for "Active Listening" on desktop.

#### Playback Controls
- **Space**: Play/Pause
- **N**: Next track
- **P**: Previous track

#### Seeking
- **←** (Arrow Left): Seek backward 5 seconds
- **→** (Arrow Right): Seek forward 5 seconds

#### Volume
- **↑** (Arrow Up): Increase volume
- **↓** (Arrow Down): Decrease volume
- **M**: Toggle mute

#### Playback Modes
- **S**: Toggle shuffle
- **R**: Cycle repeat mode (Off → One → All)

#### UI Controls
- **L**: Toggle lyrics sidebar
- **Q**: Toggle queue sidebar
- **F**: Focus search bar

**Smart Behavior:**
- Shortcuts are disabled when typing in input fields
- Visual feedback in console for debugging
- Customizable seek and volume steps

---

### 3. **Playback Persistence** ✅

Your listening session is automatically saved and restored:

- **Current Track**: Resume exactly where you left off
- **Playback Position**: Continue from the same timestamp
- **Queue State**: Your entire queue is preserved
- **Volume Level**: Your preferred volume is remembered
- **Shuffle/Repeat**: Playback modes are restored

**How it Works:**
- Automatically saves state to browser's IndexedDB
- Restores on page reload or browser restart
- Works offline (PWA mode)
- No account or cloud sync required

---

## 🚧 In Progress

### Background Playback (Mobile)

- ✅ **PWA**: Works in PWA mode on supported browsers
- 🚧 **Native Apps**: Pending implementation for Android/iOS native wrappers
- 📋 **Service Worker**: Enhanced background audio handling

---

## 🎯 Usage

### Media Session API

**Automatic Integration** - No configuration needed!

The Media Session API is automatically activated when you:
1. Load a track
2. Start playback

You'll see:
- Album art in system notifications
- Track metadata (title, artist, album)
- Playback controls in lockscreen/notification center

**Testing:**
- **Mobile**: Lock your phone while playing music
- **Desktop**: Use media keys on your keyboard
- **Headset**: Use play/pause buttons on your headphones

---

### Keyboard Shortcuts

**Always Active** - Works globally when Sonántica is in focus.

**Tips:**
- Press **F** to quickly search your library
- Use **Space** for instant play/pause
- Arrow keys for precise seeking
- **L** and **Q** for quick sidebar access

**Console Logging:**
When shortcuts are enabled, you'll see helpful messages in the browser console:
```
⌨️ Keyboard shortcuts enabled
   Space: Play/Pause
   ←/→: Seek
   ↑/↓: Volume
   M: Mute
   N/P: Next/Previous
   S: Shuffle
   R: Repeat
   L: Lyrics
   Q: Queue
   F: Search
```

---

### Playback Persistence

**Fully Automatic** - Your session is saved every time:
- You change tracks
- You seek to a new position
- You adjust volume
- You modify the queue

**Manual Control:**
No manual intervention needed, but you can clear saved data via browser settings if desired.

---

## 🔧 Technical Details

### Architecture

```
MainLayout (apps/web)
├── useMediaSession() → MediaSessionService (player-core)
├── useKeyboardShortcuts() → Player/Queue Stores
└── PlaybackPersistence → IndexedDB
```

### Files Created/Modified

**New Files:**
- `packages/player-core/src/services/MediaSessionService.ts`
- `apps/web/src/hooks/useMediaSession.ts`
- `apps/web/src/hooks/useKeyboardShortcuts.ts`

**Modified Files:**
- `packages/player-core/src/index.ts` (exports)
- `apps/web/src/components/layout/MainLayout.tsx` (integration)
- `docs/ROADMAP.md` (status updates)

---

## 🎵 Philosophy

These features embody Sonántica's core values:

1. **User Autonomy**: Complete control over your listening experience
2. **Technical Transparency**: Clear feedback and predictable behavior
3. **Respect for Sound**: Seamless integration that doesn't interrupt the music
4. **Active Listening**: Keyboard as an instrument for engaged listening

---

## 🐛 Known Limitations

1. **Media Session API**:
   - Position state may not work on all browsers
   - Some browsers limit background playback without user interaction
   - Album art size requirements vary by platform

2. **Keyboard Shortcuts**:
   - Disabled when typing in input fields (by design)
   - May conflict with browser shortcuts (use F11 for fullscreen to avoid)

3. **Playback Persistence**:
   - Limited by browser storage quotas
   - Cleared if user clears browser data
   - Queue size limited to prevent storage issues

---

## 📱 Mobile Considerations

### iOS
- Media Session works in Safari 13.4+
- Background playback requires PWA installation
- AirPlay integration automatic

### Android
- Full Media Session support in Chrome
- Bluetooth controls work seamlessly
- Notification controls always visible

---

## 🚀 Future Enhancements

- [ ] Customizable keyboard shortcuts
- [ ] Global media key support (even when tab not focused)
- [ ] Cross-device sync (optional cloud storage)
- [ ] Enhanced background playback for native apps
- [ ] Picture-in-Picture mode
- [ ] Ambient mode (screensaver with album art)

---

## 📚 Resources

- [Media Session API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [Keyboard Event - MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Last Updated:** 2024-12-24  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
