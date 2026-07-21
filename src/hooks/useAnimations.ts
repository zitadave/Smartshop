import { useState, useCallback, useRef } from 'react';

export function useButtonAnimation() {
  const [activeId, setActiveId] = useState<number | null>(null);

  const trigger = useCallback((id: number, duration = 450) => {
    setActiveId(id);
    setTimeout(() => setActiveId(null), duration);
  }, []);

  return { activeId, trigger };
}

export function useWishlistAnimation() {
  const [activeId, setActiveId] = useState<number | null>(null);

  const trigger = useCallback((id: number, duration = 400) => {
    setActiveId(id);
    setTimeout(() => setActiveId(null), duration);
  }, []);

  return { activeId, trigger };
}

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const observe = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });
    observer.observe(node);
    ref.current = node;
  }, [options]);

  return { ref: observe, isVisible };
}
