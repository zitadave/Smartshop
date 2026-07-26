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
import { Sparkles, Clock, Star, ChevronRight, Zap, Megaphone, TrendingUp, Package, ArrowRight } from 'lucide-react';
import { useButtonAnimation, useWishlistAnimation } from '@/hooks/useAnimations';
import { useCart } from '@/hooks/useCart';
import { productsApi } from '@/lib/api';
import type { Product, CategoryId } from '@/types';
import { toast } from '@/components/Toast';
import { getPlanPrice, getPlanCategoryColor, formatFrequency, calculateSavings, type SubscriptionPlan } from '@/lib/subscriptions';
import FlashDealTimer, { useFlashDeals } from '@/components/features/FlashDealTimer';
import BroadcastBanner from '@/components/features/BroadcastBanner';

/** Subscription Plans Section - static data, no API calls */
function SubscriptionSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  const SAMPLE_PLANS: SubscriptionPlan[] = [
    { id: 1, name: 'Fresh Cow Milk', nameAmharic: 'የከብት ወተት', emoji: '🥛', description: 'Fresh milk every morning', category: 'dairy', unit: '1', unitLabel: 'liter', dailyPrice: 60, weeklyPrice: 380, monthlyPrice: 1520, vendorName: 'Smart Shop', image: '', tags: ['popular', 'essential'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
    { id: 2, name: 'Brown Eggs (6pcs)', nameAmharic: 'እንቁላል (6ቱ)', emoji: '🥚', description: 'Farm-fresh eggs', category: 'dairy', unit: '6', unitLabel: 'pieces', dailyPrice: 0, weeklyPrice: 150, monthlyPrice: 560, vendorName: 'Smart Shop', image: '', tags: ['popular'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
    { id: 3, name: 'White Bread', nameAmharic: 'ነጭ ዳቦ', emoji: '🍞', description: 'Freshly baked bread', category: 'bakery', unit: '1', unitLabel: 'loaf', dailyPrice: 25, weeklyPrice: 160, monthlyPrice: 620, vendorName: 'Smart Shop', image: '', tags: ['essential'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
    { id: 4, name: 'Pure Water 5L', nameAmharic: 'ንጹህ ውሃ 5ሊ', emoji: '💧', description: 'Purified drinking water', category: 'drinks', unit: '1', unitLabel: 'bottle', dailyPrice: 40, weeklyPrice: 260, monthlyPrice: 1000, vendorName: 'Smart Shop', image: '', tags: ['essential'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
    { id: 5, name: 'Ethiopian Coffee 500g', nameAmharic: 'የኢትዮጵያ ቡና 500㎇', emoji: '☕', description: 'Premium coffee beans', category: 'groceries', unit: '500', unitLabel: 'gram', dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 800, vendorName: 'Smart Shop', image: '', tags: ['premium'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
    { id: 6, name: 'Pure Honey 500g', nameAmharic: 'ንጹህ ማር 500㎇', emoji: '🍯', description: 'Natural Ethiopian honey', category: 'groceries', unit: '500', unitLabel: 'gram', dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 1200, vendorName: 'Smart Shop', image: '', tags: ['premium'], isActive: true, minQuantity: 1, maxQuantity: 10, createdAt: '' },
  ];

  return (
    <section className="mt-4 animate-fadeUp">
      <SectionHeader
        icon={<Package size={15} className="text-white" />}
        title="📦 Daily Subscriptions"
        subtitle="Auto-delivery. Save up to 15%"
        gradient="from-blue-500 to-indigo-600"
        action={
          <button className="text-[10px] text-primary font-semibold flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => onNavigate('/subscription-shop')}>
            View All <ChevronRight size={12} />
          </button>
        }
      />
      <HorizontalScroll>
        {SAMPLE_PLANS.map((plan) => {
          const dailyPrice = plan.dailyPrice > 0 ? plan.dailyPrice : Math.round(plan.monthlyPrice / 30);
          const savings = plan.dailyPrice > 0 && plan.monthlyPrice > 0
            ? Math.round((1 - plan.monthlyPrice / (plan.dailyPrice * 30)) * 100)
            : 0;

          return (
            <div key={plan.id}
              className="flex-shrink-0 w-52 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => onNavigate('/subscription-shop?plan=' + plan.id)}>
              <div className={'bg-gradient-to-r ' + getPlanCategoryColor(plan.category) + ' p-4 text-white'}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{plan.emoji}</span>
                  {savings > 0 && (
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                      -{savings}%
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm mt-2">{plan.name}</h3>
                <p className="text-[10px] text-white/80 mt-0.5">{plan.description}</p>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">{plan.unit}{plan.unitLabel}</span>
                  {plan.tags.includes('popular') && <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">🔥 Popular</span>}
                  {plan.tags.includes('essential') && !plan.tags.includes('popular') && <span className="text-[9px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">⚡ Essential</span>}
                </div>
                <div className="space-y-1">
                  {plan.dailyPrice > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Daily</span>
                      <span className="font-bold text-slate-800">Br {plan.dailyPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {plan.weeklyPrice > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Weekly</span>
                      <span className="font-bold text-slate-800">Br {plan.weeklyPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {plan.monthlyPrice > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Monthly</span>
                      <span className="font-bold text-slate-800">Br {plan.monthlyPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('/subscription-shop?plan=' + plan.id); }}
                  className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1">
                  <Package size={12} /> Subscribe
                </button>
              </div>
            </div>
          );
        })}
      </HorizontalScroll>
    </section>
  );
}

/** Trending Products Section - shows sponsored/featured items *//** Trending Products Section - shows sponsored/featured items */
function TrendingSection({ products, settings, onAdd, onWish, btnAnim, wishAnim }: any) {
  const sponsoredIds = settings.sponsoredProducts || [];
  if (sponsoredIds.length === 0) return null;
  const trending = products.filter((p: any) => sponsoredIds.includes(p.id));
  if (trending.length === 0) return null;
  return (
    <section className="mt-2 animate-fadeUp">
      <SectionHeader
        icon={<TrendingUp size={15} className="text-white" />}
        title="🔥 Trending Products"
        subtitle="Most popular picks right now"
        gradient="from-rose-500 to-pink-600"
      />
      <HorizontalScroll>
        {trending.map((p: any) => (
          <div key={p.id} className="flex-shrink-0 w-44">
            <ProductCard product={p} variant="mini"
              onAdd={onAdd} onWish={onWish}
              addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
          </div>
        ))}
      </HorizontalScroll>
    </section>
  );
}

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

  const sponsoredCount = (settings.sponsoredProducts || []).filter((id: number) => products.some(p => p.id === id)).length;

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

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: String.fromCodePoint(128700), label: "Photo Studio", href: "/photo-studio" },
            { icon: String.fromCodePoint(129309), label: "Group Buy", href: "/shop" },
            { icon: String.fromCodePoint(128230), label: "My Subs", href: "/subscriptions" },
            { icon: String.fromCodePoint(127775), label: "Rewards", href: "/loyalty" },
          ].map((f, i) => (
            <button key={i} onClick={() => navigate(f.href)}
              className="bg-white rounded-xl p-3 shadow-sm text-center hover:shadow-md transition-all active:scale-95">
              <span className="text-xl block mb-1">{f.icon}</span>
              <span className="text-[10px] font-medium text-slate-700">{f.label}</span>
            </button>
          ))}
        </div>
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

      {/* Subscription Plans Section */}
      <SubscriptionSection onNavigate={navigate} />

      {/* Sponsored / Promoted Products */}
      <TrendingSection
        products={products}
        settings={settings}
        onAdd={handleAdd}
        onWish={handleWish}
        btnAnim={btnAnim}
        wishAnim={wishAnim}
      />

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
