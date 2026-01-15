/**
 * useDocumentTitle Hook
 * 
 * Updates the document title dynamically based on the current page.
 * Follows the pattern: "Page Name | Sonántica"
 */

import { useEffect } from 'react';

const BASE_TITLE = 'Sonántica';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = BASE_TITLE;
    }

    // Cleanup: reset to base title on unmount
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}

/**
 * Helper function to set title imperatively
 */
export function setDocumentTitle(title?: string) {
  if (title) {
    document.title = `${title} | ${BASE_TITLE}`;
  } else {
    document.title = BASE_TITLE;
  }
}
