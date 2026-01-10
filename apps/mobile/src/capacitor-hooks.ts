/**
 * Capacitor Native Hooks for Sonántica Mobile
 * 
 * These hooks provide access to native mobile features while maintaining
 * the architecture principle: "Apps never implement domain logic"
 * 
 * Following Sonántica's philosophy:
 * - Respect for sound (native audio session management)
 * - User autonomy (filesystem access for local music)
 * - Technical transparency (expose platform capabilities)
 */

import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Note: To avoid bundling these in the main web app on non-native platforms,
// we use dynamic imports inside the hooks or check for native platform.

/**
 * Hook to manage app permissions
 */
export function usePermissions() {
  const requestNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  return { requestNotificationPermission };
}

/**
 * Hook to detect if running in Capacitor (native mobile)
 */
export function useIsNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Hook to manage app lifecycle events
 * Useful for pausing playback when app goes to background
 */
export function useAppState(callbacks: {
  onActive?: () => void;
  onInactive?: () => void;
  onBackground?: () => void;
}) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: any;
    const setupListener = async () => {
      const { App } = await import('@capacitor/app');
      listener = App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive) {
          callbacks.onActive?.();
        } else {
          callbacks.onInactive?.();
          callbacks.onBackground?.();
        }
      });
    };

    setupListener();

    return () => {
      if (listener) listener.then((h: any) => h.remove());
    };
  }, [callbacks]);
}

/**
 * Hook to manage status bar appearance
 * Follows Sonántica's dark, minimalist aesthetic
 */
export function useStatusBar(style: 'dark' | 'light' = 'dark') {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setStyle = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({
          style: style === 'dark' ? Style.Dark : Style.Light,
        });
      } catch (error) {
        console.debug('StatusBar not available:', error);
      }
    };
    setStyle();
  }, [style]);
}

/**
 * Hook to provide haptic feedback
 * Subtle tactile response for user interactions
 */
export function useHaptics() {
  const light = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  }, []);

  const medium = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }
  }, []);

  const heavy = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available
    }
  }, []);

  return { light, medium, heavy };
}

/**
 * Hook to manage keyboard behavior
 * Ensures proper layout when keyboard appears
 */
export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showListener: any;
    let hideListener: any;

    const setupListeners = async () => {
      const { Keyboard } = await import('@capacitor/keyboard');
      showListener = Keyboard.addListener('keyboardWillShow', () => {
        setIsVisible(true);
      });

      hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsVisible(false);
      });
    };

    setupListeners();

    return () => {
      if (showListener) showListener.then((h: any) => h.remove());
      if (hideListener) hideListener.then((h: any) => h.remove());
    };
  }, []);

  const hide = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch {
      // Keyboard not available
    }
  }, []);

  return { isVisible, hide };
}

/**
 * Hook to access device filesystem
 * For scanning local music files
 */
export function useFilesystem() {
  const readDir = useCallback(async (path: string) => {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const result = await Filesystem.readdir({
        path,
        directory: Directory.ExternalStorage,
      });
      return result.files;
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }, []);

  const readFile = useCallback(async (path: string) => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const result = await Filesystem.readFile({
        path,
        directory: Directory.ExternalStorage,
      });
      return result.data;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }, []);

  return { readDir, readFile };
}

/**
 * Hook to handle back button (Android)
 * Integrates with app navigation
 */
export function useBackButton(handler: () => boolean) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: any;
    const setupListener = async () => {
      const { App } = await import('@capacitor/app');
      listener = App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        const shouldPreventDefault = handler();
        if (!shouldPreventDefault && !canGoBack) {
          App.exitApp();
        }
      });
    };

    setupListener();

    return () => {
      if (listener) listener.then((h: any) => h.remove());
    };
  }, [handler]);
}

/**
 * Hook to get app info
 */
export function useAppInfo() {
  const [info, setInfo] = useState<{
    name: string;
    id: string;
    build: string;
    version: string;
  } | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const getInfo = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const appInfo = await App.getInfo();
        setInfo(appInfo);
      } catch {
        setInfo(null);
      }
    };
    getInfo();
  }, []);

  return info;
}

/**
 * Hook to manage background playback session
 * Ensures the app stays alive on Android 14+
 */
export function useMediaPlayback() {
  const startService = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      const { registerPlugin } = await import('@capacitor/core');
      const MediaPlayback = registerPlugin<any>('MediaPlayback');
      await MediaPlayback.startForegroundService();
      console.log('✅ Native Foreground Service started');
    } catch (error) {
       console.error('Failed to start native service:', error);
    }
  }, []);

  const stopService = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      const { registerPlugin } = await import('@capacitor/core');
      const MediaPlayback = registerPlugin<any>('MediaPlayback');
      await MediaPlayback.stopForegroundService();
      console.log('🛑 Native Foreground Service stopped');
    } catch (error) {
       console.error('Failed to stop native service:', error);
    }
  }, []);

  return { startService, stopService };
}
