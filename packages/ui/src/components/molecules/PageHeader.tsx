import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "bg-bg/95 backdrop-blur-md border-b border-border/50 -mx-6 px-6 py-4 mb-6 z-30",
        sticky && "sticky top-0",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <div className="text-sm text-text-muted mt-1">{subtitle}</div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}
