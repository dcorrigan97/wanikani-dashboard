import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 70;
const MAX_PULL = 120;

/**
 * Tracks a downward drag from the top of the page and calls onRefresh once
 * released past THRESHOLD. Only activates when the page is scrolled to the
 * very top, so it doesn't interfere with normal scrolling.
 */
export function usePullToRefresh(onRefresh, disabled) {
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const distanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (disabled) return undefined;

    function onTouchStart(e) {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    }

    function onTouchMove(e) {
      if (!pullingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        const clamped = Math.min(delta, MAX_PULL);
        distanceRef.current = clamped;
        setPullDistance(clamped);
      } else {
        pullingRef.current = false;
        distanceRef.current = 0;
        setPullDistance(0);
      }
    }

    function onTouchEnd() {
      if (pullingRef.current && distanceRef.current > THRESHOLD) {
        onRefreshRef.current();
      }
      pullingRef.current = false;
      distanceRef.current = 0;
      setPullDistance(0);
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [disabled]);

  return { pullDistance, threshold: THRESHOLD };
}
