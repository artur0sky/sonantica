/**
 * GPU-Accelerated Animation Constants
 * 
 * PERFORMANCE: Only use GPU-accelerated properties (transform, opacity)
 * Avoid: width, height, top, left, margin, padding (trigger layout/paint)
 * 
 * Following Sonántica's minimalist philosophy:
 * "Subtle, functional, never the main focus"
 */

/**
 * GPU-accelerated animation variants for Framer Motion
 * All animations use only transform and opacity
 */
export const gpuAnimations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  fadeInUp: {
    initial: { opacity: 0, transform: "translateY(10px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    exit: { opacity: 0, transform: "translateY(-10px)" },
    transition: { duration: 0.2 },
  },

  fadeInDown: {
    initial: { opacity: 0, transform: "translateY(-10px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    exit: { opacity: 0, transform: "translateY(10px)" },
    transition: { duration: 0.2 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, transform: "scale(0.95)" },
    animate: { opacity: 1, transform: "scale(1)" },
    exit: { opacity: 0, transform: "scale(0.95)" },
    transition: { duration: 0.2 },
  },

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, transform: "translateX(-20px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
    exit: { opacity: 0, transform: "translateX(-20px)" },
    transition: { duration: 0.2 },
  },

  slideInRight: {
    initial: { opacity: 0, transform: "translateX(20px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
    exit: { opacity: 0, transform: "translateX(20px)" },
    transition: { duration: 0.2 },
  },

  // Hover effects (GPU-only)
  hoverScale: {
    whileHover: { transform: "scale(1.02)" },
    whileTap: { transform: "scale(0.98)" },
    transition: { duration: 0.1 },
  },

  hoverLift: {
    whileHover: { transform: "translateY(-2px)" },
    whileTap: { transform: "translateY(0)" },
    transition: { duration: 0.1 },
  },

  // List item animations
  listItem: {
    initial: { opacity: 0, transform: "translateY(10px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    exit: { opacity: 0, transform: "scale(0.95)" },
    transition: { duration: 0.15 },
  },

  // Modal/Overlay animations
  modal: {
    initial: { opacity: 0, transform: "scale(0.9)" },
    animate: { opacity: 1, transform: "scale(1)" },
    exit: { opacity: 0, transform: "scale(0.9)" },
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },

  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  },
} as const;

/**
 * Spring configurations for smooth animations
 */
export const springConfigs = {
  gentle: { type: "spring" as const, damping: 25, stiffness: 200 },
  snappy: { type: "spring" as const, damping: 20, stiffness: 300 },
  bouncy: { type: "spring" as const, damping: 15, stiffness: 400 },
} as const;

/**
 * Easing functions (GPU-accelerated)
 */
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.87, 0, 0.13, 1],
} as const;

/**
 * Performance hints for CSS animations
 * Use these classes to enable GPU acceleration
 */
export const gpuHints = {
  // Force GPU layer creation
  willChange: "will-change-transform-opacity",
  // Promote to own layer
  transform3d: "transform-gpu",
} as const;
