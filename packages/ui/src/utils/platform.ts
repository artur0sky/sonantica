/**
 * Platform detection utilities
 */

export const isCapacitor = (): boolean => {
  return typeof window !== "undefined" && (window as any).Capacitor !== undefined;
};

export const isBrowser = (): boolean => {
  return !isCapacitor();
};

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isDesktop = (): boolean => {
  return !isMobile();
};
