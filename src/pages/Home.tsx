import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { ShoppingCart, Heart, TrendingUp, Sparkles, Clock, Truck, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'electronics', icon: '📱', label: 'Electronics' },
  { id: 'fashion', icon: '👗', label: 'Fashion' },
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' },
  { id: 'groceries', icon: '🍎', label: 'Groceries' },
  { id: 'books', icon: '📚', label: 'Books' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

export default function Home() {
  const navigate = useNavigate();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView, recentViews } = useStore();
  const [activeCat, setActiveCat] = useState('all');

  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10);
  const specialOffers = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 10);
  const recents = recentViews.slice(0, 8);

  // AI Recommendations
  const recommendations = products.filter(p => {
    const viewedIds = recentViews.map(v => v.id);
    const viewedCats = recentViews.map(v => v.category);
    return !viewedIds.includes(p.id) && viewedCats.includes(p.category);
  }).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="px-4 pt-6 pb-5 bg-gradient-to-br from-primary to-blue-900 text-white relative overflow-hidden">
        <div className="absolute top-[-40%] right-[-10%] w-64 h-64 rounded-full bg-white/3"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-white/2"></div>
        <div className="relative z-10 text-center">
          <h2 className="text-xl font-bold mb-1">🏪 {t('welcome', language)}</h2>
          <p className="text-sm opacity-75 mb-3">{t('appSub', language)}</p>
          <button className="px-7 py-2.5 bg-white text-primary rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95" onClick={() => navigate('/shop')}>
            🛍️ {t('shop', language)}
          </button>
          <div className="flex gap-2 mt-3 justify-center">
            {[
              { val: products.length + '+', label: 'Products' },
              { val: '⭐ ' + (Math.max(...products.map(p => p.rating || 0), 0) || 4.9).toFixed(1), label: 'Rating' },
              { val: 'FREE', label: 'Delivery' },
            ].map((s, i) => (
              <div key={i} className="text-center px-3 py-1.5 bg-white/8 rounded-lg backdrop-blur-sm min-w-[60px]">
                <div className="text-sm font-bold">{s.val}</div>
                <div className="text-[7px] opacity-60 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-border bg-card scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap border transition-all',
              activeCat === cat.id
                ? 'bg-primary text-white border-primary shadow'
                : 'bg-muted text-muted-foreground border-border hover:border-primary hover:text-primary'
            )}
            onClick={() => { setActiveCat(cat.id); navigate('/shop'); }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Section title="🤖 Recommended For You">
          <HorizontalScroll>
            {recommendations.map(p => (
              <MiniProductCard key={p.id} product={p} onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {/* Recently Viewed */}
      {recents.length > 0 && (
        <Section title="🕐 Recently Viewed">
          <HorizontalScroll>
            {recents.map(p => (
              <MiniProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {/* Special Offers */}
      {specialOffers.length > 0 && (
        <Section title="🔥 Special Offers">
          <HorizontalScroll>
            {specialOffers.map(p => (
              <div key={p.id} className="flex-shrink-0 w-44 bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all active:scale-97" onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  {p.badge && (
                    <span className={cn('absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-bold text-white z-10', badgeColor(p.badge))}>
                      {badgeLabel(p.badge)}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {/* Featured Products Grid */}
      <Section title="⭐ Featured Products">
        <div className="grid grid-cols-2 gap-3 px-3">
          {topProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="text-sm font-bold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-3 pb-2 scrollbar-none snap-x snap-mandatory">
      {children}
    </div>
  );
}

function MiniProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  return (
    <div className="flex-shrink-0 w-44 bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all active:scale-97 snap-start" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-bold text-white z-10', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-xs font-semibold line-clamp-2 leading-tight">{product.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{product.nameEn}</div>
        <div className="text-[10px] text-amber-500 mt-0.5">{stars(product.rating)} ({product.reviews || 0})</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, addRecentView } = useStore();
  const wis = isInWishlist(product.id);
  const isFlash = false; // Will be loaded from settings

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all active:scale-98 group" onClick={() => { addRecentView(product); navigate(`/product/${product.id}`); }}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        {product.badge && (
          <span className={cn('absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-bold text-white z-10', badgeColor(product.badge))}>
            {badgeLabel(product.badge)}
          </span>
        )}
        {product.stockCount <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="text-white text-[10px] font-bold bg-destructive px-2.5 py-1 rounded">Sold Out</span>
          </div>
        )}
        <button
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-xs z-20 shadow hover:scale-105 transition-all"
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        >
          <span className={wis ? 'text-destructive' : 'text-muted-foreground'}>{wis ? '❤️' : '♡'}</span>
        </button>
      </div>
      <div className="p-2.5">
        <div className="text-xs font-semibold line-clamp-2 leading-tight">{product.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{product.nameEn}</div>
        <div className="text-[10px] text-amber-500 mt-0.5">{stars(product.rating)} ({product.reviews || 0})</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
          {product.originalPrice && (
            <span className="text-[8px] bg-destructive/10 text-destructive px-1 rounded font-semibold">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
        {product.vendorName && (
          <div className="text-[8px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
            🏪 {product.vendorName}
          </div>
        )}
        <button
          className="w-full mt-2 py-2 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1"
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
        >
          <ShoppingCart size={12} /> Add
        </button>
      </div>
    </div>
  );
}

function badgeColor(badge: string): string {
  const colors: Record<string, string> = {
    sale: 'bg-destructive', hot: 'bg-orange-500', new: 'bg-green-600',
    'best-seller': 'bg-purple-600', popular: 'bg-blue-600', premium: 'bg-slate-800',
    'big-deal': 'bg-red-700', educational: 'bg-teal-600',
  };
  return colors[badge] || 'bg-destructive';
}

function badgeLabel(badge: string): string {
  const labels: Record<string, string> = {
    sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER',
    popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL',
  };
  return labels[badge] || badge;
}
