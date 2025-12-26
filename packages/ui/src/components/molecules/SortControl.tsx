import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { Button } from "../atoms/Button"; // Assuming Button is available in atoms, otherwise adjust import
import { cn } from "../../utils";

interface SortOption {
  value: string;
  label: string;
}

interface SortControlProps {
  options: SortOption[];
  value: string;
  onValueChange: (value: string) => void;
  direction: "asc" | "desc";
  onDirectionChange: (direction: "asc" | "desc") => void;
  className?: string;
}

export function SortControl({
  options,
  value,
  onValueChange,
  direction,
  onDirectionChange,
  className,
}: SortControlProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer min-w-[120px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 min-w-[36px] px-0 justify-center"
        title={direction === "asc" ? "Ascending" : "Descending"}
      >
        {direction === "asc" ? (
          <IconSortAscending size={18} />
        ) : (
          <IconSortDescending size={18} />
        )}
      </Button>
    </div>
  );
}
