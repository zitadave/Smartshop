import { useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { ProductCard } from '@/components/ui/ProductCard';
import { useCart } from '@/hooks/useCart';
import { useButtonAnimation, useWishlistAnimation } from '@/hooks/useAnimations';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, Store, MapPin, Calendar, Share2, Users, Package, Star, TrendingUp } from 'lucide-react';
import { formatPrice, stars } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from '@/components/Toast';
import { haptic } from '@/lib/confetti';

export default function Storefront() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const { products, toggleWishlist, toggleFollowVendor, isFollowingVendor } = store;
  const cart = useCart();
  const btnAnim = useButtonAnimation();
  const wishAnim = useWishlistAnimation();
  const vid = Number(vendorId);

  const vendorProducts = useMemo(() => products.filter(p => p.vendorId === vid), [products, vid]);

  const vendorInfo = useMemo(() => {
    const p = products.find(pr => pr.vendorId === vid);
    if (!p) return { name: 'Unknown Shop', description: '', productCount: 0, totalSold: 0, avgRating: 0 };
    return {
      name: p.vendorName || 'Shop',
      description: p.description || '',
      productCount: vendorProducts.length,
      totalSold: vendorProducts.reduce((s, pr) => s + (pr.soldCount || 0), 0),
      avgRating: vendorProducts.length > 0
        ? vendorProducts.reduce((s, pr) => s + (pr.rating || 0), 0) / vendorProducts.length
        : 0,
    };
  }, [products, vid, vendorProducts]);

  const isFollowing = isFollowingVendor(vid);

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

  const handleFollow = () => {
    toggleFollowVendor(vid);
    toast(isFollowing ? 'Unfollowed' : `Following ${vendorInfo.name}!`, 'success');
    haptic('light');
  };

  if (!vid || vendorProducts.length === 0) {
    return (
      <EmptyState
        icon="🏪"
        title="Store not found"
        description="This vendor doesn't have any products yet"
        action={{ label: '← Browse Shop', onClick: () => navigate('/shop') }}
      />
    );
  }

  return (
    <div className="pb-8 animate-fadeUp">
      {/* Cover Header */}
      <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-900 text-white px-5 pt-14 pb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.03] animate-float" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/[0.02] animate-float" style={{ animationDelay: '1s' }} />
        
        <button className="relative z-10 mb-4 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
            🏪
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight">{vendorInfo.name}</h1>
            {vendorInfo.description && (
              <p className="text-xs text-white/60 mt-1 line-clamp-1">{vendorInfo.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50">
              <span className="flex items-center gap-1"><Package size={11} /> {vendorInfo.productCount} products</span>
              <span className="flex items-center gap-1"><Star size={11} /> {vendorInfo.avgRating.toFixed(1)}</span>
              <span className="flex items-center gap-1"><TrendingUp size={11} /> {vendorInfo.totalSold} sold</span>
            </div>
          </div>
          <button
            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              isFollowing ? 'bg-white/20 text-white' : 'bg-white text-primary hover:scale-105 active:scale-95'
            }`}
            onClick={handleFollow}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 -mt-4 relative z-20">
        <div className="bg-card rounded-2xl border border-border/60 p-3 shadow-sm flex justify-around">
          {[
            { icon: '🛍️', label: 'Products', val: vendorInfo.productCount },
            { icon: '📦', label: 'Sold', val: vendorInfo.totalSold },
            { icon: '⭐', label: 'Rating', val: vendorInfo.avgRating.toFixed(1) },
            { icon: '👥', label: 'Followers', val: isFollowing ? '1' : '0' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-lg">{s.icon}</div>
              <div className="text-sm font-extrabold text-primary">{s.val}</div>
              <div className="text-[8px] text-muted-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Package size={14} /> Products ({vendorInfo.productCount})
        </h3>
        {vendorProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground/60 text-xs">No products yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {vendorProducts.map(p => (
              <ProductCard key={p.id} product={p}
                onAdd={handleAdd} onWish={handleWish}
                addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
