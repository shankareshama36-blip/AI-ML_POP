import { useEffect } from "react";

/**
 * Custom hook to preserve and restore exact scroll position across page reloads.
 * Uses sessionStorage so the position is maintained during the user's active session.
 */
export function useScrollRestoration(storageKey: string = "praxis-scroll-pos") {
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(storageKey);
    if (savedScroll) {
      const targetY = parseInt(savedScroll, 10);
      if (!Number.isNaN(targetY)) {
        requestAnimationFrame(() => {
          window.scrollTo(0, targetY);
        });
      }
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          sessionStorage.setItem(storageKey, window.scrollY.toString());
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [storageKey]);
}
