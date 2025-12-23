/**
 * Slider Atom
 * 
 * Range input for volume and timeline.
 */

import { cn } from '../../utils/cn';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({ className, value, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      className={cn(
        'w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
        '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent',
        '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform',
        '[&::-webkit-slider-thumb]:hover:scale-110',
        '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0',
        '[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform',
        '[&::-moz-range-thumb]:hover:scale-110',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}
