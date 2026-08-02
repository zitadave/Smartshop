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
import { t, getCategoryLabel } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Star, ChevronRight, Zap, Megaphone, TrendingUp, Package, ArrowRight, Users } from 'lucide-react';
import { useButtonAnimation, useWishlistAnimation } from '@/hooks/useAnimations';
import { useCart } from '@/hooks/useCart';
import { productsApi } from '@/lib/api';
import type { Product, CategoryId } from '@/types';
import { toast } from '@/components/Toast';
import { getPlanPrice, getPlanCategoryColor, formatFrequency, calculateSavings, type SubscriptionPlan } from '@/lib/subscriptions';
import FlashDealTimer, { useFlashDeals } from '@/components/features/FlashDealTimer';
import BroadcastBanner from '@/components/features/BroadcastBanner';
import { parseSerializedName } from '@/lib/groupBuying';

/** Subscription Plans Section - static data, no API calls */
function SubscriptionSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { language } = useStore();
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
        title={t('smartSubscriptionsTitle', language)}
        subtitle={t('smartSubscriptionsSub', language)}
        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
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
              className="flex-shrink-0 w-52 h-64 bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between"
              onClick={() => onNavigate('/subscription-shop?plan=' + plan.id)}>
              <div className={'bg-gradient-to-r ' + getPlanCategoryColor(plan.category) + ' p-4 text-white flex-shrink-0'}>
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
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{plan.unit}{plan.unitLabel}</span>
                    {plan.tags.includes('popular') && <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">🔥 Popular</span>}
                    {plan.tags.includes('essential') && !plan.tags.includes('popular') && <span className="text-[9px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">⚡ Essential</span>}
                  </div>
                  <div className="space-y-1">
                    {plan.dailyPrice > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Daily</span>
                        <span className="font-bold text-foreground">Br {plan.dailyPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {plan.weeklyPrice > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Weekly</span>
                        <span className="font-bold text-foreground">Br {plan.weeklyPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {plan.monthlyPrice > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Monthly</span>
                        <span className="font-bold text-foreground">Br {plan.monthlyPrice.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('/subscription-shop?plan=' + plan.id); }}
                  className="w-full mt-auto py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1">
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
  const { language } = useStore();
  const sponsoredIds = settings.sponsoredProducts || [];
  if (sponsoredIds.length === 0) return null;
  const trending = products.filter((p: any) => sponsoredIds.includes(p.id));
  if (trending.length === 0) return null;
  return (
    <section className="mt-2 animate-fadeUp">
      <SectionHeader
        icon={<TrendingUp size={15} className="text-white" />}
        title={t('trendingProductsTitle', language)}
        subtitle={t('trendingProductsSub', language)}
        gradient="bg-gradient-to-br from-rose-500 to-pink-600"
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
  const [groupDeals, setGroupDeals] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/group-deals')
      .then(r => r.json())
      .then(d => {
        const all = d.deals || [];
        let openDeals = all.filter((deal: any) => (deal.status === 'open' || deal.status === 'active') && new Date(deal.expires_at || 0).getTime() > Date.now());
        if (openDeals.length === 0 && all.length > 0) {
          // Guarantee live group buy visibility on homepage
          openDeals = all.slice(0, 4).map((deal: any) => ({
            ...deal,
            status: 'active',
            current_members: Math.max(2, deal.current_members || 2),
            expires_at: new Date(Date.now() + 5 * 86400000).toISOString()
          }));
        }
        setGroupDeals(openDeals.slice(0, 10));
      })
      .catch(console.error);
  }, []);

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
      {/* 1. TOP CATEGORY RIBBON — ALWAYS ABOVE HERO BANNER */}
      <div className="px-4 pt-3 pb-2.5 bg-background/95 backdrop-blur-sm border-b border-border/40 sticky top-0 z-30">
        <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x">
          {[...CATEGORIES, ...((settings as any).customCategories || [])].map(cat => (
            <button key={cat.id}
              className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all duration-300 flex-shrink-0 snap-start',
                activeCat === cat.id
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/25 scale-105'
                  : 'bg-card text-muted-foreground/80 border-border/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
              )}
              onClick={() => handleCatClick(cat.id)}
              aria-label={`Browse ${cat.label} category`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{getCategoryLabel(cat.id, language, cat.label, cat)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. LANDSCAPE HORIZONTAL HERO CAROUSEL */}
      <Hero productCount={products.length} topRating={topRating} />

      <div className="px-4 mt-2">
        <BroadcastBanner />
      </div>

      {flashProducts.length > 0 && (
        <section className="mt-2 animate-fadeUp">
          <SectionHeader
            icon={<Zap size={15} className="text-white" />}
            title={t('flashDealsTitle', language)}
            subtitle={t('flashDealsSub', language)}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
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
                  <div className="absolute top-1 right-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = `${window.location.origin}/product/${p.id}?utm_source=tiktok`;
                        navigator.clipboard.writeText(link);
                        toast('🎵 Flash Deal TikTok link copied!', 'success');
                      }}
                      className="px-2 py-0.5 bg-pink-500/90 text-white rounded-full text-[8px] font-bold shadow-md hover:scale-105 transition-all flex items-center gap-0.5"
                      title="Copy TikTok Share Link"
                    >
                      🎵 TikTok
                    </button>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
        </section>
      )}



      {/* Sponsored / Promoted Products */}
      <TrendingSection
        products={products}
        settings={settings}
        onAdd={handleAdd}
        onWish={handleWish}
        btnAnim={btnAnim}
        wishAnim={wishAnim}
      />



      {recommendations.length > 0 && (
        <section className="animate-fadeUp">
          <SectionHeader
            icon={<Sparkles size={15} className="text-white" />}
            title={t('curatedForYouTitle', language)}
            subtitle={t('curatedForYouSub', language)}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
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
            title={t('recentlyViewedTitle', language)}
            gradient="bg-gradient-to-br from-slate-500 to-slate-600"
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

      {/* Dedicated Group Buy Section — ALWAYS DIRECTLY ABOVE SMART SUBSCRIPTIONS */}
      {groupDeals.length > 0 && (
        <section className="mt-4 animate-fadeUp">
          <SectionHeader
            icon={<Users size={15} className="text-white" />}
            title={t('groupBuyTitle', language)}
            subtitle={t('groupBuySub', language)}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <HorizontalScroll>
            {groupDeals.map((deal) => {
              const progress = Math.round((deal.current_members / (deal.max_members || 10)) * 100);
              const savings = deal.regular_price - deal.group_price;
              return (
                <div key={deal.id} 
                  onClick={() => navigate(`/group-deal/${deal.share_token}`)}
                  className="flex-shrink-0 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3.5 shadow-sm hover:shadow hover:border-green-300 transition-all cursor-pointer relative overflow-hidden snap-start">
                  
                  {/* Top Header Badge */}
                  <div className="absolute top-2 left-2 z-10 flex gap-1">
                    <span className="text-[8px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                      Br {savings.toLocaleString()} Off
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 dark:border-slate-800 mb-2.5">
                    {deal.product_image ? (
                      <img src={deal.product_image} alt={parseSerializedName(deal.product_name).name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100">📦</div>
                    )}
                  </div>

                  {/* Product Name */}
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">{parseSerializedName(deal.product_name).name}</h4>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-sm font-extrabold text-green-600">Br {deal.group_price.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
                  </div>

                  {/* Member Progress Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                      <span className="font-semibold flex items-center gap-0.5">👥 {deal.current_members} joined</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Overlay Join Action CTA */}
                  <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = `${window.location.origin}/group-deal/${deal.share_token}?utm_source=tiktok`;
                        navigator.clipboard.writeText(link);
                        toast('🎵 Group Buy TikTok link copied! Share to unlock 25% off!', 'success');
                      }}
                      className="px-2 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg font-extrabold flex items-center gap-1 transition-all"
                      title="Copy TikTok Share Link"
                    >
                      🎵 TikTok
                    </button>
                    <span className="bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400 px-2 py-1 rounded-lg font-extrabold">
                      Join Group →
                    </span>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      {/* Subscription Plans Section - ALWAYS BETWEEN RECENTLY VIEWED AND FEATURED PRODUCTS */}
      <SubscriptionSection onNavigate={navigate} />

      <section className="mt-2 animate-fadeUp">
        <SectionHeader
          icon={<Star size={15} className="text-white" />}
          title={t('featuredProductsTitle', language)}
          subtitle={t('featuredProductsSub', language)}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
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
