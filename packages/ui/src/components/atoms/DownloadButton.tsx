import React from "react";
import {
  IconCloudDownload,
  IconCircleCheckFilled,
  IconLoader,
} from "@tabler/icons-react";
import { OfflineStatus, cn } from "@sonantica/shared";

export interface DownloadButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status: OfflineStatus;
  progress?: number;
  showLabel?: boolean;
  size?: number;
}

export function DownloadButton({
  status,
  progress = 0,
  showLabel = false,
  size = 20,
  className,
  ...props
}: DownloadButtonProps) {
  const isOfflineAvailable = status === OfflineStatus.COMPLETED;
  const isDownloading = status === OfflineStatus.DOWNLOADING;
  const isQueued = status === OfflineStatus.QUEUED;

  const getIcon = () => {
    if (isOfflineAvailable) {
      return <IconCircleCheckFilled size={size} className="text-accent" />;
    }
    if (isDownloading || isQueued) {
      return (
        <div className="animate-spin text-accent">
          <IconLoader size={size} />
        </div>
      );
    }
    return <IconCloudDownload size={size} />;
  };

  const getLabelText = () => {
    if (isOfflineAvailable) return "Downloaded";
    if (isDownloading) return `Downloading ${progress}%`;
    if (isQueued) return "Queued";
    return "Download";
  };

  return (
    <button
      {...props}
      disabled={props.disabled || isDownloading || isQueued}
      className={cn(
        "flex items-center gap-2 p-1.5 rounded-full transition-all duration-200 bg-transparent text-text-muted hover:text-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        isOfflineAvailable && "text-accent",
        (isDownloading || isQueued) && "opacity-50 cursor-wait",
        "hover:scale-110 active:scale-95",
        className
      )}
      title={getLabelText()}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm font-medium">{getLabelText()}</span>
      )}
    </button>
  );
}
