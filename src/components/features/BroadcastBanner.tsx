import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn, formatCountdown } from '@/lib/utils';
import { X, Bell, Megaphone, Gift, AlertTriangle, Info, Sparkles } from 'lucide-react';

interface BroadcastBannerProps {
  compact?: boolean;
}

export default function BroadcastBanner({ compact }: BroadcastBannerProps) {
  const { broadcastMessages, markBroadcastSeen, seenBroadcasts } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const activeMessages = broadcastMessages
    .filter(m => {
      if (seenBroadcasts.includes(m.id)) return false;
      if (m.expiresAt && new Date(m.expiresAt).getTime() < Date.now()) return false;
      return true;
    })
    .slice(0, 3);

  const current = activeMessages[currentIdx];

  const dismiss = useCallback(() => {
    if (current) {
      markBroadcastSeen(current.id);
      setDismissed(true);
    }
  }, [current, markBroadcastSeen]);

  const next = useCallback(() => {
    if (currentIdx < activeMessages.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setDismissed(true);
    }
  }, [currentIdx, activeMessages.length]);

  // Auto-rotate
  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev < activeMessages.length - 1) return prev + 1;
        return 0;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [activeMessages.length]);

  if (dismissed || !current || activeMessages.length === 0) return null;

  const iconMap: Record<string, any> = {
    info: Info,
    promo: Gift,
    alert: AlertTriangle,
    event: Sparkles,
  };
  const bgMap: Record<string, string> = {
    info: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    promo: 'from-orange-500/10 to-amber-600/5 border-orange-500/20',
    alert: 'from-red-500/10 to-rose-600/5 border-red-500/20',
    event: 'from-purple-500/10 to-violet-600/5 border-purple-500/20',
  };
  const Icon = iconMap[current.type] || Bell;

  if (compact) {
    return (
      <div className={cn(
        'fixed bottom-16 left-3 right-3 z-50 animate-slideUp',
      )}>
        <div className={cn(
          'flex items-center gap-2 bg-card border px-3 py-2.5 rounded-xl shadow-lg backdrop-blur-sm',
          bgMap[current.type] || 'from-primary/10 to-primary/5 border-primary/20'
        )}>
          <Icon size={14} className="text-primary flex-shrink-0" />
          <p className="text-[10px] flex-1 leading-tight">{current.title}: {current.message}</p>
          <button onClick={dismiss} className="p-0.5 hover:bg-muted rounded">
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border mb-2 bg-gradient-to-r',
      bgMap[current.type] || 'from-primary/10 to-primary/5 border-primary/20'
    )}>
      <div className="flex items-start gap-2.5 p-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-[11px] font-bold">{current.title}</h4>
            {activeMessages.length > 1 && (
              <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                {currentIdx + 1}/{activeMessages.length}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{current.message}</p>
          {current.link && (
            <a
              href={current.link}
              className="text-[9px] text-primary font-semibold mt-1 inline-block hover:underline"
            >
              Learn more →
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={dismiss} className="p-1 hover:bg-background/50 rounded transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      {activeMessages.length > 1 && (
        <div className="flex justify-center gap-1 pb-2">
          {activeMessages.map((_, i) => (
            <div
              key={i}
              className={cn('w-1.5 h-1.5 rounded-full transition-all', i === currentIdx ? 'bg-primary w-3' : 'bg-muted-foreground/30')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Broadcast notification dot for header */
export function BroadcastIndicator() {
  const { broadcastMessages, seenBroadcasts } = useStore();
  const unread = broadcastMessages.filter(m => !seenBroadcasts.includes(m.id)).length;
  if (unread === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
      {unread}
    </span>
  );
}
