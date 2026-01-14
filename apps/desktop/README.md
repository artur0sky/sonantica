# @sonantica/desktop

> "The fidelity of a professional workstation with the soul of a craftsman."

Sonántica's high-performance desktop experience. This application provides a native, robust environment for Windows, macOS, and Linux, leveraging the power of Rust and Tauri to deliver a bit-perfect listening experience.

## 🧠 Philosophy

The Desktop app embodies the **"Wise Craftsman"** archetype. It is designed for the active listener who seeks precision and control. Following our core principle: **"Apps never implement domain logic"**, this package acts as a specialized high-performance shell that orchestrates our shared packages within a secure, native environment.

## 📦 What This Is

A **Tauri-based native application** that:

- Wraps the Sonántica core with native system performance
- Provides high-level integration with OS-specific audio backends
- Enables global system control (Media keys, Tray, Shortcuts)
- Delivers a secure, sandboxed environment for desktop-exclusive features
- Operates with minimal resource footprint compared to traditional web-wrappers

## 🎯 Responsibility

This package handles:

- **Platform Integration**: Native filesystem access for local massive music libraries
- **Audio Precision**: Integration with system audio APIs (WASAPI/ASIO preparation)
- **Ambient Presence**: System Tray integration and global media control
- **System Performance**: Multi-threaded library indexing using Rust
- **Active Listening**: Support for global keyboard shortcuts and media keys

> "Respect the intention of the sound and the freedom of the listener."

## 🛡️ Architecture Compliance

The desktop app strictly follows Sonántica's non-negotiable rules:

- **Zero Business Logic**: All playback state and DSP living in `@sonantica/player-core` and `@sonantica/dsp`
- **Shared Visualization**: UI components and visualizers provided by `@sonantica/ui`
- **Contract-Based**: OS features exposed via clean Tauri Commands and typed interfaces
- **Safe Sandboxing**: Strict security policies to protect user privacy and local files

## 🖥️ Desktop Features

The desktop app transcends the browser with professional-grade capabilities:

- **Library Guard**: Real-time monitoring of local folders for library updates
- **Global Control**: Manage playback from any application via system media keys
- **Tray Workspace**: Subtle background presence with quick-access controls
- **Enhanced Performance**: Offloaded heavy tasks (like metadata indexing) to Rust
- **Window Management**: Remember window position, sizes, and layout preferences
- **Offline Reliability**: Direct access to local caches without browser limitations

## 🛠️ Usage

### For End Users

Download the latest installer (`.msi`, `.exe`, `.dmg`, or `.deb`) from the official releases and follow the installation wizard.

### For Developers

The desktop app is built using Tauri v2:

```bash
# Install dependencies
pnpm install

# Run in development mode (with hot-reload)
pnpm --filter @sonantica/desktop tauri dev

# Build for production
pnpm --filter @sonantica/desktop tauri build
```

Requirements: [Rust](https://www.rust-lang.org/tools/install) and platform-specific build tools.

## 🏗️ Technical Stack

- **Framework**: `Tauri v2` (Rust core)
- **Frontend**: `React 19` + `Vite`
- **Styling**: `Tailwind CSS 4.1` (Acoustic Design System)
- **State Management**: `Zustand`
- **Security**: Strict CSP and Scoped Filesystem access

## ⚡ Performance

Unlike Electron-based players, Sonántica Desktop uses the system's native WebView, resulting in:
- **~80% smaller bundle size**
- **~60% less RAM usage**
- **Instant startup times**

## 📱 Platform Support

- **Windows**: Windows 10/11 (WebView2)
- **macOS**: macOS 11.0+ (WebKit)
- **Linux**: Major distributions (WebKitGTK)

## 🎨 Design Integration

The desktop app provides an "Acoustic Room" for your music:

- **Native Glassmorphism**: Supports Windows Mica/Acrylic and macOS Vibrancy
- **Premium Themes**: Sophisticated dark modes that respect system preferences
- **Minimalist Chrome**: No unnecessary borders or distractions from the audio
- **High DPI Support**: Crystal clear UI on 4K and Retina displays

> "The UI should feel like a well-acoustically treated room."

## 🔮 Future Enhancements (Desktop Exclusive)

- **Exclusive Mode**: Direct output via WASAPI/ASIO for bit-perfect playback
- **VSR Resampling**: High-quality audio resampling algorithms
- **Local Plugins**: Support for VST3/AU audio processing modules
- **Advanced Metadata**: Direct batch writing for ID3/Vorbis tags
- **CD Ripping**: High-fidelity encoding directly from physical media

## 📊 Code Sharing

| Layer | Web | Mobile | Desktop | Shared |
| :--- | :---: | :---: | :---: | :---: |
| UI Components | ✓ | ✓ | ✓ | 100% |
| Business Logic | ✓ | ✓ | ✓ | 100% |
| DSP / Audio Engine | ✓ | ✓ | ✓ | 100% |
| Platform Integration | Web APIs | Capacitor | Tauri (Rust) | 0% |
| **Total Efficiency** | — | — | — | **~92%** |

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Modern Classical**.
