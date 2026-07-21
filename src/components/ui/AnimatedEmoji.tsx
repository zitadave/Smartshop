import { cn } from '@/lib/utils';

interface AnimatedEmojiProps {
  emoji: string;
  animation?: 'bounce' | 'wiggle' | 'float' | 'pulse' | 'spin' | 'heartBeat' | 'none';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl', xl: 'text-5xl' };

export function AnimatedEmoji({ emoji, animation = 'none', size = 'md', className }: AnimatedEmojiProps) {
  const animClass = animation === 'none' ? '' : `animate-${animation}`;
  return (
    <span className={cn('inline-block', sizeMap[size], animClass, className)} role="img" aria-hidden="true">
      {emoji}
    </span>
  );
}

/**
 * Rating stars with micro-animation
 */
export function AnimatedStars({ rating = 0, animated = false }: { rating?: number; reviews?: number; animated?: boolean }) {
  const f = Math.floor(rating);
  const h = rating % 1 >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return (
    <span className="stars">
      {Array.from({ length: f }).map((_, i) => (
        <span key={`f-${i}`} className={animated ? 'animate-countUp' : ''} style={animated ? { animationDelay: `${i * 0.1}s` } : undefined}>★</span>
      ))}
      {h > 0 && <span className={animated ? 'animate-countUp' : ''} style={animated ? { animationDelay: `${f * 0.1}s` } : undefined}>½</span>}
      {Array.from({ length: e }).map((_, i) => (
        <span key={`e-${i}`} className={animated ? 'animate-fadeIn' : ''} style={animated ? { animationDelay: `${(f + h + i) * 0.1}s` } : undefined}>☆</span>
      ))}
    </span>
  );
}

/**
 * Cart icon that bounces when items are added
 */
export function CartIconWithBadge({ count, animated }: { count: number; animated?: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className={cn(animated && 'animate-cartBounce')}>🛒</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[8px] font-bold flex items-center justify-center shadow-lg animate-scaleIn">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  );
}
