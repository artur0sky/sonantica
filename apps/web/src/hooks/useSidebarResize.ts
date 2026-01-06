import { useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@sonantica/ui";

type SidebarType = "left" | "right" | "lyrics" | "eq" | "recommendations";

// Define allowed widths for each sidebar
const SIDEBAR_WIDTHS = {
  left: [72, 240, 320], // Condensed, Standard, Wide
  right: [80, 320], // XS (Covers), SM (Standard)
  lyrics: [320, 480, 600], // SM, MD, LG
  eq: [80, 320, 500], // XS (Mini), SM (List), MD (Graphic)
  recommendations: [320, 480], // Standard, Wide
};

// Helper: Snap value to closest number in array
function snapToClosest(value: number, snapPoints: number[]): number {
  let closest = snapPoints[0];
  let minDiff = Math.abs(value - closest);

  for (let i = 1; i < snapPoints.length; i++) {
    const diff = Math.abs(value - snapPoints[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = snapPoints[i];
    }
  }
  
  // Optional: Only snap if within tolerance? 
  // For "no free resizing", we should ALWAYS return one of the snap points.
  return closest;
}

export function useSidebarResize() {
  const {
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setLyricsSidebarWidth,
    setEQSidebarWidth,
    setRecommendationsSidebarWidth,
    leftSidebarWidth,
    rightSidebarWidth,
    lyricsSidebarWidth,
    eqSidebarWidth,
  } = useUIStore();

  const isResizing = useRef<SidebarType | null>(null);
  const rafId = useRef<number | null>(null);

  const startResizing = useCallback((sidebar: SidebarType) => {
    isResizing.current = sidebar;
    document.body.classList.add("is-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = null;
    document.body.classList.remove("is-resizing");
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      // Wrap in RAF for performance
      if (rafId.current) return;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        
        let newWidth = 0;
        let snapPoints: number[] = [];
        let setWidth: (w: number) => void = () => {};

        if (isResizing.current === "left") {
          newWidth = e.clientX;
          snapPoints = SIDEBAR_WIDTHS.left;
          setWidth = setLeftSidebarWidth;
        } else if (isResizing.current === "right") {
          newWidth = window.innerWidth - e.clientX;
          snapPoints = SIDEBAR_WIDTHS.right;
          setWidth = setRightSidebarWidth;
        } else if (isResizing.current === "lyrics") {
          newWidth = window.innerWidth - e.clientX;
          snapPoints = SIDEBAR_WIDTHS.lyrics;
          setWidth = setLyricsSidebarWidth;
        } else if (isResizing.current === "eq") {
          newWidth = window.innerWidth - e.clientX;
          snapPoints = SIDEBAR_WIDTHS.eq;
          setWidth = setEQSidebarWidth;
        } else if (isResizing.current === "recommendations") {
          newWidth = window.innerWidth - e.clientX;
          snapPoints = SIDEBAR_WIDTHS.recommendations;
          setWidth = setRecommendationsSidebarWidth;
        }

        // Apply snapping logic
        const snappedWidth = snapToClosest(newWidth, snapPoints);
        setWidth(snappedWidth);
      });
    },
    [
      setLeftSidebarWidth,
      setRightSidebarWidth,
      setLyricsSidebarWidth,
      setEQSidebarWidth,
      setRecommendationsSidebarWidth,
    ]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleResize(e);
    const onMouseUp = () => stopResizing();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleResize, stopResizing]);

  return { startResizing, leftSidebarWidth, rightSidebarWidth, lyricsSidebarWidth, eqSidebarWidth };
}
