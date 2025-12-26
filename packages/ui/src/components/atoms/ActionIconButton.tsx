import { motion } from "framer-motion";
import { cn } from "../../utils";
import { buttonAnimations } from "../../utils/animations";

interface ActionIconButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  size?: number;
  className?: string;
}

export function ActionIconButton({
  icon: Icon,
  onClick,
  isActive = false,
  title,
  size = 20,
  className,
}: ActionIconButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        ...buttonAnimations.hover,
        color: isActive ? "var(--color-accent-hover)" : "var(--color-text)",
      }}
      whileTap={buttonAnimations.tap}
      className={cn(
        "transition-colors flex items-center justify-center p-2 rounded-full",
        isActive
          ? "text-accent bg-accent/10"
          : "text-text-muted hover:bg-white/5",
        className
      )}
      title={title}
    >
      <Icon size={size} stroke={1.5} />
    </motion.button>
  );
}
