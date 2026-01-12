# @sonantica/mobile

> "The listening experience, wherever you are."

Sonántica's native mobile presence. This application brings the full audio-first experience to Android and iOS devices through a web-native architecture that respects both sound and platform.

## 🧠 Philosophy

The Mobile app follows the **"Apps never implement domain logic"** principle. It is a thin, transparent wrapper around the web application—a native container that provides platform integration without duplicating code or compromising the listening experience.

## 📦 What This Is

A **Capacitor-based native shell** that:

- Wraps the complete Sonántica web application
- Provides access to native device features (filesystem, haptics, status bar)
- Enables installation from app stores (Google Play, Apple App Store)
- Maintains 95%+ code sharing with the web platform

## 🎯 Responsibility

This package handles:

- **Platform Integration**: Native filesystem access for local music libraries
- **Device Features**: Haptic feedback, status bar styling, keyboard management
- **App Lifecycle**: Background audio, state preservation, memory management
- **Native Distribution**: APK/IPA generation for store submission

> "One codebase. Multiple surfaces."

## 🛡️ Architecture Compliance

The mobile app strictly adheres to Sonántica's architectural principles:

- **Zero Business Logic**: All playback, DSP, and library management lives in `packages/`
- **Zero UI Duplication**: Every component comes from `@sonantica/ui` and `apps/web`
- **Contract-Based**: Native features exposed through clean React hooks
- **Platform Agnostic**: Core packages have no mobile dependencies

## 🔌 Native Features

The mobile app extends the web experience with platform-specific capabilities:

- **Filesystem Access**: Scan and index local music files
- **Haptic Feedback**: Subtle tactile responses for user interactions
- **Status Bar Control**: Dark theme integration with system UI
- **Keyboard Management**: Proper layout handling for search and input
- **App State Handling**: Pause playback when backgrounded
- **Back Button**: Native Android navigation integration

All features are **optional** and **gracefully degrade** when running in a web browser.

## 🛠️ Usage

### For End Users

Install from your device's app store or sideload the APK/IPA.

### For Developers

The mobile app is built automatically from the web application:

```bash
# Build web app and sync to native
pnpm build

# Open in platform IDE
pnpm cap:open:android  # Android Studio
pnpm cap:open:ios       # Xcode

# Build APK directly (requires Java 17)
pnpm build:apk
```

### Using Native Features in Web Components

```typescript
import { useIsNative, useHaptics } from '@sonantica/mobile';

function PlayButton() {
  const isNative = useIsNative();
  const haptics = useHaptics();

  const handlePlay = () => {
    // Add haptic feedback on mobile
    if (isNative) {
      haptics.medium();
    }
    // Core playback logic (works everywhere)
    play();
  };

  return <button onClick={handlePlay}>Play</button>;
}
```

## 🏗️ Technical Stack

- **Capacitor 8**: Web-to-native bridge
- **Web Build**: Complete `apps/web` distribution
- **Native Plugins**: Minimal, focused integrations
- **Zero Native Code**: No Swift, Kotlin, or Java required

## ⚡ Build Process

1. **Web Build**: Vite compiles the web app → `apps/web/dist/`
2. **Sync**: Capacitor copies the build to native projects
3. **Native Wrap**: Platform-specific shell loads the web app
4. **Distribution**: APK/IPA ready for stores or sideloading

> "Build once. Deploy everywhere."

## 📱 Platform Support

- **Android**: API 24+ (Android 7.0+)
- **iOS**: iOS 13.0+
- **Web**: All modern browsers (fallback)

## 🎨 Design Integration

The mobile app inherits Sonántica's aesthetic:

- **Dark Theme**: Status bar and splash screen match the UI
- **Minimalist**: No unnecessary native chrome
- **Subtle Interactions**: Light haptic feedback, never intrusive
- **Respects Sound**: Proper audio session management

> "The interface should feel like a well-acoustically treated room."

## 🔮 Future Enhancements

Potential native integrations (all optional):

- Native audio decoders (FLAC, ALAC)
- Background playback service
- Lock screen media controls
- File picker for library management
- Share target (receive audio files)
- Widgets (Android/iOS)

All additions will maintain the core principle: **the web app is the source of truth**.

## 📊 Code Sharing

| Layer | Web | Mobile | Shared |
| :--- | :---: | :---: | :---: |
| UI Components | ✓ | ✓ | 100% |
| Business Logic | ✓ | ✓ | 100% |
| Audio Engine | ✓ | ✓ | 100% |
| Platform Integration | Web APIs | Capacitor | 0% |
| **Total** | — | — | **~95%** |

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Djent**.
