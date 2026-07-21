import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { Hero } from '@/components/ui/Hero';
import { ProductCard } from '@/components/ui/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { CardSkeleton } from '@/components/ui/Skeletons';
import { showQuickView } from '@/components/ui/QuickView';
import { CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Star, ChevronRight, Zap, Megaphone } from 'lucide-react';
import { useButtonAnimation, useWishlistAnimation } from '@/hooks/useAnimations';
import { useCart } from '@/hooks/useCart';
import { productsApi } from '@/lib/api';
import type { Product, CategoryId } from '@/types';
import { toast } from '@/components/Toast';
import FlashDealTimer, { useFlashDeals } from '@/components/features/FlashDealTimer';
import BroadcastBanner from '@/components/features/BroadcastBanner';

export default function Home() {
  const navigate = useNavigate();
  const store = useStore();
  const { products, language, addRecentView, recentViews, isInWishlist, toggleWishlist, settings } = store;
  const cart = useCart();
  const btnAnim = useButtonAnimation();
  const wishAnim = useWishlistAnimation();
  const [activeCat, setActiveCat] = useState<CategoryId>('all');

  const activeDeals = useFlashDeals(settings);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8),
    [products]
  );

  const specialOffers = useMemo(
    () => products.filter(p => p.originalPrice != null && p.originalPrice > p.price).slice(0, 6),
    [products]
  );

  const topRating = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.rating || 0), 0) || 4.9,
    [products]
  );

  const recents = recentViews.slice(0, 8);

  const recommendations = useMemo(() => {
    const vids = new Set(recentViews.map(v => v.id));
    const vcats = new Set(recentViews.map(v => v.category));
    return products
      .filter(p => !vids.has(p.id) && vcats.has(p.category))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [products, recentViews]);

  const flashProducts = useMemo(() => {
    const dealProductIds = new Set(activeDeals.map(d => d.productId));
    return products.filter(p => dealProductIds.has(p.id));
  }, [products, activeDeals]);

  const handleAdd = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    btnAnim.trigger(product.id);
    cart.add(product);
  }, [btnAnim, cart]);

  const handleWish = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    wishAnim.trigger(product.id);
    toggleWishlist(product);
  }, [wishAnim, toggleWishlist]);

  const handleCatClick = useCallback((id: CategoryId) => {
    setActiveCat(id);
    navigate('/shop');
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    try {
      const d = await productsApi.list();
      if (d?.products) { store.setProducts(d.products); toast('✨ Products refreshed!', 'success'); }
    } catch { toast('Refresh failed', 'error'); }
  }, []);

  return (
    <div className="pb-6">
      <PullToRefresh onRefresh={handleRefresh}>
      <Hero productCount={products.length} topRating={topRating} />

      <div className="px-4 mt-2">
        <BroadcastBanner />
      </div>

      {flashProducts.length > 0 && (
        <section className="mt-2 animate-fadeUp">
          <SectionHeader
            icon={<Zap size={15} className="text-white" />}
            title="⚡ Flash Deals"
            subtitle="Limited time offers - Hurry!"
            gradient="from-orange-500 to-red-600"
          />
          <HorizontalScroll>
            {flashProducts.map((p) => {
              const deal = activeDeals.find(d => d.productId === p.id);
              return (
                <div key={p.id} className="relative flex-shrink-0 w-48">
                  <ProductCard product={p} variant="mini"
                    onAdd={handleAdd} onWish={handleWish}
                    addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
                  <div className="absolute top-1 left-1 z-10">
                    <FlashDealTimer endTime={deal?.endTime || 0} discount={deal?.discount} compact />
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      <div className="flex gap-3 px-4 -mt-5 mb-3 relative z-20">
        {[
          { icon: '🛍️', label: 'Best Seller', val: topProducts[0]?.nameEn || 'Loading...', gradient: 'from-amber-500 via-orange-500 to-red-500' },
          { icon: '🔥', label: 'On Sale', val: `${specialOffers.length} deals`, gradient: 'from-rose-500 via-pink-500 to-purple-500' },
        ].map((card, i) => (
          <div key={i}
            className={`flex-1 bg-gradient-to-br ${card.gradient} rounded-2xl p-4 text-white shadow-xl hover-lift cursor-pointer animate-scaleIn`}
            onClick={() => navigate('/shop')}
            style={{ animationDelay: `${0.3 + i * 0.12}s` }}
            role="button" tabIndex={0}
          >
            <div className="text-xl mb-1 opacity-90">{card.icon}</div>
            <div className="text-[9px] text-white/60 font-medium uppercase tracking-wider">{card.label}</div>
            <div className="text-xs font-bold truncate mt-1 leading-tight">{card.val}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x">
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap border transition-all duration-300 flex-shrink-0 snap-start hover-lift',
                activeCat === cat.id
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105'
                  : 'bg-card text-muted-foreground/70 border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
              )}
              onClick={() => handleCatClick(cat.id)}
              aria-label={`Browse ${cat.label} category`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="animate-fadeUp">
          <SectionHeader
            icon={<Sparkles size={15} className="text-white" />}
            title="Curated For You"
            subtitle="Personalized recommendations"
            gradient="from-violet-500 to-purple-600"
            action={
              <button className="text-[10px] text-primary font-semibold flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => navigate('/shop')}>
                View All <ChevronRight size={12} />
              </button>
            }
          />
          <HorizontalScroll>
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} variant="mini"
                onAdd={handleAdd} onWish={handleWish}
                addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {recents.length > 0 && (
        <section className="animate-fadeUp">
          <SectionHeader
            icon={<Clock size={15} className="text-white" />}
            title="Recently Viewed"
            gradient="from-slate-500 to-slate-600"
          />
          <HorizontalScroll>
            {recents.map((p) => (
              <ProductCard key={p.id} product={p} variant="mini"
                onAdd={handleAdd} onWish={handleWish}
                addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      <section className="mt-2 animate-fadeUp">
        <SectionHeader
          icon={<Star size={15} className="text-white" />}
          title="Featured Products"
          subtitle="Top picks from our collection"
          gradient="from-amber-500 to-orange-600"
        />
        <div className="grid grid-cols-2 gap-3 px-4 stagger">
          {topProducts.map(p => (
            <ProductCard key={p.id} product={p}
              onAdd={handleAdd} onWish={handleWish}
              addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
          ))}
        </div>
      </section>
      </PullToRefresh>
    </div>
  );
}
