/**
 * Download Button Component
 *
 * Reusable button for downloading tracks offline.
 * Shows appropriate icon and state based on download status.
 */

import {
  IconCloudDownload,
  IconCircleCheckFilled,
  IconLoader,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@sonantica/shared";
import { OfflineStatus } from "@sonantica/shared";
import { useOfflineStore } from "@sonantica/offline-manager";
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

  const isOfflineAvailable = offlineItem?.status === OfflineStatus.COMPLETED;
  const isDownloading = offlineItem?.status === OfflineStatus.DOWNLOADING;
  const isQueued = offlineItem?.status === OfflineStatus.QUEUED;
  const progress = offlineItem?.progress || 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOfflineAvailable) {
      removeTrack(trackId);
    } else if (!isDownloading && !isQueued) {
      downloadTrack(track);
    }
  };

  const getIcon = () => {
    if (isOfflineAvailable) {
      return <IconCircleCheckFilled size={size} className="text-accent" />;
    }
    if (isDownloading || isQueued) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <IconLoader size={size} className="text-accent" />
        </motion.div>
      );
    }
    return <IconCloudDownload size={size} />;
  };

  const getLabel = () => {
    if (isOfflineAvailable) return "Downloaded";
    if (isDownloading) return `Downloading ${progress}%`;
    if (isQueued) return "Queued";
    return "Download";
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      disabled={isDownloading || isQueued}
      className={cn(
        "flex items-center gap-2 p-1.5 rounded-full transition-all duration-200 bg-transparent text-text-muted hover:text-text",
        isOfflineAvailable && "text-accent",
        (isDownloading || isQueued) && "opacity-50 cursor-wait",
        className
      )}
      title={getLabel()}
    >
      {getIcon()}
      {showLabel && <span className="text-sm">{getLabel()}</span>}
    </motion.button>
  );
}
