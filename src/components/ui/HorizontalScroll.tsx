import type { ReactNode } from 'react';

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  return (
    <div className={`flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none snap-x snap-mandatory ${className}`}>
      {children}
    </div>
  );
}
