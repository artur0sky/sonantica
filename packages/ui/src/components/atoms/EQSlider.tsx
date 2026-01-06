import React from 'react';
import { cn } from '../../utils/cn';

export interface EQSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
  /**
   * For vertical sliders, specifies the length of the track (visually the height).
   * Defaults to "200px" for vertical, "100%" for horizontal.
   */
  trackLength?: string | number;
}

export const EQSlider = React.forwardRef<HTMLInputElement, EQSliderProps>(
  ({ className, value, min = -12, max = 12, step = 0.5, orientation = 'horizontal', trackLength, style, ...props }, ref) => {
    const isVertical = orientation === 'vertical';
    const trackSize = trackLength || (isVertical ? '200px' : '100%');
    
    // Calculate percentage for gradient
    const clampedValue = Math.min(Math.max(value, min), max);
    const percentage = ((clampedValue - min) / (max - min)) * 100;

    // Gradient style
    const gradientStyle = {
      background: `linear-gradient(to right, var(--color-accent, #818cf8) 0%, var(--color-accent, #818cf8) ${percentage}%, var(--color-surface-elevated, #3f3f46) ${percentage}%, var(--color-surface-elevated, #3f3f46) 100%)`
    };

    const commonClasses = cn(
      "appearance-none cursor-pointer rounded-full outline-none transition-all",
      // Webkit Thumb
      "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5",
      "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md",
      "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform",
      // Firefox Thumb
      "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5",
      "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full",
      "[&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
    );

    if (isVertical) {
      return (
        <div 
          className={cn("relative flex items-center justify-center pointer-events-none", className)}
          style={{ height: trackSize, width: '2rem' }}
        >
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            style={{
              ...style,
              ...gradientStyle,
              width: trackSize,
              height: '6px',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              position: 'absolute',
            }}
            className={cn(commonClasses, "pointer-events-auto")}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{
          ...style,
          ...gradientStyle,
          width: trackSize,
          height: '6px',
        }}
        className={cn(commonClasses, className)}
        {...props}
      />
    );
  }
);

EQSlider.displayName = 'EQSlider';
