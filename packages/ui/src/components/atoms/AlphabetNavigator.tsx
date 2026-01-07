import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";

interface AlphabetNavigatorProps {
  items: { name: string }[];
  onLetterClick: (index: number, letter: string) => void;
  className?: string;
  vertical?: boolean;
  scrollContainerId?: string;
  forceScrollOnly?: boolean;
  /**
   * If 'remote', all letters are available and onLetterClick
   * returns -1 for index. Used for server-side index navigation.
   */
  mode?: "local" | "remote";
}

const ALPHABET = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetNavigator({
  items,
  onLetterClick,
  className,
  vertical = true,
  scrollContainerId,
  forceScrollOnly = false,
  mode = "local",
}: AlphabetNavigatorProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map letters to their first index in the items list
  // Optimized for large collections
  const letterIndices = useMemo(() => {
    if (mode === "remote") return {}; // Not needed for remote

    const indices: Record<string, number> = {};

    // Early return for empty items
    if (items.length === 0) return indices;

    items.forEach((item, index) => {
      // Handle missing or invalid names
      if (!item?.name) return;

      let firstChar = item.name.charAt(0).toUpperCase();

      // Map non-alphabetic characters to #
      if (!firstChar || !/[A-Z]/.test(firstChar)) {
        firstChar = "#";
      }

      // Only store the first occurrence of each letter
      if (indices[firstChar] === undefined) {
        indices[firstChar] = index;
      }
    });

    return indices;
  }, [items, mode]);

  const availableLetters = useMemo(() => {
    if (mode === "remote") return ALPHABET;
    return ALPHABET.filter((l) => letterIndices[l] !== undefined);
  }, [letterIndices, mode]);

  // Detect scroll for visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);

      // Clear existing timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      // Hide after 2s of no scrolling
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 2000);
    };

    // Find the scroll container
    let scrollContainer: HTMLElement | Window = window;

    if (scrollContainerId) {
      const element = document.getElementById(scrollContainerId);
      if (element) {
        scrollContainer = element;
      }
    } else {
      // Try to find main element with overflow-y-auto
      const mainElement = document.querySelector("main.overflow-y-auto");
      if (mainElement) {
        scrollContainer = mainElement as HTMLElement;
      }
    }

    scrollContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    } as any);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [scrollContainerId]);

  const handleLetterInteraction = (letter: string) => {
    if (mode === "remote") {
      setActiveLetter(letter);
      onLetterClick(-1, letter);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setActiveLetter(null), 2000);
      return;
    }

    const index = letterIndices[letter];
    if (index !== undefined) {
      setActiveLetter(letter);
      onLetterClick(index, letter);

      if (timerRef.current) clearTimeout(timerRef.current);
      // Increased timeout for better visual feedback during navigation
      timerRef.current = setTimeout(() => setActiveLetter(null), 2000);
    }
  };

  return (
    <div
      style={{ right: "var(--alphabet-right, 8px)" }}
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 py-4 px-1 rounded-full bg-surface-elevated/20 backdrop-blur-md border border-white/5 transition-all duration-500 ease-in-out",
        // Desktop Persistent State (if not forced to scroll-only)
        !forceScrollOnly &&
          "md:opacity-40 md:hover:opacity-100 md:pointer-events-auto",
        // Scroll/Mobile State
        isScrolling || (isHovering && !forceScrollOnly)
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
        // If not scrolling and strictly forceScrollOnly, should be hidden
        forceScrollOnly && !isScrolling && "opacity-0 pointer-events-none",
        isHovering && "bg-surface-elevated/40",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {ALPHABET.map((letter) => {
        const isAvailable =
          mode === "remote" || letterIndices[letter] !== undefined;
        return (
          <button
            key={letter}
            disabled={!isAvailable}
            onClick={() => handleLetterInteraction(letter)}
            className={cn(
              "w-5 h-5 flex items-center justify-center text-[10px] font-bold transition-all rounded-full",
              isAvailable
                ? "text-text-muted hover:text-accent hover:bg-accent/10 cursor-pointer"
                : "text-text-muted/20 cursor-default",
              activeLetter === letter && "text-accent bg-accent/20 scale-125"
            )}
          >
            {letter}
          </button>
        );
      })}

      {/* Bubble Indicator */}
      <AnimatePresence>
        {activeLetter && isHovering && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.5 }}
            animate={{ opacity: 1, x: -40, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.5 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-2xl bg-accent text-white font-bold text-2xl shadow-2xl z-50 pointer-events-none"
            style={{
              top: `${
                (ALPHABET.indexOf(activeLetter) / ALPHABET.length) * 100
              }%`,
              transform: "translateY(-50%)",
            }}
          >
            {activeLetter}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
