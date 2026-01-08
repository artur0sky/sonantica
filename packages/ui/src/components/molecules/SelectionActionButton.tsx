import React from "react";
import { Button, ButtonProps } from "../atoms/Button";
import { cn } from "../../utils/cn";

export interface SelectionActionButtonProps
  extends Omit<ButtonProps, "children"> {
  icon: React.ElementType;
  label: string;
  isMobile?: boolean;
  children?: React.ReactNode;
}

export function SelectionActionButton({
  icon: Icon,
  label,
  isMobile,
  className,
  ...props
}: SelectionActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-2",
        isMobile && "flex-col h-auto py-1.5 px-3 min-w-[60px]",
        className
      )}
      {...props}
    >
      <Icon size={isMobile ? 16 : 18} />
      <span className={cn(isMobile && "text-[10px]")}>{label}</span>
    </Button>
  );
}
