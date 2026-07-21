import { useState, useRef, useCallback, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; pulling.current = true; }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const dist = Math.max(0, e.touches[0].clientY - startY.current);
    setPullDistance(Math.min(dist * 0.5, 120));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= threshold) {
      setRefreshing(true);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {pullDistance > 0 && (
        <div className="flex justify-center items-center overflow-hidden transition-all" style={{ height: pullDistance }}>
          <RefreshCw size={20} className={`text-primary ${refreshing ? 'animate-spin' : 'animate-spin'}`} style={{ animationDuration: refreshing ? '0.8s' : `${1.5 - pullDistance / 200}s` }} />
        </div>
      )}
      {refreshing && (
        <div className="flex justify-center py-3">
          <RefreshCw size={18} className="animate-spin text-primary" />
          <span className="text-xs text-muted-foreground ml-2">Refreshing...</span>
        </div>
      )}
      {children}
    </div>
  );
}
