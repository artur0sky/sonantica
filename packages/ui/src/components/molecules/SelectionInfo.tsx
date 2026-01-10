import React from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "../atoms/Button";
import { cn } from "../../utils/cn";

export interface SelectionInfoProps {
  count: number;
  itemType: string | null;
  isMobile?: boolean;
  onClose: () => void;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
}

export function SelectionInfo({
  count,
  itemType,
  isMobile,
  onClose,
  onClear,
  showClear,
  className,
}: SelectionInfoProps) {
  const plural = count !== 1 ? "s" : "";
  const displayType = itemType || "item";

  return (
    <div
      className={cn(
        "flex items-center justify-between w-full",
        !isMobile && "w-auto",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface rounded-lg transition-colors flex-shrink-0"
          title="Cancel"
        >
          <IconX size={isMobile ? 18 : 20} />
        </button>
        <div className="text-sm font-medium whitespace-nowrap">
          {count} {displayType}
          {plural} selected
        </div>
      </div>

      {isMobile && showClear && count > 1 && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-text-muted text-xs h-8"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
