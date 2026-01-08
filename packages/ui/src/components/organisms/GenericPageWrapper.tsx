import { ReactNode } from "react";
import { cn } from "../../utils";

export interface GenericPageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function GenericPageWrapper({
  children,
  className,
}: GenericPageWrapperProps) {
  return (
    <div
      className={cn(
        "max-w-6xl mx-auto px-6 pb-32 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
