import { useState, useRef, useCallback, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPage?: number;
  pageSize?: number;
}

export function useInfiniteScroll<T>(items: T[], options: UseInfiniteScrollOptions = {}) {
  const { threshold = 200, initialPage = 1, pageSize = 8 } = options;
  const [page, setPage] = useState(initialPage);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const visibleItems = items.slice(0, page * pageSize);
  const hasMore = visibleItems.length < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    // Simulate async load
    requestAnimationFrame(() => {
      setPage(p => p + 1);
      setIsLoading(false);
    });
  }, [isLoading, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) loadMore();
      },
      { rootMargin: `${threshold}px` }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, threshold]);

  const reset = useCallback(() => setPage(initialPage), [initialPage]);

  return { visibleItems, hasMore, sentinelRef, isLoading, reset, page };
}
