import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";

interface AlphabetNavigatorProps {
  items: { name: string }[];
  onLetterClick: (index: number, letter: string) => void;
  className?: string;
  vertical?: boolean;
}

const ALPHABET = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetNavigator({
  items,
  onLetterClick,
  className,
  vertical = true,
}: AlphabetNavigatorProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map letters to their first index in the items list
  const letterIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    items.forEach((item, index) => {
      let firstChar = item.name.charAt(0).toUpperCase();
      if (!/[A-Z]/.test(firstChar)) firstChar = "#";

      if (indices[firstChar] === undefined) {
        indices[firstChar] = index;
      }
    });
    return indices;
  }, [items]);

  const availableLetters = useMemo(() => {
    return ALPHABET.filter((l) => letterIndices[l] !== undefined);
  }, [letterIndices]);

  const handleLetterInteraction = (letter: string) => {
    const index = letterIndices[letter];
    if (index !== undefined) {
      setActiveLetter(letter);
      onLetterClick(index, letter);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setActiveLetter(null), 1000);
    }
  };

  return (
    <div
      className={cn(
        "fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 py-4 px-1 rounded-full bg-surface-elevated/20 backdrop-blur-md border border-white/5 transition-all duration-300",
        isHovering ? "bg-surface-elevated/40" : "opacity-40 hover:opacity-100",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {ALPHABET.map((letter) => {
        const isAvailable = letterIndices[letter] !== undefined;
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
