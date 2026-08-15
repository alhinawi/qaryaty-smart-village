// ─── Imports
import { useEffect, useState } from 'react';

// ─── Hook
export function useSplashScreen() {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [isAppVisible, setIsAppVisible] = useState(false);

  useEffect(() => {
    // Hold splash screen for 2s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // After 800ms fade transition, remove splash and reveal app
    const finishTimer = setTimeout(() => {
      setIsMounted(false);
      setIsAppVisible(true);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return {
    showSplash: isMounted,
    isFadingOut,
    isAppVisible,
  };
}
