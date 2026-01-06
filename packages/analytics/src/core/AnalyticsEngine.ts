/**
 * Analytics Engine
 * 
 * Core engine for collecting, buffering, and sending analytics events.
 * Follows the "Technical Transparency" philosophy - clear, understandable,
 * and respectful of user privacy.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AnalyticsEvent,
  AnalyticsConfig,
  EventType,
  EventData,
  Platform,
} from '../types';
import { DEFAULT_ANALYTICS_CONFIG } from '../types';

/**
 * Platform detection utilities
 */
class PlatformDetector {
  static getPlatform(): Platform {
    if (typeof window === 'undefined') return 'web';
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    // Check for mobile
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    }
    
    // Check for desktop wrapper (Electron, Tauri, etc.)
    if ((window as any).electron || (window as any).__TAURI__) {
      return 'desktop';
    }
    
    return 'web';
  }
  
  static getBrowserInfo(): { browser: string; version: string } {
    if (typeof window === 'undefined') {
      return { browser: 'unknown', version: 'unknown' };
    }
    
    const userAgent = window.navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';
    
    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
    } else if (userAgent.indexOf('Edg') > -1) {
      browser = 'Edge';
      version = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || 'unknown';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
      version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
    }
    
    return { browser, version };
  }
  
  static getOSInfo(): { os: string; version: string } {
    if (typeof window === 'undefined') {
      return { os: 'unknown', version: 'unknown' };
    }
    
    const userAgent = window.navigator.userAgent;
    let os = 'unknown';
    let version = 'unknown';
    
    if (userAgent.indexOf('Win') > -1) {
      os = 'Windows';
      if (userAgent.indexOf('Windows NT 10.0') > -1) version = '10/11';
      else if (userAgent.indexOf('Windows NT 6.3') > -1) version = '8.1';
      else if (userAgent.indexOf('Windows NT 6.2') > -1) version = '8';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'macOS';
      version = userAgent.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'unknown';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
      version = userAgent.match(/Android ([0-9.]+)/)?.[1] || 'unknown';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1) {
      os = 'iOS';
      version = userAgent.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'unknown';
    }
    
    return { os, version };
  }
  
  static getLocale(): string {
    if (typeof window === 'undefined') return 'en-US';
    return window.navigator.language || 'en-US';
  }
  
  static getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

/**
 * Simple hash function for IP anonymization
 */
async function hashIP(ip: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for environments without crypto API
    return 'hashed';
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'sonantica-salt');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Main Analytics Engine
 */
export class AnalyticsEngine {
  private config: AnalyticsConfig;
  private sessionId: string | null = null;
  private eventBuffer: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private platformInfo: {
    platform: Platform;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    locale: string;
    timezone: string;
  };
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config } as AnalyticsConfig;
    
    // Detect platform info once
    const { browser, version: browserVersion } = PlatformDetector.getBrowserInfo();
    const { os, version: osVersion } = PlatformDetector.getOSInfo();
    
    this.platformInfo = {
      platform: PlatformDetector.getPlatform(),
      browser,
      browserVersion,
      os,
      osVersion,
      locale: PlatformDetector.getLocale(),
      timezone: PlatformDetector.getTimezone(),
    };
    
    this.log('Analytics Engine initialized', this.platformInfo);
  }
  
  /**
   * Start a new analytics session
   */
  startSession(): string {
    if (this.sessionId) {
      this.log('Session already active:', this.sessionId);
      return this.sessionId;
    }
    
    this.sessionId = uuidv4();
    this.log('Session started:', this.sessionId);
    
    // Track session start event
    this.trackEvent('session.start', {
      type: 'session',
      action: 'start',
    });
    
    // Start periodic flush
    this.startFlushTimer();
    
    // Set up beforeunload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
    
    return this.sessionId;
  }
  
  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.sessionId) {
      this.log('No active session to end');
      return;
    }
    
    this.log('Ending session:', this.sessionId);
    
    // Track session end event
    this.trackEvent('session.end', {
      type: 'session',
      action: 'end',
    });
    
    // Flush remaining events
    await this.flush();
    
    // Clean up
    this.stopFlushTimer();
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
    
    this.sessionId = null;
  }
  
  /**
   * Track an analytics event
   */
  trackEvent(eventType: EventType, data: EventData): void {
    if (!this.config.enabled) {
      this.log('Analytics disabled, skipping event:', eventType);
      return;
    }
    
    if (!this.sessionId) {
      this.log('No active session, auto-starting');
      this.startSession();
    }
    
    // Check privacy settings
    if (!this.shouldCollectEvent(eventType)) {
      this.log('Event collection disabled by privacy settings:', eventType);
      return;
    }
    
    const event: AnalyticsEvent = {
      eventId: uuidv4(),
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId!,
      ...this.platformInfo,
      data,
    };
    
    this.log('Event tracked:', eventType, data);
    
    // Add to buffer
    this.eventBuffer.push(event);
    
    // Check if we should flush
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Flush buffered events to the server
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      this.log('No events to flush');
      return;
    }
    
    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];
    
    this.log(`Flushing ${eventsToSend.length} events`);
    
    try {
      const response = await fetch(`${this.config.apiEndpoint}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }
      
      this.log('Events sent successfully');
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      
      // Re-add events to buffer if send failed (up to max buffer size)
      this.eventBuffer = [
        ...eventsToSend.slice(0, this.config.maxBufferSize - this.eventBuffer.length),
        ...this.eventBuffer,
      ];
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Configuration updated:', config);
    
    // Restart flush timer if interval changed
    if (config.flushInterval !== undefined) {
      this.stopFlushTimer();
      if (this.sessionId) {
        this.startFlushTimer();
      }
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
  
  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
  
  /**
   * Get platform information
   */
  getPlatformInfo() {
    return { ...this.platformInfo };
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private shouldCollectEvent(eventType: EventType): boolean {
    // Check privacy settings
    if (eventType.startsWith('playback.') && !this.config.collectPlaybackData) {
      return false;
    }
    
    if (eventType.startsWith('ui.') && !this.config.collectUIInteractions) {
      return false;
    }
    
    if (eventType.startsWith('search.') && !this.config.collectSearchData) {
      return false;
    }
    
    return true;
  }
  
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
  
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  private handleBeforeUnload = (): void => {
    // Use sendBeacon for reliable event sending on page unload
    if (this.eventBuffer.length > 0 && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const data = JSON.stringify({ events: this.eventBuffer });
      navigator.sendBeacon(`${this.config.apiEndpoint}/events/batch`, data);
      this.eventBuffer = [];
    }
  };
  
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

/**
 * Singleton instance
 */
let analyticsInstance: AnalyticsEngine | null = null;

/**
 * Get or create the analytics engine instance
 */
export function getAnalyticsEngine(config?: Partial<AnalyticsConfig>): AnalyticsEngine {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsEngine(config);
  } else if (config) {
    analyticsInstance.updateConfig(config);
  }
  
  return analyticsInstance;
}

/**
 * Reset the analytics engine (useful for testing)
 */
export function resetAnalyticsEngine(): void {
  if (analyticsInstance) {
    analyticsInstance.endSession();
    analyticsInstance = null;
  }
}
