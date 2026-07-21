import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { ShoppingCart, Heart, Sparkles, Clock, TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';
import { toast } from '@/components/Toast';

const CATEGORIES = [
  { id: 'all', icon: '📋', label: 'All' }, { id: 'electronics', icon: '📱', label: 'Electronics' },
  { id: 'fashion', icon: '👗', label: 'Fashion' }, { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' }, { id: 'groceries', icon: '🍎', label: 'Groceries' },
  { id: 'books', icon: '📚', label: 'Books' }, { id: 'baby', icon: '👶', label: 'Baby' },
];

export default function Home() {
  const navigate = useNavigate();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView, recentViews } = useStore();
  const [activeCat, setActiveCat] = useState('all');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [wishAnimId, setWishAnimId] = useState<number | null>(null);

  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8);
  const specialOffers = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 8);
  const recents = recentViews.slice(0, 8);
  const recommendations = products.filter(p => {
    const viewedIds = recentViews.map(v => v.id);
    const viewedCats = recentViews.map(v => v.category);
    return !viewedIds.includes(p.id) && viewedCats.includes(p.category);
  }).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setAddingId(product.id);
    addToCart(product);
    toast(`🛒 ${product.nameEn} added!`, 'cart');
    setTimeout(() => setAddingId(null), 500);
  };

  const handleWishlist = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setWishAnimId(product.id);
    toggleWishlist(product);
    toast(isInWishlist(product.id) ? `♡ Removed from wishlist` : `❤️ Added to wishlist`, 'wish');
    setTimeout(() => setWishAnimId(null), 400);
  };

  const topSelling = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 4);

  return (
    <div className="pb-4">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-indigo-900 text-white px-5 pt-10 pb-8">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.03] animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/[0.02] animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/3 w-16 h-16 rounded-full bg-white/[0.015] animate-float" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium mb-4 animate-fadeUp">
            <Sparkles size={12} /> Premium Ethiopian Marketplace
          </div>
          <h2 className="text-2xl font-extrabold mb-1 tracking-tight animate-fadeUp delay-1">🏪 {t('welcome', language)}</h2>
          <p className="text-sm text-white/70 mb-6 max-w-xs mx-auto leading-relaxed animate-fadeUp delay-2">
            Discover curated products at exclusive prices with fast delivery across Ethiopia
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-2xl text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 animate-fadeUp delay-3"
            onClick={() => navigate('/shop')}>
            🛍️ {t('shop', language)} <ChevronRight size={16} />
          </button>
          <div className="flex gap-3 mt-6 justify-center animate-fadeUp delay-4">
            {[
              { val: `${products.length}+`, label: 'Products', color: '' },
              { val: `⭐${(products.reduce((m, p) => Math.max(m, p.rating || 0), 0) || 4.9).toFixed(1)}`, label: 'Rating', color: '' },
              { val: 'FREE', label: 'Delivery', color: 'text-green-300' },
            ].map((s, i) => (
              <div key={i} className="text-center px-4 py-2 bg-white/8 rounded-2xl backdrop-blur-sm min-w-[68px] animate-countUp" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                <div className={`text-sm font-extrabold ${s.color}`}>{s.val}</div>
                <div className="text-[7px] text-white/50 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUICK STATS ROW ===== */}
      <div className="flex gap-2 px-4 -mt-4 mb-2 relative z-20 animate-fadeUp">
        {[
          { icon: '🛍️', label: 'Top Seller', val: topSelling[0]?.nameEn || `${products.length} Products`, color: 'from-amber-500 to-orange-600' },
          { icon: '🔥', label: 'Trending', val: `${specialOffers.length} Offers`, color: 'from-red-500 to-pink-600' },
        ].map((card, i) => (
          <div key={i} className={`flex-1 bg-gradient-to-br ${card.color} rounded-2xl p-3 text-white shadow-lg hover-lift cursor-pointer`}
            onClick={() => navigate('/shop')} style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
            <div className="text-lg mb-0.5">{card.icon}</div>
            <div className="text-[9px] text-white/70 font-medium">{card.label}</div>
            <div className="text-xs font-bold truncate mt-0.5">{card.val}</div>
          </div>
        ))}
      </div>

      {/* ===== CATEGORIES ===== */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none animate-fadeUp">
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap border transition-all duration-200 flex-shrink-0 hover-lift',
              activeCat === cat.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary hover:bg-primary/5'
            )}
            onClick={() => { setActiveCat(cat.id); navigate('/shop'); }}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* ===== AI RECOMMENDATIONS ===== */}
      {recommendations.length > 0 && (
        <div className="animate-fadeUp">
          <div className="section-title-bar">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold">🤖 Recommended For You</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {recommendations.map((p, i) => (
              <MiniCard key={p.id} product={p} index={i}
                onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}
                onAdd={(e) => handleAddToCart(e, p)}
                onWish={(e) => handleWishlist(e, p)}
                addingId={addingId} wishAnimId={wishAnimId} />
            ))}
          </div>
        </div>
      )}

      {/* ===== RECENTLY VIEWED ===== */}
      {recents.length > 0 && (
        <div className="animate-fadeUp">
          <div className="section-title-bar">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                <Clock size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold">🕐 Recently Viewed</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {recents.map((p, i) => (
              <MiniCard key={p.id} product={p} index={i}
                onClick={() => navigate(`/product/${p.id}`)}
                onAdd={(e) => handleAddToCart(e, p)}
                onWish={(e) => handleWishlist(e, p)}
                addingId={addingId} wishAnimId={wishAnimId} />
            ))}
          </div>
        </div>
      )}

      {/* ===== SPECIAL OFFERS ===== */}
      {specialOffers.length > 0 && (
        <div className="animate-fadeUp">
          <div className="section-title-bar">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold">🔥 Special Offers</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {specialOffers.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover-lift snap-start animate-fadeUp"
                onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
                  <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                  {p.badge && (
                    <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg', badgeColor(p.badge))}>
                      {badgeLabel(p.badge)}
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 bg-destructive text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-lg animate-pulse">
                    -{Math.round((1 - p.price / p.originalPrice!) * 100)}%
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FEATURED PRODUCTS GRID ===== */}
      <div className="mt-1 animate-fadeUp">
        <div className="section-title-bar">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm">
              <Star size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold">⭐ Featured Products</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 stagger">
          {topProducts.map(p => (
            <ProductCard key={p.id} product={p}
              onAdd={(e) => handleAddToCart(e, p)}
              onWish={(e) => handleWishlist(e, p)}
              addingId={addingId} wishAnimId={wishAnimId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ product, onClick, onAdd, onWish, index = 0, addingId, wishAnimId }: any) {
  const { isInWishlist } = useStore();
  const wis = isInWishlist(product.id);
  const isAdding = addingId === product.id;

  return (
    <div className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover-lift snap-start animate-scaleIn"
      onClick={onClick} style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        <button className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/60 backdrop-blur-sm flex items-center justify-center text-[11px] z-20 shadow-sm hover:bg-white/85 hover:scale-110 active:scale-90 transition-all"
          onClick={onWish}>
          <span className={cn('transition-all', isInWishlist(product.id) ? 'text-red-500' : 'text-gray-500', wishAnimId === product.id && 'animate-heartBeat')}>
            {isInWishlist(product.id) ? '❤️' : '♡'}
          </span>
        </button>
        <button
          className="absolute top-[2.35rem] right-2 w-7 h-7 rounded-lg bg-white/60 backdrop-blur-sm flex items-center justify-center text-[11px] z-20 shadow-sm hover:bg-white/85 hover:scale-110 active:scale-90 transition-all"
          onClick={onAdd}>
          <ShoppingCart size={12} className={isAdding ? 'animate-cartBounce text-green-600' : 'text-gray-500'} />
        </button>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="stars mt-1">{stars(product.rating)}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-base font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[9px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
        </div>

      </div>
    </div>
  );
}

function ProductCard({ product, onAdd, onWish, addingId, wishAnimId }: any) {
  const navigate = useNavigate();
  const { addRecentView, isInWishlist } = useStore();
  const isAdding = addingId === product.id;

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer card-glow group animate-scaleIn"
      onClick={() => { addRecentView(product); navigate(`/product/${product.id}`); }}>
      <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        {product.stockCount <= 0 && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="text-white text-xs font-extrabold bg-destructive px-3 py-1.5 rounded-lg shadow-lg">Sold Out</span>
          </div>
        )}
        <button className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/85 hover:scale-110 active:scale-90 transition-all" onClick={onWish}>
          <span className={cn('transition-all', isInWishlist(product.id) ? 'text-red-500' : 'text-gray-500', wishAnimId === product.id && 'animate-heartBeat')}>
            {isInWishlist(product.id) ? '❤️' : '♡'}
          </span>
        </button>
        <button
          className="absolute top-10 right-2 w-8 h-8 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/85 hover:scale-110 active:scale-90 transition-all"
          onClick={onAdd}>
          <ShoppingCart size={14} className={isAdding ? 'animate-cartBounce' : 'text-gray-500'} />
        </button>
      </div>
      <div className="p-3.5">
        <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="stars mt-1">{stars(product.rating)}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-base font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <><span className="text-[9px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              <span className="price-tag discount">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span></>
          )}
        </div>
        {product.vendorName && (
          <div className="mt-1.5 flex items-center gap-1 text-[8px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full w-fit">
            🏪 {product.vendorName}
          </div>
        )}

      </div>
    </div>
  );
}

function badgeColor(badge: string): string {
  const m: Record<string, string> = {
    sale: 'bg-gradient-to-r from-red-600 to-red-500', hot: 'bg-gradient-to-r from-orange-500 to-amber-500',
    new: 'bg-gradient-to-r from-green-600 to-emerald-500', 'best-seller': 'bg-gradient-to-r from-purple-600 to-violet-500',
    popular: 'bg-gradient-to-r from-blue-600 to-blue-500', premium: 'bg-gradient-to-r from-slate-800 to-slate-700',
    'big-deal': 'bg-gradient-to-r from-red-700 to-red-600', educational: 'bg-gradient-to-r from-teal-600 to-teal-500',
  }; return m[badge] || 'bg-gradient-to-r from-red-600 to-red-500';
}
function badgeLabel(badge: string): string {
  const m: Record<string, string> = {
    sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER',
    popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL',
  }; return m[badge] || badge;
}
