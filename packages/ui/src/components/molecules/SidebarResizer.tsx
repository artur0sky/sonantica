import { cn } from "../../utils/cn";

interface SidebarResizerProps {
  orientation?: "vertical" | "horizontal";
  onMouseDown: () => void;
  className?: string;
}

export function SidebarResizer({
  orientation = "vertical",
  onMouseDown,
  className,
}: SidebarResizerProps) {
  return (
    <div
      className={cn(
        "absolute z-30 transition-colors hover:bg-accent/30",
        orientation === "vertical"
          ? "top-0 w-1 h-full cursor-col-resize"
          : "left-0 h-1 w-full cursor-row-resize",
        // Position logic typically handled by parent, but defaults help
        orientation === "vertical" ? "right-0" : "bottom-0",
        className
      )}
      onMouseDown={onMouseDown}
    />
  );
}
