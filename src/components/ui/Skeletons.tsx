import { cn } from '@/lib/utils';

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-card animate-fadeIn" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="shimmer-img" />
          <div className="p-3 space-y-2">
            <div className="shimmer-line" />
            <div className="shimmer-line s" />
            <div className="shimmer-line" style={{ width: '30%', height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="px-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center animate-fadeIn" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="w-14 h-14 rounded-xl skeleton flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 skeleton rounded" />
            <div className="h-2.5 w-1/2 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="h-64 bg-muted animate-pulse rounded-3xl mx-4 my-3" />
  );
}

export function DetailSkeleton() {
  return (
    <div className="px-4 space-y-4 animate-fadeIn">
      <div className="aspect-square skeleton rounded-2xl" />
      <div className="space-y-2">
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-4 w-1/2 skeleton rounded" />
        <div className="h-8 w-1/3 skeleton rounded" />
        <div className="h-16 skeleton rounded" />
      </div>
    </div>
  );
}
