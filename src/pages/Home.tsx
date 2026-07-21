import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { ShoppingCart, Heart, Sparkles, Clock, TrendingUp, Star, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import { toast } from '@/components/Toast';

const CATEGORIES = [
  { id: 'all', icon: '✨', label: 'All' }, { id: 'electronics', icon: '📱', label: 'Tech' },
  { id: 'fashion', icon: '👗', label: 'Fashion' }, { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' }, { id: 'groceries', icon: '🍎', label: 'Food' },
  { id: 'books', icon: '📚', label: 'Books' }, { id: 'baby', icon: '👶', label: 'Baby' },
];

export default function Home() {
  const navigate = useNavigate();
  const store = useStore();
  const { products, language, addToCart, addRecentView, recentViews } = store;
  const [addingId, setAddingId] = useState<number | null>(null);
  const [wishAnimId, setWishAnimId] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState('all');

  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8);
  const specialOffers = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 6);
  const recents = recentViews.slice(0, 8);

  const recommendations = products.filter(p => {
    const vids = recentViews.map(v => v.id);
    const vcats = recentViews.map(v => v.category);
    return !vids.includes(p.id) && vcats.includes(p.category);
  }).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);

  const handleAdd = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setAddingId(product.id);
    addToCart(product);
    toast(`🛒 ${product.nameEn} added`, 'success');
    setTimeout(() => setAddingId(null), 450);
  };

  const handleWish = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setWishAnimId(product.id);
    store.toggleWishlist(product);
    toast(store.isInWishlist(product.id) ? '❤️ Added to wishlist' : '♡ Removed', 'info');
    setTimeout(() => setWishAnimId(null), 400);
  };

  return (
    <div className="pb-6">
      {/* ===== PREMIUM HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1628] via-[#14213d] to-[#1a2d4f] text-white px-6 pt-12 pb-10">
        {/* Animated Orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/15 to-purple-400/10 animate-float" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-400/10 to-teal-400/10 animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/[0.02] animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />

        {/* Sparkle dots */}
        {[...Array(6)].map((_, i) => (
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

          {/* Premium Stats */}
          <div className="flex gap-4 mt-8 justify-center animate-fadeUp delay-4">
            {[
              { val: `${products.length}`, label: 'Products', suffix: '+' },
              { val: `★ ${(products.reduce((m, p) => Math.max(m, p.rating || 0), 0) || 4.9).toFixed(1)}`, label: 'Rating', suffix: '' },
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

      {/* ===== QUICK STAT CARDS ===== */}
      <div className="flex gap-3 px-4 -mt-5 mb-3 relative z-20">
        {[
          { icon: '🛍️', label: 'Best Seller', val: topProducts[0]?.nameEn || 'Loading...', gradient: 'from-amber-500 via-orange-500 to-red-500' },
          { icon: '🔥', label: 'On Sale', val: `${specialOffers.length} deals`, gradient: 'from-rose-500 via-pink-500 to-purple-500' },
        ].map((card, i) => (
          <div key={i}
            className={`flex-1 bg-gradient-to-br ${card.gradient} rounded-2xl p-4 text-white shadow-xl hover-lift cursor-pointer animate-scaleIn`}
            onClick={() => navigate('/shop')}
            style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
            <div className="text-xl mb-1 opacity-90">{card.icon}</div>
            <div className="text-[9px] text-white/60 font-medium uppercase tracking-wider">{card.label}</div>
            <div className="text-xs font-bold truncate mt-1 leading-tight">{card.val}</div>
          </div>
        ))}
      </div>

      {/* ===== CATEGORY PILLS ===== */}
      <div className="px-4 py-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap border transition-all duration-300 flex-shrink-0 snap-start hover-lift',
                activeCat === cat.id
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105'
                  : 'bg-card text-muted-foreground/70 border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
              )}
              onClick={() => { setActiveCat(cat.id); navigate('/shop'); }}>
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== AI RECOMMENDATIONS ===== */}
      {recommendations.length > 0 && (
        <div className="animate-fadeUp">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Curated For You</h3>
              <p className="text-[9px] text-muted-foreground/60">Personalized recommendations</p>
            </div>
            <button className="ml-auto text-[10px] text-primary font-semibold flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity" onClick={() => navigate('/shop')}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none snap-x">
            {recommendations.map((p, i) => (
              <ProductMiniCard key={p.id} product={p} index={i}
                onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}
                onAdd={(e) => handleAdd(e, p)}
                onWish={(e) => handleWish(e, p)}
                addingId={addingId} wishAnimId={wishAnimId} store={store} />
            ))}
          </div>
        </div>
      )}

      {/* ===== RECENTLY VIEWED ===== */}
      {recents.length > 0 && (
        <div className="animate-fadeUp">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
              <Clock size={15} className="text-white" />
            </div>
            <h3 className="text-sm font-bold">Recently Viewed</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-none snap-x">
            {recents.map((p, i) => (
              <ProductMiniCard key={p.id} product={p} index={i}
                onClick={() => navigate(`/product/${p.id}`)}
                onAdd={(e) => handleAdd(e, p)}
                onWish={(e) => handleWish(e, p)}
                addingId={addingId} wishAnimId={wishAnimId} store={store} />
            ))}
          </div>
        </div>
      )}

      {/* ===== FEATURED PRODUCTS GRID ===== */}
      <div className="mt-2 animate-fadeUp">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Star size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Featured Products</h3>
            <p className="text-[9px] text-muted-foreground/60">Top picks from our collection</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 stagger">
          {topProducts.map(p => (
            <ProductCard key={p.id} product={p}
              onAdd={(e) => handleAdd(e, p)}
              onWish={(e) => handleWish(e, p)}
              addingId={addingId} wishAnimId={wishAnimId} store={store} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductMiniCard({ product, onClick, onAdd, onWish, index = 0, addingId, wishAnimId, store }: any) {
  const isAdding = addingId === product.id;

  return (
    <div className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border/60 cursor-pointer hover-lift snap-start animate-scaleIn shadow-sm hover:shadow-xl"
      onClick={onClick} style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="relative aspect-square overflow-hidden bg-muted/30 img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[7px] font-bold text-white z-10 shadow-lg backdrop-blur-sm', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button className="w-7 h-7 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-[10px] z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200"
            onClick={onWish}>
            <span className={cn('transition-all', store.isInWishlist(product.id) ? 'text-red-500 animate-heartBeat' : 'text-gray-500', wishAnimId === product.id && 'animate-heartBeat')}>
              {store.isInWishlist(product.id) ? '❤️' : '♡'}
            </span>
          </button>
          <button className="w-7 h-7 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-[10px] z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200"
            onClick={onAdd}>
            <ShoppingCart size={11} className={isAdding ? 'animate-cartBounce text-green-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="text-[11px] font-semibold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
        <div className="text-[8px] text-muted-foreground/60 mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="stars text-[10px]">{stars(product.rating)}</span>
          <span className="text-[8px] text-muted-foreground/50">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-sm font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[8px] text-muted-foreground/50 line-through">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd, onWish, addingId, wishAnimId, store }: any) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/60 cursor-pointer card-glow group shadow-sm"
      onClick={() => { store.addRecentView(product); navigate(`/product/${product.id}`); }}>
      <div className="relative aspect-square overflow-hidden bg-muted/30 img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[7px] font-bold text-white z-10 shadow-lg', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        {product.stockCount <= 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="text-white text-[10px] font-extrabold bg-destructive/90 px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <button className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200" onClick={onWish}>
            <span className={cn('transition-all', store.isInWishlist(product.id) ? 'text-red-500' : 'text-gray-500', wishAnimId === product.id && 'animate-heartBeat')}>
              {store.isInWishlist(product.id) ? '❤️' : '♡'}
            </span>
          </button>
          <button className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200"
            onClick={onAdd}>
            <ShoppingCart size={13} className={addingId === product.id ? 'animate-cartBounce text-green-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>
      <div className="p-3.5">
        <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
        <div className="text-[8px] text-muted-foreground/60 mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="stars text-[10px]">{stars(product.rating)}</span>
          <span className="text-[8px] text-muted-foreground/50">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[15px] font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <><span className="text-[8px] text-muted-foreground/50 line-through">{formatPrice(product.originalPrice)}</span>
              <span className="price-tag discount">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span></>
          )}
        </div>
        {product.vendorName && (
          <div className="mt-2 flex items-center gap-1 text-[7px] text-orange-600/70 bg-orange-50/50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full w-fit border border-orange-200/30 dark:border-orange-800/30">
            🏪 {product.vendorName}
          </div>
        )}
      </div>
    </div>
  );
}

function badgeColor(badge: string): string {
  const m: Record<string, string> = {
    sale: 'bg-gradient-to-r from-red-500 to-rose-500', hot: 'bg-gradient-to-r from-orange-500 to-amber-500',
    new: 'bg-gradient-to-r from-emerald-500 to-green-500', 'best-seller': 'bg-gradient-to-r from-purple-500 to-violet-500',
    popular: 'bg-gradient-to-r from-blue-500 to-sky-500', premium: 'bg-gradient-to-r from-slate-700 to-slate-600',
    'big-deal': 'bg-gradient-to-r from-red-600 to-rose-600', educational: 'bg-gradient-to-r from-teal-500 to-emerald-500',
  }; return m[badge] || 'bg-gradient-to-r from-primary to-blue-600';
}
function badgeLabel(badge: string): string {
  const m: Record<string, string> = {
    sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER',
    popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL',
  }; return m[badge] || badge;
}
