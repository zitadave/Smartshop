import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, getDeliveryEstimate, cn } from '@/lib/utils';
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Store, Clock, Truck, TrendingDown, MessageCircle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const product = store.products.find(p => p.id === Number(id));
  const { language, addToCart, toggleWishlist, isInWishlist, addRecentView, toggleFollowVendor, isFollowingVendor, togglePriceAlert, hasPriceAlert } = store;

  const [qty, setQty] = useState(1);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (!product) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-sm font-semibold">Product not found</h3>
        <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => navigate('/shop')}>Back to Shop</button>
      </div>
    );
  }

  addRecentView(product);

  const images = product.images?.length ? product.images : [product.image || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=📦'];
  const wis = isInWishlist(product.id);
  const following = product.vendorId ? isFollowingVendor(product.vendorId) : false;
  const tracking = hasPriceAlert(product.id);

  const related = store.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 6);

  const alsoBought = store.products
    .filter(p => p.id !== product.id && Math.abs(p.price - product.price) < product.price * 0.5)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 4);

  return (
    <div className="pb-4 max-w-lg mx-auto">
      {/* Gallery */}
      <div className="relative bg-card">
        <div className="relative aspect-square max-h-[350px] overflow-hidden bg-muted">
          <img
            src={images[galleryIdx]}
            alt={product.nameEn}
            className={cn('w-full h-full object-cover transition-transform cursor-zoom-in', zoom && 'scale-150')}
            onClick={() => setZoom(!zoom)}
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px]">
            {galleryIdx + 1}/{images.length}
          </div>
          {images.length > 1 && (
            <>
              <button className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-lg shadow" onClick={() => setGalleryIdx(g => (g - 1 + images.length) % images.length)}>
                <ChevronLeft size={18} />
              </button>
              <button className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-lg shadow" onClick={() => setGalleryIdx(g => (g + 1) % images.length)}>
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {product.badge && (
            <span className={cn('absolute top-2 left-2 px-2 py-1 rounded text-[9px] font-bold text-white', badgeCls(product.badge))}>
              {badgeLbl(product.badge)}
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1.5 p-2 overflow-x-auto">
            {images.map((img, i) => (
              <img key={i} src={img} className={cn('w-10 h-10 rounded object-cover cursor-pointer border-2', i === galleryIdx ? 'border-primary opacity-100' : 'border-transparent opacity-50')} onClick={() => setGalleryIdx(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="text-[10px] text-muted-foreground mb-1">🏪 <span className="text-primary cursor-pointer" onClick={() => navigate('/shop')}>Shop</span> › {product.category}</div>
        <h1 className="text-lg font-bold leading-tight">{product.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{product.nameEn}</p>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
          <span className="text-amber-500 text-sm">{stars(product.rating)}</span>
          <strong>{product.rating || 0}</strong>
          <span className="text-muted-foreground">({product.reviews || 0} reviews)</span>
          <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full">🛍️ {product.soldCount > 999 ? (product.soldCount / 1000).toFixed(1) + 'k' : product.soldCount || 0} sold</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3 p-3 bg-gradient-to-r from-muted to-secondary rounded-xl">
          <span className="text-2xl font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {(product.description || product.descriptionEn) && (
          <div className="mt-3 p-3 bg-muted rounded-xl text-xs leading-relaxed text-muted-foreground">
            {product.description || product.descriptionEn}
          </div>
        )}

        {/* Stock */}
        <div className={cn('mt-3 p-2.5 rounded-lg text-xs', product.inStock && product.stockCount > 0 ? 'bg-green-50 dark:bg-green-950/20 text-green-700' : 'bg-red-50 dark:bg-red-950/20 text-destructive')}>
          {product.inStock && product.stockCount > 0 ? (
            <>✅ {t('inStock', language)} ({product.stockCount})<br /><span className="text-[9px] opacity-80">🚚 {getDeliveryEstimate()}</span></>
          ) : (
            <div className="flex items-center gap-2">
              <span>❌ {t('outOfStock', language)}</span>
              <button className="px-2.5 py-1 bg-primary text-white rounded text-[9px] font-semibold" onClick={() => { const c = prompt('Enter phone to get notified:'); if (c) { store.addNotification('🔔', 'Notify me when back: ' + product.nameEn); } }}>🔔 Notify</button>
            </div>
          )}
        </div>

        {/* Qty + Add to Cart */}
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1 w-fit">
            <button className="w-9 h-9 rounded-md text-lg font-semibold flex items-center justify-center hover:bg-card transition-colors" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
            <span className="min-w-[28px] text-center font-bold text-sm">{qty}</span>
            <button className="w-9 h-9 rounded-md text-lg font-semibold flex items-center justify-center hover:bg-card transition-colors" onClick={() => setQty(Math.min(product.stockCount, qty + 1))}><Plus size={16} /></button>
          </div>
          <div className="flex gap-1.5">
            <button className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5" onClick={() => { addToCart(product, qty); }}>
              <ShoppingCart size={16} /> {t('addToCart', language)}
            </button>
            <button className={cn('py-3 px-4 rounded-lg border text-sm transition-all', wis ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border text-muted-foreground hover:bg-muted')} onClick={() => toggleWishlist(product)}>
              {wis ? '❤️' : '♡'}
            </button>
            <button className="py-3 px-4 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-all" onClick={() => { const text = `Check out ${product.nameEn} at Smart Shop! ${formatPrice(product.price)}`; if (navigator.share) navigator.share({ title: product.nameEn, text }); else navigator.clipboard.writeText(text + ' ' + window.location.href); }}>
              <Share2 size={16} />
            </button>
          </div>
          {/* Express checkout */}
          <button className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow active:scale-95 transition-all" onClick={() => { addToCart(product, qty); navigate('/checkout'); }}>
            ⚡ {t('proceedCheckout', language)}
          </button>
          {/* Action buttons */}
          <div className="flex gap-1.5 mt-1">
            {product.vendorId && (
              <button className={cn('flex-1 py-2 rounded-lg border text-[10px] font-medium transition-all', following ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted')} onClick={() => toggleFollowVendor(product.vendorId!)}>
                🏪 {following ? t('unfollow', language) : t('follow', language)} Shop
              </button>
            )}
            <button className={cn('flex-1 py-2 rounded-lg border text-[10px] font-medium transition-all', tracking ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:bg-muted')} onClick={() => togglePriceAlert(product.id, product.price, product.nameEn)}>
              <TrendingDown size={12} className="inline mr-0.5" /> {tracking ? 'Tracking' : t('trackPrice', language)}
            </button>
            <button className="flex-1 py-2 rounded-lg border border-border text-[10px] text-muted-foreground hover:bg-muted transition-all" onClick={() => { const q = prompt('Ask a question about ' + product.nameEn + ':'); if (q) { store.addNotification('❓', 'Q: ' + q); } }}>
              <MessageCircle size={12} className="inline mr-0.5" /> {t('askQuestion', language)}
            </button>
          </div>
        </div>

        {/* Also Bought */}
        {alsoBought.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold mb-2">👥 Customers Also Bought</h3>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
              {alsoBought.map(p => (
                <div key={p.id} className="flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} alt={p.nameEn} className="w-full h-24 object-cover" loading="lazy" />
                  <div className="p-2">
                    <div className="text-[10px] font-semibold line-clamp-1">{p.name}</div>
                    <div className="text-xs font-bold text-primary">{formatPrice(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold mb-2">🔗 {t('recentlyViewed', language)}</h3>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
              {related.map(p => (
                <div key={p.id} className="flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} alt={p.nameEn} className="w-full h-24 object-cover" loading="lazy" />
                  <div className="p-2">
                    <div className="text-[10px] font-semibold line-clamp-1">{p.name}</div>
                    <div className="text-xs font-bold text-primary">{formatPrice(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function badgeCls(b: string): string {
  const m: Record<string, string> = { sale: 'bg-destructive', 'best-seller': 'bg-purple-600', new: 'bg-green-600', hot: 'bg-orange-500', popular: 'bg-blue-600', premium: 'bg-slate-800', 'big-deal': 'bg-red-700', educational: 'bg-teal-600' };
  return m[b] || 'bg-destructive';
}
function badgeLbl(b: string): string {
  const m: Record<string, string> = { sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER', popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL' };
  return m[b] || b;
}
