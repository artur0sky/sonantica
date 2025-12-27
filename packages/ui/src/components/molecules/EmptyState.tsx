import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn, gpuAnimations } from "@sonantica/shared";

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      {...gpuAnimations.fadeInUp}
      className={cn(
        "flex flex-col items-center justify-center text-center py-20 px-4",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 text-text-muted/30 p-4 bg-surface-elevated/50 rounded-full">
          <Icon size={48} stroke={1.5} />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-text-muted max-w-md mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}
