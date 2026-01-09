import React from "react";
import { cn } from "../../utils/cn";

export interface BackdropProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
}

export function Backdrop({ isOpen, onClick, className }: BackdropProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-300",
        className
      )}
      aria-hidden="true"
    />
  );
}
