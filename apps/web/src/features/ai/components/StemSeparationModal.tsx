import { useState, useEffect } from "react";
import { Modal, Button } from "@sonantica/ui";
import { PluginService } from "../../../services/PluginService";
import {
  IconWand,
  IconDownload,
  IconCheck,
  IconX,
  IconLoader,
} from "@tabler/icons-react";

interface StemSeparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

type JobStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  result?: Record<string, string>;
  error?: string;
}

export function StemSeparationModal({
  isOpen,
  onClose,
  trackId,
  trackTitle,
}: StemSeparationModalProps) {
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Poll for status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (
      job?.id &&
      isOpen &&
      job.status !== "completed" &&
      job.status !== "failed"
    ) {
      interval = setInterval(async () => {
        try {
          const status = await PluginService.getJobStatus(
            job.id,
            "stem-separation"
          );
          setJob(status);

          if (status.status === "failed") {
            setError(status.error || "Job failed unexpectedly");
          }
        } catch (err) {
          console.warn("Polling error", err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [job?.id, isOpen, job?.status]);

  const handleStart = async () => {
    setIsDispatching(true);
    setError(null);
    try {
      const resp = await PluginService.separateStems(trackId);
      setJob(resp);
    } catch (err: any) {
      setError(err.message || "Failed to start separation");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleClose = () => {
    if (!isOpen) {
      setJob(null);
      setError(null);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Stem Separation">
      <div className="p-6 space-y-4">
        <div className="text-sm text-text-muted">
          Separating{" "}
          <span className="font-semibold text-text">{trackTitle}</span> using AI
          (Demucs).
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-md text-sm flex items-center gap-2">
            <IconX size={16} />
            {error}
          </div>
        )}

        {!job && !isDispatching && (
          <div className="flex justify-center py-4">
            <Button onClick={handleStart} variant="primary" className="w-full">
              <IconWand size={16} className="mr-2" /> Start Separation
            </Button>
          </div>
        )}

        {(isDispatching ||
          (job && job.status !== "completed" && job.status !== "failed")) && (
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-xs text-text-muted uppercase tracking-wider">
              <span>{job?.status || "Dispatching..."}</span>
              <span>{Math.round(job?.progress || 0)}%</span>
            </div>
            {/* Custom Progress Bar */}
            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${job?.progress || 0}%` }}
              />
            </div>
            {job?.status === "processing" && (
              <p className="text-xs text-center text-text-muted animate-pulse flex items-center justify-center gap-2">
                <IconLoader size={12} className="animate-spin" /> Processing
                audio...
              </p>
            )}
          </div>
        )}

        {job?.status === "completed" && job.result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-green-500 font-medium justify-center pb-2">
              <IconCheck size={18} /> Separation Complete
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(job.result).map(([stem, url]) => (
                <a
                  key={stem}
                  href={String(url)} // Ensure it's a string
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors border border-border"
                >
                  <span className="capitalize font-medium text-sm">{stem}</span>
                  <IconDownload size={16} className="text-text-muted" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
