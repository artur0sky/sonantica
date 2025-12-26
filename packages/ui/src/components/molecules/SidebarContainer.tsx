import { ReactNode } from "react";
import { motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import { cn } from "../../utils";

interface SidebarContainerProps {
  title: string;
  icon?: ReactNode;
  isCollapsed?: boolean;
  onClose?: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SidebarContainer({
  title,
  icon,
  isCollapsed,
  onClose,
  headerActions,
  children,
  className,
}: SidebarContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden transition-all",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 border-b border-border flex items-center justify-between transition-all flex-shrink-0",
          isCollapsed && "flex-col gap-4 px-2"
        )}
      >
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-semibold truncate tracking-tight flex items-center gap-2">
              {icon && <span className="text-accent">{icon}</span>}
              {title}
            </h2>
          </div>
        )}

        <div
          className={cn("flex items-center gap-2", isCollapsed && "flex-col")}
        >
          {headerActions}

          {onClose && (
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="text-text-muted hover:text-text p-1 transition-fast"
              aria-label="Close sidebar"
            >
              <IconX size={20} stroke={1.5} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content scroll area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all",
          isCollapsed ? "p-2" : "p-4 lg:p-3"
        )}
      >
        {children}
      </div>
    </div>
  );
}
