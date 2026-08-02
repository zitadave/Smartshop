import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
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

  // Filter only active ads up to maxActiveAds
  const activeAds = (config.ads || []).filter(a => a.status === 'active').slice(0, config.maxActiveAds);
  const slides = activeAds.length > 0 ? activeAds : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Handle auto-slide pause timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(3, config.slideDuration || 6) * 1000;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length, config.slideDuration, nextSlide]);

  const handleShopNow = (ad: HeroAd) => {
    if (ad.productId) {
      navigate('/product/' + ad.productId);
    } else {
      navigate('/shop');
    }
  };

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[currentIdx] || slides[0];

  return (
    <section 
      className="relative overflow-hidden bg-[#0b1628] text-white select-none transition-all duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background slide gradient */}
      <div 
        key={activeSlide.id}
        className={`absolute inset-0 bg-gradient-to-br ${activeSlide.bgGradient || 'from-[#0f172a] via-[#1e293b] to-[#334155]'} transition-colors duration-700 opacity-95`}
      />

      {/* Decorative subtle patterns */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

      {/* Main landscape banner slide content */}
      <div className="relative z-10 px-6 pt-7 pb-16 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Top Tagline / Sponsor badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold tracking-wide mb-3 border border-white/15 animate-fadeIn shadow-sm">
          <Sparkles size={13} className="text-amber-300 animate-pulse" />
          <span className="text-white/90">{activeSlide.tagline || '🌟 Sponsored Feature Special'}</span>
        </div>

        {/* Slide Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1.5 tracking-tight leading-tight animate-fadeUp text-white drop-shadow-sm">
          {activeSlide.title}
        </h2>

        {/* Slide Subtitle */}
        {activeSlide.subtitle && (
          <p className="text-xs sm:text-sm text-white/80 mb-3 max-w-md mx-auto leading-relaxed animate-fadeUp">
            {activeSlide.subtitle}
          </p>
        )}

        {/* Price Text Badge */}
        {activeSlide.priceText && (
          <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-extrabold mb-5 shadow-inner">
            {activeSlide.priceText}
          </div>
        )}

        {/* Primary Action Button - SHOP NOW */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleShopNow(activeSlide)}
            className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.96] transition-all duration-300"
          >
            <ShoppingBag size={16} className="text-slate-950" />
            <span>{activeSlide.ctaText || '🛍️ Shop Now'}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Vendor attribution and Ad info indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/50">
          <span>Sponsored by <strong className="text-white/80">{activeSlide.vendorName || 'Smart Shop Partner'}</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-400" /> Verified Seller</span>
        </div>

        {/* Navigation Arrows for Multiple Slides */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Carousel Dot Indicators */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIdx
                    ? 'w-7 h-2 bg-amber-400 shadow-md'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Platform Stat Badges */}
        <div className="flex gap-3 sm:gap-4 mt-6 justify-center">
          {[
            { val: `${productCount}`, label: 'Products', suffix: '+' },
            { val: `★ ${topRating.toFixed(1)}`, label: 'Rating', suffix: '' },
            { val: 'Free', label: 'Delivery', suffix: '' },
          ].map((s, i) => (
            <div key={i} className="text-center px-4 py-2 bg-white/5 rounded-xl backdrop-blur-md min-w-[68px] border border-white/10">
              <div className="text-xs font-black tracking-tight text-white">{s.val}{s.suffix}</div>
              <div className="text-[7px] text-white/50 uppercase tracking-widest mt-0.5 font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
