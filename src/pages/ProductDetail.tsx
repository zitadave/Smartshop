import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, getDeliveryEstimate, cn, calcDiscount, isFlashDealActive } from '@/lib/utils';
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Store, Clock, Truck, TrendingDown, MessageCircle, Camera, Zap } from 'lucide-react';
import PhotoReviewSection from '@/components/features/PhotoReview';
import PriceDropAlert from '@/components/features/PriceDropAlert';
import PreOrderBadge from '@/components/features/PreOrderBadge';
import FlashDealTimer from '@/components/features/FlashDealTimer';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const product = store.products.find(p => p.id === Number(id));
  const { language, addToCart, toggleWishlist, isInWishlist, addRecentView, toggleFollowVendor, isFollowingVendor, togglePriceAlert, hasPriceAlert, settings } = store;

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

  useEffect(() => { addRecentView(product); }, []);

  const images = product.images?.length ? product.images : [product.image || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=📦'];
  const wis = isInWishlist(product.id);
  const following = product.vendorId ? isFollowingVendor(product.vendorId) : false;
  const tracking = hasPriceAlert(product.id);

  // Check if this product has a flash deal
  const flashDeal = settings.flashSales?.[String(product.id)];
  const isFlashProduct = flashDeal && isFlashDealActive(flashDeal);

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
          <span className={cn('absolute top-2 left-2 px-2 py-1 rounded text-[9px] font-bold text-white', product.badge ? `bg-gradient-to-r ${badgeCls(product.badge)}` : '')}>
            {badgeLbl(product.badge)}
          </span>
          {/* Flash deal badge */}
          {isFlashProduct && (
            <div className="absolute top-2 right-2">
              <FlashDealTimer
                endTime={flashDeal.end}
                discount={calcDiscount(product.originalPrice || product.price, product.price)}
                compact
              />
            </div>
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
                -{calcDiscount(product.originalPrice, product.price)}%
              </span>
            </>
          )}
        </div>

        {/* Price Drop Alert */}
        <div className="mt-2">
          <PriceDropAlert
            productId={product.id}
            currentPrice={product.price}
            productName={product.nameEn}
          />
        </div>

        {/* Pre-Order Section */}
        {product.isPreOrder && product.preOrderReleaseDate && (
          <PreOrderBadge
            productId={product.id}
            deposit={product.preOrderDeposit || Math.round(product.price * 0.3)}
            releaseDate={product.preOrderReleaseDate}
            maxOrders={product.preOrderMax || 100}
            currentOrders={product.preOrdered || 0}
            price={product.price}
            productName={product.nameEn}
          />
        )}

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
            <button className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5" onClick={() => { addToCart(product, qty); store.addNotification('🛒', `Added ${product.nameEn} to cart`); }}>
              <ShoppingCart size={16} /> {t('addToCart', language)}
            </button>
            <button className={cn('py-3 px-4 rounded-lg border text-sm transition-all', wis ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border text-muted-foreground hover:bg-muted')} onClick={() => toggleWishlist(product)}>
              {wis ? '❤️' : '♡'}
            </button>
            <button className="py-3 px-4 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-all" onClick={() => { const text = `Check out ${product.nameEn} at Smart Shop! ${formatPrice(product.price)}`; if (navigator.share) navigator.share({ title: product.nameEn, text }); else navigator.clipboard.writeText(text + ' ' + window.location.href); }}>
              <Share2 size={16} />
            </button>
          </div>
          <button className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow active:scale-95 transition-all" onClick={() => { addToCart(product, qty); navigate('/checkout'); }}>
            ⚡ Buy Now
          </button>
        </div>

        {/* Vendor */}
        {product.vendorId && (
          <div className="mt-3 bg-card rounded-xl border border-border p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/store/${product.vendorId}`)}>
            <Store size={20} className="text-primary" />
            <div className="flex-1">
              <div className="text-xs font-semibold">{product.vendorName}</div>
              <div className="text-[9px] text-muted-foreground">View store</div>
            </div>
            <button className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all', following ? 'bg-muted text-muted-foreground' : 'bg-primary text-white')} onClick={(e) => { e.stopPropagation(); toggleFollowVendor(product.vendorId!); }}>
              {following ? 'Following' : '+ Follow'}
            </button>
          </div>
        )}

        {/* Colors & Sizes */}
        {(product.colors?.length > 0 || product.sizes?.length > 0) && (
          <div className="mt-3 space-y-2">
            {product.colors?.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold">Colors:</span>
                <div className="flex gap-1.5 mt-1">
                  {product.colors.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            )}
            {product.sizes?.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold">Sizes:</span>
                <div className="flex gap-1.5 mt-1">
                  {product.sizes.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg border border-border text-[10px] cursor-pointer hover:border-primary hover:text-primary transition-colors">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Reviews */}
        <PhotoReviewSection productId={product.id} existingReviews={[]} />

        {/* Features */}
        {product.features?.length > 0 && (
          <div className="mt-3">
            <h3 className="text-[10px] font-semibold mb-1.5">✨ Features</h3>
            <div className="flex flex-wrap gap-1">
              {product.features.map((f, i) => (
                <span key={i} className="text-[9px] bg-muted px-2 py-1 rounded-full text-muted-foreground">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold mb-2">🔄 Related Products</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {related.map(p => (
                <div key={p.id} className="bg-card rounded-xl border border-border p-2 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} className="w-full h-24 object-cover rounded-lg mb-1.5" />
                  <div className="text-[10px] font-semibold truncate">{p.nameEn}</div>
                  <div className="text-[10px] font-bold text-primary">{formatPrice(p.price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function badgeCls(badge: string): string {
  const map: Record<string, string> = {
    sale: 'from-red-500 to-rose-500',
    hot: 'from-orange-500 to-amber-500',
    new: 'from-emerald-500 to-green-500',
    'best-seller': 'from-purple-500 to-violet-500',
    popular: 'from-blue-500 to-sky-500',
    premium: 'from-slate-700 to-slate-600',
    'big-deal': 'from-red-600 to-rose-600',
    educational: 'from-teal-500 to-emerald-500',
    'pre-order': 'from-blue-600 to-indigo-600',
  };
  return map[badge] || '';
}

function badgeLbl(badge: string): string {
  const map: Record<string, string> = {
    sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER',
    popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL',
    educational: 'EDUCATIONAL', 'pre-order': 'PRE-ORDER',
  };
  return map[badge] || badge;
}
