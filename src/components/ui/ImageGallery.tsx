import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  badge?: React.ReactNode;
  className?: string;
}

export function ImageGallery({ images, badge, className }: ImageGalleryProps) {
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goTo = useCallback((i: number) => setIdx((i + images.length) % images.length), [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      goTo(idx - (dx > 0 ? 1 : -1));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className={cn('relative overflow-hidden bg-muted/20', className)}>
      <div
        className="relative aspect-square cursor-zoom-in select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={() => setZoomed(!zoomed)}
        onMouseMove={handleMouseMove}
        onClick={() => setZoomed(!zoomed)}
      >
        <img
          src={images[idx]}
          alt="Product"
          className={cn(
            'w-full h-full object-cover transition-transform duration-200 ease-out',
            zoomed && 'scale-150'
          )}
          style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          draggable={false}
        />

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm">
          {idx + 1} / {images.length}
        </div>

        {/* Badge */}
        {badge}

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white/90 transition-all active:scale-90 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); goTo(idx - 1); }}>
              <ChevronLeft size={18} />
            </button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white/90 transition-all active:scale-90 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); goTo(idx + 1); }}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button key={i} className={cn('w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all', i === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-75')} onClick={() => setIdx(i)}>
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
