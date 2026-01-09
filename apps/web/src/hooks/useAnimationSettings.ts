/**
 * useAnimationSettings Hook
 * 
 * Provides animation configuration based on user settings
 * Respects user preferences and accessibility settings
 */

import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { features } from '../utils/browser';

interface AnimationConfig {
  enabled: boolean;
  duration: number; // in ms
  hoverEnabled: boolean;
  transitionEnabled: boolean;
  listEnabled: boolean;
  className: string;
}

/**
 * Get animation configuration based on user settings
 */
export function useAnimationSettings(): AnimationConfig {
  const {
    animations,
    animationSpeed,
    reducedMotion,
    hoverAnimations,
    transitionAnimations,
    listAnimations,
  } = useSettingsStore();

  const config = useMemo(() => {
    // Check if user prefers reduced motion (accessibility)
    const systemPrefersReducedMotion = features.prefersReducedMotion();
    const shouldReduceMotion = reducedMotion || systemPrefersReducedMotion;

    // If animations are disabled or reduced motion is preferred, disable all
    if (!animations || shouldReduceMotion) {
      return {
        enabled: false,
        duration: 1, // Minimal duration for accessibility
        hoverEnabled: false,
        transitionEnabled: false,
        listEnabled: false,
        className: 'animations-disabled',
      };
    }

    // Calculate duration based on speed setting
    let duration: number;
    switch (animationSpeed) {
      case 'slow':
        duration = 200; // Slower, more noticeable
        break;
      case 'fast':
        duration = 75; // Faster, snappier
        break;
      case 'normal':
      default:
        duration = 100; // Optimal for INP
        break;
    }

    return {
      enabled: true,
      duration,
      hoverEnabled: hoverAnimations,
      transitionEnabled: transitionAnimations,
      listEnabled: listAnimations,
      className: `animations-enabled animation-speed-${animationSpeed}`,
    };
  }, [
    animations,
    animationSpeed,
    reducedMotion,
    hoverAnimations,
    transitionAnimations,
    listAnimations,
  ]);

  return config;
}

/**
 * Get CSS custom properties for animations
 */
export function useAnimationStyles(): Record<string, string> {
  const config = useAnimationSettings();

  return useMemo(() => {
    if (!config.enabled) {
      return {
        '--animation-duration': '1ms',
        '--animation-duration-hover': '1ms',
        '--animation-duration-transition': '1ms',
      };
    }

    return {
      '--animation-duration': `${config.duration}ms`,
      '--animation-duration-hover': config.hoverEnabled ? `${config.duration}ms` : '1ms',
      '--animation-duration-transition': config.transitionEnabled ? `${config.duration}ms` : '1ms',
    };
  }, [config]);
}

/**
 * Check if specific animation type is enabled
 */
export function useAnimationEnabled(type: 'hover' | 'transition' | 'list' = 'transition'): boolean {
  const config = useAnimationSettings();

  if (!config.enabled) return false;

  switch (type) {
    case 'hover':
      return config.hoverEnabled;
    case 'transition':
      return config.transitionEnabled;
    case 'list':
      return config.listEnabled;
    default:
      return false;
  }
}
