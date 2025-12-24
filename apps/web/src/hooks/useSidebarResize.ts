import { useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@sonantica/ui";

type SidebarType = "left" | "right" | "lyrics" | "eq";

export function useSidebarResize() {
  const {
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setLyricsSidebarWidth,
    setEQSidebarWidth,
    leftSidebarWidth,
    rightSidebarWidth,
    lyricsSidebarWidth,
    eqSidebarWidth,
  } = useUIStore();

  const isResizing = useRef<SidebarType | null>(null);

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
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      if (isResizing.current === "left") {
        const newWidth = e.clientX;
        if (newWidth < 120) {
          setLeftSidebarWidth(72);
        } else {
          setLeftSidebarWidth(Math.max(200, Math.min(newWidth, 400)));
        }
      } else if (isResizing.current === "right") {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth < 160) {
          setRightSidebarWidth(80);
        } else {
          setRightSidebarWidth(Math.max(240, Math.min(newWidth, 500)));
        }
      } else if (isResizing.current === "lyrics") {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth < 160) {
          setLyricsSidebarWidth(80);
        } else {
          setLyricsSidebarWidth(Math.max(240, Math.min(newWidth, 600)));
        }
      } else if (isResizing.current === "eq") {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth < 160) {
          setEQSidebarWidth(80);
        } else {
          setEQSidebarWidth(Math.min(newWidth, 800));
        }
      }
    },
    [
      setLeftSidebarWidth,
      setRightSidebarWidth,
      setLyricsSidebarWidth,
      setEQSidebarWidth,
    ]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleResize(e);
    const onMouseUp = () => stopResizing();

    // Only add listeners if resizing is active or just generally? 
    // Usually easier to add generic valid listeners, but here we add them globally 
    // to catch mouse events outside the sidebar.
    // Optimization: Add them only when resizing starts? 
    // Current pattern in original code was adding them on mount.
    // Let's stick to the pattern but cleanup is handled.
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleResize, stopResizing]);

  return { startResizing, leftSidebarWidth, rightSidebarWidth, lyricsSidebarWidth, eqSidebarWidth };
}
