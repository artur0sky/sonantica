import { useEffect } from 'react';
import { isSmartTV } from '@sonantica/shared';

/**
 * Spatial Navigation Hook for Smart TVs
 * 
 * Provides D-pad navigation support by calculating the nearest focusable 
 * element in the direction of the arrow key pressed.
 * 
 * "Respect the intention of the sound and the freedom of the listener."
 */
export function useSpatialNavigation() {
  useEffect(() => {
    // Only enable spatial navigation on Smart TVs or if explicitly requested
    if (typeof window === 'undefined' || !isSmartTV()) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      if (!navKeys.includes(key)) {
        // Handle Back button for TV remotes
        if (key === 'Backspace' || key === 'Escape') {
          const activeElement = document.activeElement as HTMLElement;
          // If we are in an input, let it handle backspace normally
          if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
            return;
          }
          
          // Otherwise, navigate back if possible
          if (window.history.length > 1) {
            e.preventDefault();
            window.history.back();
          }
        }
        return;
      }

      const currentFocus = document.activeElement as HTMLElement;
      
      // Select all focusable elements
      const focusableElements = Array.from(
        document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 && 
          rect.height > 0 && 
          style.visibility !== 'hidden' && 
          style.display !== 'none' &&
          !(el as any).disabled
        );
      }) as HTMLElement[];

      if (focusableElements.length === 0) return;

      // If nothing is focused, focus the first element
      if (!currentFocus || currentFocus === document.body) {
        focusableElements[0].focus();
        e.preventDefault();
        return;
      }

      e.preventDefault();

      const currentRect = currentFocus.getBoundingClientRect();
      const currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2
      };

      let bestElement = null as HTMLElement | null;
      let minDistance = Infinity;

      focusableElements.forEach((el: HTMLElement) => {
        if (el === currentFocus) return;

        const rect = el.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        let isMatch = false;
        
        // Directional filtering with a bit of overlap allowed (5px)
        switch (key) {
          case 'ArrowUp':
            if (rect.bottom <= currentRect.top + 5) isMatch = true;
            break;
          case 'ArrowDown':
            if (rect.top >= currentRect.bottom - 5) isMatch = true;
            break;
          case 'ArrowLeft':
            if (rect.right <= currentRect.left + 5) isMatch = true;
            break;
          case 'ArrowRight':
            if (rect.left >= currentRect.right - 5) isMatch = true;
            break;
        }

        if (isMatch) {
          // Calculate Euclidean distance between centers
          // We can weight the primary axis distance more to prefer elements aligned in the path
          const dx = center.x - currentCenter.x;
          const dy = center.y - currentCenter.y;
          
          let distance;
          if (key === 'ArrowUp' || key === 'ArrowDown') {
            // Favor vertical alignment: weight horizontal offset more
            distance = Math.sqrt(Math.pow(dx * 2, 2) + Math.pow(dy, 2));
          } else {
            // Favor horizontal alignment: weight vertical offset more
            distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy * 2, 2));
          }

          if (distance < minDistance) {
            minDistance = distance;
            bestElement = el;
          }
        }
      });

      if (bestElement) {
        bestElement.focus();
        bestElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Visual feedback for TV users
        bestElement.classList.add('tv-focused');
        setTimeout(() => bestElement?.classList.remove('tv-focused'), 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Global TV Focus styles
    const styleId = 'sonantica-tv-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @media screen {
                *:focus {
                    outline: 4px solid var(--sonantica-primary, #6366f1) !important;
                    outline-offset: 2px;
                    transition: outline-offset 0.2s ease;
                }
                .tv-focused {
                    transform: scale(1.02);
                    transition: transform 0.2s ease;
                }
            }
        `;
        document.head.appendChild(style);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
