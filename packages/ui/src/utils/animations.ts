import type { TargetAndTransition, Variants, Transition } from "framer-motion";

/**
 * Standard Animation Variants for Sonántica
 * Follows IDENTITY.md: "Subtle, Functional, Never the main focus"
 */

// Transition presets
export const transitions = {
  default: { duration: 0.2, ease: "easeOut" } as Transition,
  slow: { duration: 0.4, ease: "easeOut" } as Transition,
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 20 } as Transition, // Use sparingly
};

// Interaction variants (hover, tap)
// using TargetAndTransition explicitly to avoid type mismatch with whileHover/whileTap props
export const buttonAnimations = {
  hover: { scale: 1.02, transition: transitions.default } as TargetAndTransition,
  tap: { scale: 0.98, transition: transitions.default } as TargetAndTransition,
  glow: {
    boxShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.5)",
    transition: transitions.default,
  } as TargetAndTransition,
};

// Entrance animations
export const entranceVariants = {
  // Fade in only
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.default },
    exit: { opacity: 0, transition: transitions.default },
  } as Variants,

  // Slide up with fade (standard for lists/cards)
  slideUp: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: transitions.default },
    exit: { opacity: 0, y: 10, transition: transitions.default },
  } as Variants,

  // Slide from side (for sidebars/drawers)
  slideRight: {
    hidden: { x: 300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: transitions.spring },
    exit: { x: 300, opacity: 0, transition: transitions.default },
  } as Variants,

  slideLeft: {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: transitions.spring },
    exit: { x: -300, opacity: 0, transition: transitions.default },
  } as Variants,
};

// Container stagger (for lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};
