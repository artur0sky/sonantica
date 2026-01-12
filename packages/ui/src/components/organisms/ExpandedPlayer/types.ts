/**
 * Expanded Player - Shared Types
 * Following Clean Architecture principles
 */

export interface ExpandedPlayerProps {
  /** Optional action buttons to render in the info area */
  actionButtons?: React.ReactNode;
  /** Callback for long press on cover art */
  onLongPressArt?: () => void;
  /** Active theme colors */
  dominantColor?: string;
  contrastColor?: string;
  scientificMode?: boolean;
  onToggleScientificMode?: () => void;
}

export interface CoverArtSectionProps {
  coverArt?: string;
  trackTitle: string;
  /** Mobile only: enable drag gestures */
  enableGestures?: boolean;
  onLongPress?: () => void;
}

export interface InfoSectionProps {
  title: string;
  artist: string;
  album?: string;
  trackId: string;
  actionButtons?: React.ReactNode;
}

export interface ControlsSectionProps {
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export interface TimelineSectionProps {
  trackId: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export interface NavigationFooterProps {
  recommendationsOpen: boolean;
  isQueueOpen: boolean;
  onToggleRecommendations: () => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  scientificMode?: boolean;
  onToggleScientificMode?: () => void;
}

export type DragDirection = "left" | "right" | null;
