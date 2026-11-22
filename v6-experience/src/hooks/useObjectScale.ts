import { useLayoutEffect, type RefObject } from 'react';

/** Fit an object's own coordinates to its responsive layout slot. */
export function useObjectScale(
  slot: RefObject<HTMLElement | null>, width: number, height: number, maximum = Infinity,
) {
  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const fit = (availableWidth: number, availableHeight: number) => {
      const scale = Math.min(maximum, availableWidth / width, availableHeight / height);
      element.style.setProperty('--object-scale', String(scale));
    };
    fit(element.clientWidth, element.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      fit(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [slot, width, height, maximum]);
}
