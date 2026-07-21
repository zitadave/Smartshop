import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { ShoppingCart, Heart, TrendingUp, Sparkles, Clock, Truck, Star, ChevronRight, Search } from 'lucide-react';
import { toast } from '@/components/Toast';

const CATEGORIES = [
  { id: 'all', icon: '📋', label: 'All' },
  { id: 'electronics', icon: '📱', label: 'Electronics' },
  { id: 'fashion', icon: '👗', label: 'Fashion' },
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' },
  { id: 'groceries', icon: '🍎', label: 'Groceries' },
  { id: 'books', icon: '📚', label: 'Books' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-3 px-3">
    {[1,2,3,4].map(i => (
      <div key={i} className="shimmer-card animate-fadeIn" style={{animationDelay: `${i*0.1}s`}}>
        <div className="shimmer-img" />
        <div className="shimmer-line" />
        <div className="shimmer-line s" />
        <div className="shimmer-line" style={{width:'40%',height:14,margin:'4px 10px'}} />
      </div>
    ))}
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView, recentViews } = useStore();
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(false);

  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10);
  const specialOffers = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 10);
  const recents = recentViews.slice(0, 8);

  // AI Recommendations
  const recommendations = products.filter(p => {
    const viewedIds = recentViews.map(v => v.id);
    const viewedCats = recentViews.map(v => v.category);
    return !viewedIds.includes(p.id) && viewedCats.includes(p.category);
  }).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addToCart(product);
    toast(`🛒 ${product.nameEn} added to cart!`, 'success');
  };

  return (
    <div className="pb-4 stagger">
      {/* HERO SECTION */}
      <section className="relative px-5 pt-8 pb-7 bg-gradient-to-br from-primary via-blue-700 to-indigo-900 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.03] animate-float" style={{animationDuration:'6s'}} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.02] animate-float" style={{animationDuration:'8s',animationDelay:'1s'}} />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-white/[0.01]" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-medium mb-4">
            <Sparkles size={12} />
            <span>Premium Marketplace</span>
          </div>
          <h2 className="text-2xl font-extrabold mb-1.5 tracking-tight">
            🏪 {t('welcome', language)}
          </h2>
          <p className="text-sm text-white/70 mb-5 max-w-xs mx-auto leading-relaxed">
            Discover premium products at unbeatable prices with fast delivery across Ethiopia
          </p>
          <button
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-2xl text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => navigate('/shop')}
          >
            🛍️ {t('shop', language)}
            <ChevronRight size={16} />
          </button>

          <div className="flex gap-3 mt-6 justify-center">
            {[
              { val: `${products.length}+`, label: 'Products' },
              { val: `⭐ ${(products.reduce((m, p) => Math.max(m, p.rating || 0), 0) || 4.9).toFixed(1)}`, label: 'Rating' },
              { val: 'FREE', label: 'Delivery' },
            ].map((s, i) => (
              <div key={i} className="text-center px-4 py-2 bg-white/8 rounded-xl backdrop-blur-sm min-w-[64px] animate-countUp" style={{animationDelay: `${i*0.15}s`}}>
                <div className="text-sm font-extrabold">{s.val}</div>
                <div className="text-[7px] text-white/50 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-medium whitespace-nowrap border transition-all duration-200 flex-shrink-0',
              activeCat === cat.id
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary hover:bg-primary/5'
            )}
            onClick={() => { setActiveCat(cat.id); navigate('/shop'); }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* AI RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="mt-2 animate-fadeUp">
          <div className="section-title-bar">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles size={14} className="text-primary" />
              </div>
              <span className="text-sm font-bold">Recommended For You</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {recommendations.map((p, i) => (
              <MiniProductCard key={p.id} product={p} index={i}
                onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}
                onAdd={(e) => handleAddToCart(e, p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* RECENTLY VIEWED */}
      {recents.length > 0 && (
        <div className="mt-2 animate-fadeUp">
          <div className="section-title-bar">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <Clock size={14} className="text-muted-foreground" />
              </div>
              <span className="text-sm font-bold">Recently Viewed</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {recents.map((p, i) => (
              <MiniProductCard key={p.id} product={p} index={i}
                onClick={() => navigate(`/product/${p.id}`)}
                onAdd={(e) => handleAddToCart(e, p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SPECIAL OFFERS */}
      {specialOffers.length > 0 && (
        <div className="mt-2 animate-fadeUp">
          <div className="section-title-bar">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <TrendingUp size={14} className="text-red-500" />
              </div>
              <span className="text-sm font-bold">🔥 Special Offers</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {specialOffers.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover-lift snap-start"
                onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}
                style={{animationDelay: `${i*0.08}s`}}
              >
                <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
                  <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                  {p.badge && (
                    <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg', badgeColor(p.badge))}>
                      {badgeLabel(p.badge)}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                    {p.originalPrice && (
                      <span className="price-tag discount">-{Math.round((1-p.price/p.originalPrice)*100)}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEATURED PRODUCTS GRID */}
      <div className="mt-3 animate-fadeUp">
        <div className="section-title-bar">
          <div className="inline-flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Star size={14} className="text-amber-500" />
            </div>
            <span className="text-sm font-bold">⭐ Featured Products</span>
          </div>
        </div>
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-2 gap-3 px-4 stagger">
            {topProducts.map(p => (
              <ProductCard key={p.id} product={p}
                onAddToCart={(e) => handleAddToCart(e, p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MINI PRODUCT CARD (Horizontal Scroll) =====
function MiniProductCard({ product, onClick, onAdd, index = 0 }: { product: any; onClick: () => void; onAdd: (e: React.MouseEvent) => void; index?: number }) {
  const { isInWishlist, toggleWishlist } = useStore();
  const wis = isInWishlist(product.id);

  return (
    <div className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover-lift snap-start animate-fadeUp"
      onClick={onClick} style={{animationDelay: `${index*0.06}s`}}>
      <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:scale-110 active:scale-90 transition-all"
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        >
          <span className={wis ? 'text-red-500' : 'text-muted-foreground'}>{wis ? '❤️' : '♡'}</span>
        </button>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold line-clamp-2 leading-snug min-h-[2em]">{product.name}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1">
          <span className="stars">{stars(product.rating)}</span>
          <span className="text-muted-foreground">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-base font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[9px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
        </div>
        <button
          className="w-full mt-2 py-2 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 btn-ripple shadow-sm"
          onClick={onAdd}
        >
          <ShoppingCart size={12} /> Add
        </button>
      </div>
    </div>
  );
}

// ===== PRODUCT CARD (Grid) =====
function ProductCard({ product, onAddToCart }: { product: any; onAddToCart: (e: React.MouseEvent) => void }) {
  const navigate = useNavigate();
  const { addRecentView, isInWishlist, toggleWishlist } = useStore();
  const wis = isInWishlist(product.id);

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer card-glow group"
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
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:scale-110 active:scale-90 transition-all"
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        >
          <span className={wis ? 'text-red-500' : 'text-muted-foreground'}>{wis ? '❤️' : '♡'}</span>
        </button>
      </div>
      <div className="p-3">
        <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2em]">{product.name}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1">
          <span className="stars">{stars(product.rating)}</span>
          <span className="text-muted-foreground">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-base font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <span className="text-[9px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              <span className="price-tag discount">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            </>
          )}
        </div>
        {product.vendorName && (
          <div className="mt-1.5 flex items-center gap-1 text-[8px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full w-fit">
            🏪 {product.vendorName}
          </div>
        )}
        <button
          className="w-full mt-2.5 py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 btn-ripple shadow-sm"
          onClick={onAddToCart}
        >
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function badgeColor(badge: string): string {
  const colors: Record<string, string> = {
    sale: 'bg-gradient-to-r from-red-600 to-red-500', hot: 'bg-gradient-to-r from-orange-500 to-amber-500',
    new: 'bg-gradient-to-r from-green-600 to-emerald-500', 'best-seller': 'bg-gradient-to-r from-purple-600 to-violet-500',
    popular: 'bg-gradient-to-r from-blue-600 to-blue-500', premium: 'bg-gradient-to-r from-slate-800 to-slate-700',
    'big-deal': 'bg-gradient-to-r from-red-700 to-red-600', educational: 'bg-gradient-to-r from-teal-600 to-teal-500',
  };
  return colors[badge] || 'bg-gradient-to-r from-red-600 to-red-500';
}

function badgeLabel(badge: string): string {
  const labels: Record<string, string> = {
    sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER',
    popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL',
  };
  return labels[badge] || badge;
}
