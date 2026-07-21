import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining, cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface FlashDealTimerProps {
  endTime: number; // timestamp ms
  startTime?: number;
  discount?: number;
  className?: string;
  compact?: boolean;
  onEnd?: () => void;
}

export default function FlashDealTimer({
  endTime,
  startTime,
  discount,
  className,
  compact,
  onEnd,
}: FlashDealTimerProps) {
  const [remaining, setRemaining] = useState(endTime - Date.now());
  const [ended, setEnded] = useState(false);

  const update = useCallback(() => {
    const rem = endTime - Date.now();
    setRemaining(rem);
    if (rem <= 0) {
      setEnded(true);
      onEnd?.();
    }
  }, [endTime, onEnd]);

  useEffect(() => {
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [update]);

  if (ended && compact) return null;

  if (ended) {
    return (
      <div className={cn('flex items-center gap-1.5 text-[10px] text-red-500 font-medium', className)}>
        <Zap size={12} />
        Deal Ended
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 text-[9px] font-semibold bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full', className)}>
        <Zap size={8} className="text-yellow-400" />
        <span className="text-yellow-300">
          {formatTimeRemaining(remaining)}
        </span>
        {discount && <span className="text-red-400">-{discount}%</span>}
      </div>
    );
  }

  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={cn('flash-deal-timer', className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Zap size={14} className="text-orange-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-600 dark:text-orange-400">
            Flash Sale
          </span>
        </div>
        {discount && (
          <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-1">
        {d > 0 && (
          <>
            <TimeBlock value={pad(d)} label="Days" />
            <Separator />
          </>
        )}
        <TimeBlock value={pad(h)} label="Hrs" />
        <Separator />
        <TimeBlock value={pad(m)} label="Min" />
        <Separator />
        <TimeBlock value={pad(s)} label="Sec" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 dark:bg-gray-800 text-white font-mono font-bold text-sm min-w-[2rem] h-7 flex items-center justify-center rounded-md px-1.5 shadow-inner">
        {value}
      </div>
      <span className="text-[7px] uppercase text-muted-foreground mt-0.5 tracking-wider">{label}</span>
    </div>
  );
}

function Separator() {
  return <span className="text-lg font-bold text-muted-foreground/40 mb-3">:</span>;
}

/** Hook to get all active flash deals from settings */
export function useFlashDeals(settings: { flashSales?: Record<string, { end: number; startedAt: number; discount?: number }> }) {
  const [activeDeals, setActiveDeals] = useState<{ productId: number; endTime: number; discount: number }[]>([]);

  useEffect(() => {
    if (!settings.flashSales) { setActiveDeals([]); return; }
    const now = Date.now();
    const deals = Object.entries(settings.flashSales)
      .filter(([_, deal]) => now < deal.end)
      .map(([pid, deal]) => ({
        productId: Number(pid),
        endTime: deal.end,
        discount: deal.discount || 0,
      }));
    setActiveDeals(deals);

    const interval = setInterval(() => {
      const updated = Object.entries(settings.flashSales || {})
        .filter(([_, deal]) => Date.now() < deal.end)
        .map(([pid, deal]) => ({
          productId: Number(pid),
          endTime: deal.end,
          discount: deal.discount || 0,
        }));
      setActiveDeals(updated);
    }, 10000);
    return () => clearInterval(interval);
  }, [settings.flashSales]);

  return activeDeals;
}
