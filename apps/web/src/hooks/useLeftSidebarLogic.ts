import { useLocation } from "wouter";

export function useLeftSidebarLogic() {
  const [location] = useLocation();

  return {
    location,
  };
}
