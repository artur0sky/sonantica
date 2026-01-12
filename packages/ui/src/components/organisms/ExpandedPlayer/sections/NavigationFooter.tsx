/**
 * Navigation Footer (Molecule)
 * Footer navigation buttons
 * Reusable across mobile and desktop layouts
 */

import { ActionIconButton } from "../../../atoms";
import {
  IconSparkles,
  IconMicrophone,
  IconPlaylist,
  IconActivity,
} from "@tabler/icons-react";
import type { NavigationFooterProps } from "../types";

export function NavigationFooter({
  recommendationsOpen,
  isQueueOpen,
  onToggleRecommendations,
  onToggleLyrics,
  onToggleQueue,
  scientificMode,
  onToggleScientificMode,
}: NavigationFooterProps) {
  return (
    <footer className="flex items-center justify-between">
      <ActionIconButton
        icon={IconSparkles}
        onClick={onToggleRecommendations}
        isActive={recommendationsOpen}
        title="Discovery"
        size="md"
      />
      <ActionIconButton
        icon={IconMicrophone}
        onClick={onToggleLyrics}
        title="Lyrics"
        size="md"
      />
      <ActionIconButton
        icon={IconActivity}
        onClick={() => onToggleScientificMode?.()}
        isActive={scientificMode}
        title="Scientific Mode"
        size="md"
      />
      <ActionIconButton
        icon={IconPlaylist}
        onClick={onToggleQueue}
        isActive={isQueueOpen}
        title="Queue"
        size="md"
      />
    </footer>
  );
}
