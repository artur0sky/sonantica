import { motion } from "framer-motion";
import { IconUser } from "@tabler/icons-react";
import { cn } from "../../utils";

interface UserButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  image?: string;
}

export function UserButton({ onClick, className, image }: UserButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text hover:bg-accent/20 cursor-pointer transition-colors flex-shrink-0 overflow-hidden border border-transparent hover:border-accent/30",
        className
      )}
    >
      {image ? (
        <img src={image} alt="User" className="w-full h-full object-cover" />
      ) : (
        <IconUser size={18} stroke={1.5} className="sm:w-5 sm:h-5" />
      )}
    </motion.button>
  );
}
