import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { getHeroCarouselConfig } from '@/lib/heroAds';
import type { HeroAd } from '@/types';

interface HeroProps {
  productCount: number;
  topRating: number;
}

export function Hero({ productCount, topRating }: HeroProps) {
  const navigate = useNavigate();
  const { settings } = useStore();
  const config = getHeroCarouselConfig(settings);

  // Filter active ads up to maxActiveAds limit (>6)
  const activeAds = (config.ads || []).filter(a => a.status === 'active').slice(0, config.maxActiveAds);
  const slides = activeAds.length > 0 ? activeAds : [];

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Handle auto-slide scroll
  const scrollToIdx = useCallback((index: number) => {
    if (!scrollRef.current || slides.length === 0) return;
    const container = scrollRef.current;
    const targetIdx = ((index % slides.length) + slides.length) % slides.length;
    const child = container.children[targetIdx] as HTMLElement;
    if (child) {
      container.scrollTo({
        left: child.offsetLeft - 16, // account for container padding
        behavior: 'smooth',
      });
      setCurrentIdx(targetIdx);
    }
  }, [slides.length]);

  // Update currentIdx when user manually swipes
  const handleScroll = () => {
    if (!scrollRef.current || slides.length === 0) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.clientWidth * 0.88; // card width ratio
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < slides.length && newIdx !== currentIdx) {
      setCurrentIdx(newIdx);
    }
  };

  // Auto-slide timer (no manual slider buttons)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const intervalMs = Math.max(3, config.slideDuration || 6) * 1000;
    const timer = setInterval(() => {
      scrollToIdx(currentIdx + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, slides.length, config.slideDuration, currentIdx, scrollToIdx]);

  const handleBannerClick = (ad: HeroAd) => {
    if (ad.productId) {
      navigate('/product/' + ad.productId);
    } else {
      navigate('/shop');
    }
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative w-full py-2 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Horizontal Swipeable & Auto-Sliding Carousel Container — Next slide peeks from right edge */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 pt-2 pb-3"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id || i}
            onClick={() => handleBannerClick(slide)}
            role="button"
            tabIndex={0}
            className="relative w-[90%] sm:w-[92%] md:w-[95%] flex-shrink-0 snap-center rounded-[24px] sm:rounded-3xl overflow-hidden shadow-xl border border-border/30 bg-slate-900 aspect-[1.95/1] sm:aspect-[2.35/1] md:aspect-[2.65/1] cursor-pointer hover:shadow-2xl transition-all group"
          >
            {/* High-quality background picture banner */}
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-[1.01]"
                draggable={false}
              />
            ) : (
              /* Fallback gradient if no picture URL is provided */
              <div className={`w-full h-full bg-gradient-to-br ${slide.bgGradient || 'from-[#0f172a] via-[#1e293b] to-[#334155]'} p-6 flex flex-col justify-end text-white`}>
                <div className="text-xs font-bold opacity-80">{slide.tagline || '🌟 Featured Special'}</div>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1">{slide.title}</h3>
                <p className="text-xs opacity-75 mt-0.5">{slide.subtitle}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subtle indicator dots — Zero manual slider arrow buttons */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-1 pb-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIdx
                  ? 'w-6 h-1.5 bg-primary shadow-sm'
                  : 'w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
