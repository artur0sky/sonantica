import React, { useState, useEffect } from "react";
import {
  IconFolder,
  IconFile,
  IconChevronRight,
  IconChevronDown,
  IconMusic,
  IconSearch,
  IconRefresh,
} from "@tabler/icons-react";
import { cn, type IFileEntry, type IFileProvider } from "@sonantica/shared";

interface FileExplorerProps {
  provider?: IFileProvider;
  onFileSelect?: (file: IFileEntry) => void;
  className?: string;
  rootPath?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  provider,
  onFileSelect,
  className,
  rootPath = "",
}) => {
  const [entries, setEntries] = useState<IFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const loadEntries = async (path?: string) => {
    if (!provider) return;
    try {
      setLoading(true);
      const res = await provider.listDirectory(path || rootPath);
      setEntries(res);
    } catch (err) {
      console.error("File Explorer Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider) {
      loadEntries();
    } else {
      // Fallback/Mock for visual development only when no provider is given
      setEntries([
        {
          name: "Projects",
          path: "/projects",
          is_directory: true,
          children: [
            {
              name: "My Track.son",
              path: "/projects/my-track.son",
              is_directory: false,
              extension: "son",
            },
          ],
        },
        {
          name: "Samples",
          path: "/samples",
          is_directory: true,
          children: [
            {
              name: "Kick.wav",
              path: "/samples/kick.wav",
              is_directory: false,
              extension: "wav",
            },
          ],
        },
      ]);
    }
  }, [rootPath, provider]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedFolders(next);
  };

  const renderEntry = (entry: IFileEntry, depth: number = 0) => {
    const isExpanded = expandedFolders.has(entry.path);
    const isAudio =
      entry.extension &&
      ["wav", "flac", "mp3", "m4a", "ogg"].includes(
        entry.extension.toLowerCase()
      );

    if (
      searchQuery &&
      !entry.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.is_directory
    ) {
      return null;
    }

    return (
      <div key={entry.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors",
            "hover:bg-surface-elevated/50 group",
            depth > 0 && "ml-4"
          )}
          onClick={() => {
            if (entry.is_directory) {
              toggleFolder(entry.path);
            } else {
              onFileSelect?.(entry);
            }
          }}
        >
          {entry.is_directory ? (
            <>
              {isExpanded ? (
                <IconChevronDown size={14} className="text-text-muted" />
              ) : (
                <IconChevronRight size={14} className="text-text-muted" />
              )}
              <IconFolder size={18} className="text-accent/70" />
            </>
          ) : (
            <>
              <div className="w-3.5" />
              {isAudio ? (
                <IconMusic size={18} className="text-emerald-400/70" />
              ) : (
                <IconFile size={18} className="text-text-muted/70" />
              )}
            </>
          )}
          <span
            className={cn(
              "text-sm truncate flex-1",
              entry.is_directory
                ? "font-medium"
                : "text-text-muted group-hover:text-text"
            )}
          >
            {entry.name}
          </span>
        </div>

        {entry.is_directory && isExpanded && entry.children && (
          <div className="mt-0.5">
            {entry.children.map((child) => renderEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-base border border-border/40 rounded-xl overflow-hidden",
        className
      )}
    >
      <div className="p-3 border-b border-border/40 bg-surface-elevated/20 flex items-center gap-2">
        <div className="relative flex-1">
          <IconSearch
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted transition-colors"
          title="Refresh"
          onClick={() => loadEntries()}
        >
          <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {entries.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 space-y-2">
            <IconFolder size={32} stroke={1} />
            <p className="text-xs">Empty directory</p>
          </div>
        ) : (
          entries.map((entry) => renderEntry(entry))
        )}
      </div>

      <div className="px-3 py-1.5 bg-surface-elevated/40 border-t border-border/40 flex items-center justify-between">
        <span className="text-[10px] text-text-muted truncate flex-1">
          {loading ? "Reading..." : rootPath || "Library"}
        </span>
        <span className="text-[10px] text-accent/70 font-mono">
          {entries.length} items
        </span>
      </div>
    </div>
  );
};
