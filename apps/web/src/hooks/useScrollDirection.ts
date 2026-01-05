/**
 * useScrollDirection Hook
 * Detects scroll direction to auto-hide/show navbar on mobile
 */

import { useState, useEffect, type RefObject } from "react";

interface UseScrollDirectionOptions {
  element?: RefObject<HTMLElement>;
  threshold?: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { element, threshold = 50 } = options;
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const scrollElement = element?.current || window;
    
    const handleScroll = () => {
      const currentScrollY = element?.current 
        ? element.current.scrollTop 
        : window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        // Scrolling down & past threshold
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setScrollDirection("up");
      }
      
      setLastScrollY(currentScrollY);
    };

    scrollElement.addEventListener("scroll", handleScroll as any, { passive: true });
    
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll as any);
    };
  }, [lastScrollY, element, threshold]);

  return scrollDirection;
}
