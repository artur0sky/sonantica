/**
 * Download Button (Container)
 *
 * Connected component that wires the DownloadButton atom
 * with the offline manager logic.
 */

import React from "react";
import { OfflineStatus } from "@sonantica/shared";
import { useOfflineStore } from "@sonantica/offline-manager";
import { DownloadButton as DownloadButtonAtom } from "@sonantica/ui";
import { useOfflineManager } from "../hooks/useOfflineManager";

interface DownloadButtonProps {
  trackId: string;
  track: any;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function DownloadButton({
  trackId,
  track,
  size = 20,
  className,
  showLabel = false,
}: DownloadButtonProps) {
  const { downloadTrack, removeTrack } = useOfflineManager();
  const offlineItem = useOfflineStore((state: any) => state.items[trackId]);

  const status = offlineItem?.status || OfflineStatus.NONE;
  const progress = offlineItem?.progress || 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (status === OfflineStatus.COMPLETED) {
      removeTrack(trackId);
    } else if (
      status === OfflineStatus.NONE ||
      status === OfflineStatus.ERROR
    ) {
      downloadTrack(track);
    }
  };

  return (
    <DownloadButtonAtom
      status={status}
      progress={progress}
      size={size}
      className={className}
      showLabel={showLabel}
      onClick={handleClick}
    />
  );
}
