import { useCallback } from "react";

interface AlphabetNavOptions {
  idPrefix: string;
  headerOffset?: number;
  containerId?: string;
}

export function useAlphabetNav(options: AlphabetNavOptions) {
  const { idPrefix, headerOffset = 120, containerId = "main-content" } = options;

  const scrollToLetter = useCallback(
    (index: number, _letter: string) => {
      const element = document.getElementById(`${idPrefix}-${index}`);
      const container = document.getElementById(containerId);

      if (element && container) {
        const elementTop = element.offsetTop;
        const scrollPosition = elementTop - headerOffset;
        container.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      } else if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [idPrefix, headerOffset, containerId]
  );

  return {
    scrollToLetter,
  };
}
