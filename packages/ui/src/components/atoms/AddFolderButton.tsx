/**
 * AddFolderButton - Button to trigger folder selection
 *
 * "User autonomy" - Simple, clear action to add music sources.
 */

import React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms/Button";

export interface AddFolderButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AddFolderButton component - Triggers folder selection dialog
 */
export function AddFolderButton({
  onClick,
  disabled = false,
  className,
}: AddFolderButtonProps) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={disabled}
      className={cn("gap-2", className)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="flex-shrink-0"
      >
        <path
          d="M16.667 15.833H3.333c-.92 0-1.666-.746-1.666-1.666V5.833c0-.92.746-1.666 1.666-1.666h3.334L8.333 6h8.334c.92 0 1.666.746 1.666 1.667v6.5c0 .92-.746 1.666-1.666 1.666Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 9.167v4.166M12.083 11.25H7.917"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>Add Folder</span>
    </Button>
  );
}
