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
import { App as CapApp } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Hook to manage app permissions
 */
export function usePermissions() {
  const requestNotificationPermission = useCallback(async () => {
    try {
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
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if Capacitor is available
    const checkNative = async () => {
      try {
        const info = await CapApp.getInfo();
        setIsNative(!!info);
      } catch {
        setIsNative(false);
      }
    };
    checkNative();
  }, []);

  return isNative;
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
    const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        callbacks.onActive?.();
      } else {
        callbacks.onInactive?.();
        callbacks.onBackground?.();
      }
    });

    return () => {
      stateListener.then((h) => h.remove());
    };
  }, [callbacks]);
}

/**
 * Hook to manage status bar appearance
 * Follows Sonántica's dark, minimalist aesthetic
 */
export function useStatusBar(style: 'dark' | 'light' = 'dark') {
  useEffect(() => {
    const setStyle = async () => {
      try {
        await StatusBar.setStyle({
          style: style === 'dark' ? Style.Dark : Style.Light,
        });
      } catch (error) {
        // StatusBar not available (web)
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
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  }, []);

  const medium = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }
  }, []);

  const heavy = useCallback(async () => {
    try {
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
    const showListener = Keyboard.addListener('keyboardWillShow', () => {
      setIsVisible(true);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsVisible(false);
    });

    return () => {
      showListener.then((h) => h.remove());
      hideListener.then((h) => h.remove());
    };
  }, []);

  const hide = useCallback(async () => {
    try {
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
    try {
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
    try {
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
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const shouldPreventDefault = handler();
      if (!shouldPreventDefault && !canGoBack) {
        CapApp.exitApp();
      }
    });

    return () => {
      listener.then((h) => h.remove());
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
    const getInfo = async () => {
      try {
        const appInfo = await CapApp.getInfo();
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
