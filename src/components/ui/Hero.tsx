import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';

interface HeroProps {
  productCount: number;
  topRating: number;
}

export function Hero({ productCount, topRating }: HeroProps) {
  const navigate = useNavigate();
  const { language } = useStore();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1628] via-[#14213d] to-[#1a2d4f] text-white px-6 pt-12 pb-10">
      {/* Animated Orbs */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/15 to-purple-400/10 animate-float" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-400/10 to-teal-400/10 animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/[0.02] animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />

      {/* Sparkle dots */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-white/20 animate-pulse"
          style={{ top: `${15 + i * 12}%`, left: `${10 + i * 15}%`, animationDelay: `${i * 0.3}s`, animationDuration: '2s' }} />
      ))}

      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 backdrop-blur-md text-[10px] font-medium mb-6 border border-white/10 animate-fadeUp">
          <Sparkles size={13} className="text-blue-300" />
          <span className="text-white/80">Premium Ethiopian Marketplace</span>
        </div>

        <h2 className="text-3xl font-extrabold mb-2 tracking-tight leading-tight animate-fadeUp delay-1">
          {t('welcome', language)}
        </h2>
        <p className="text-sm text-white/60 mb-7 max-w-sm mx-auto leading-relaxed animate-fadeUp delay-2">
          Discover curated products at exceptional prices with complimentary delivery
        </p>

        <button
          className="group inline-flex items-center gap-2 px-9 py-3.5 bg-white text-[#0b1628] rounded-2xl text-sm font-bold shadow-2xl hover:shadow-3xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 animate-fadeUp delay-3"
          onClick={() => navigate('/shop')}
        >
          <span>Explore Collection</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex gap-4 mt-8 justify-center animate-fadeUp delay-4">
          {[
            { val: `${productCount}`, label: 'Products', suffix: '+' },
            { val: `★ ${topRating.toFixed(1)}`, label: 'Rating', suffix: '' },
            { val: 'Free', label: 'Delivery', suffix: '' },
          ].map((s, i) => (
            <div key={i} className="text-center px-5 py-2.5 bg-white/6 rounded-2xl backdrop-blur-md min-w-[72px] border border-white/[0.06] animate-countUp"
              style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <div className="text-sm font-extrabold tracking-tight">{s.val}{s.suffix}</div>
              <div className="text-[7px] text-white/40 uppercase tracking-[0.15em] mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
