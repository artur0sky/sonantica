import React from "react";
import { Badge } from "../atoms/Badge";
import { EQSlider } from "../atoms/EQSlider";
import { cn } from "../../utils/cn";

export interface EQControlGroupProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  badgeVariant?: "default" | "accent" | "custom";
  showLabels?: boolean;
  labelsText?: { min: string; mid: string; max: string };
}

export function EQControlGroup({
  label,
  value,
  unit = "",
  min,
  max,
  step = 0.5,
  onChange,
  disabled,
  className,
  badgeVariant = "custom",
  showLabels = true,
  labelsText,
}: EQControlGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-text">{label}</label>
        <Badge
          variant={badgeVariant}
          className="text-xs font-sans bg-accent/10 text-accent px-2 py-0.5"
        >
          {value.toFixed(1)}
          {unit ? ` ${unit}` : ""}
        </Badge>
      </div>
      <EQSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="py-2"
      />
      {showLabels && (
        <div className="flex justify-between text-[10px] text-text-muted font-sans px-1">
          <span>{labelsText?.min ?? min}</span>
          <span>{labelsText?.mid ?? (min + max) / 2}</span>
          <span>{labelsText?.max ?? `+${max}`}</span>
        </div>
      )}
    </div>
  );
}
