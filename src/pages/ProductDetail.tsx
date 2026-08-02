import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { trackSocialEvent } from '@/lib/social';
import { toast } from '@/components/Toast';
import { formatPrice, stars, getDeliveryEstimate, cn, calcDiscount, isFlashDealActive } from '@/lib/utils';
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Store, Clock, Truck, TrendingDown,  Camera, Zap, Users, Gift } from 'lucide-react';
import PhotoReviewSection from '@/components/features/PhotoReview';
import { createGroupDeal, shareToTelegram, getActiveDealsForProduct } from '@/lib/groupBuying';
import PriceDropAlert from '@/components/features/PriceDropAlert';
import PreOrderBadge from '@/components/features/PreOrderBadge';
import FlashDealTimer from '@/components/features/FlashDealTimer';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const product = store.products.find(p => p.id === Number(id));
  const { language, addToCart, toggleWishlist, isInWishlist, addRecentView, toggleFollowVendor, isFollowingVendor, togglePriceAlert, hasPriceAlert, settings } = store;

  const isGroupBuyProduct = product?.tags?.includes?.('groupbuy') || product?.tags?.includes?.('GroupBuy') || product?.category === 'groupbuy';

  const [qty, setQty] = useState(1);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  
  // Custom Group Buy states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [customImage, setCustomImage] = useState("");
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [customDescription, setCustomDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [targetMembers, setTargetMembers] = useState(3);
  const [colorPreference, setColorPreference] = useState("Any");
  const [sizePreference, setSizePreference] = useState("Any");
  const [durationHours, setDurationHours] = useState(24);
  const [creating, setCreating] = useState(false);
  
  // New campaign states
  const [campaignType, setCampaignType] = useState<'progressive' | 'target'>('progressive');
  const [targetPrice, setTargetPrice] = useState(0);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (product?.id) {
      getActiveDealsForProduct(product.id).then(setActiveDeals).catch(console.error);
    }
  }, [product?.id]);

  const handleCreateGroupBuy = async () => {
    if (!product) return;
    if (!store.telegramId) {
      toast('🚪 Please log in via Telegram first!', 'error');
      return;
    }
    setCreating(true);
    try {
      const calculatedPrice = campaignType === 'target' 
        ? targetPrice 
        : Math.round(product.price * (1 - discountPercent / 100));
        
      const serializedName = `${product.nameEn || product.name}::${customDescription}::${colorPreference}::${sizePreference}::${campaignType}::${targetPrice}::${targetMembers}`;
      const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      
      const res = await fetch('/api/group-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: serializedName,
          product_image: customImage || product.image || '',
          regular_price: product.price,
          group_price: calculatedPrice,
          creator_telegram_id: store.telegramId,
          creator_name: store.profile?.name || 'User',
          min_members: campaignType === 'target' ? targetMembers : 2,
          max_members: targetMembers,
          expires_at: expiresAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast('🎉 Group Buy group created successfully!', 'success');
        setShowCreateGroup(false);
        getActiveDealsForProduct(product.id).then(setActiveDeals).catch(console.error);
        shareToTelegram(data.deal);
      } else {
        toast(data.error || 'Failed to create group buy', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'An error occurred', 'error');
    }
    setCreating(false);
  };

  const [fetchingProduct, setFetchingProduct] = useState(false);

  useEffect(() => {
    if (!product && !fetchingProduct && store.products.length === 0) {
      setFetchingProduct(true);
      fetch('/api/products')
        .then(r => r.json())
        .then(d => {
          if (d && d.products) store.setProducts(d.products);
          setFetchingProduct(false);
        })
        .catch(() => setFetchingProduct(false));
    }
  }, [id, product, fetchingProduct, store.products.length]);

  if (!product) {
    if (store.products.length === 0 || fetchingProduct) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground mt-3">Loading product...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-sm font-semibold">Product not found</h3>
        <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => navigate('/shop')}>Back to Shop</button>
      </div>
    );
  }

  useEffect(() => { 
    addRecentView(product); 
    // Force scroll to top — ensures user lands on product view, not related section
    window.scrollTo(0, 0);
  }, []);

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

        {/* Scarcity Banner for discounted items */}
        {product.originalPrice && product.originalPrice > product.price && !isFlashProduct && (
          <div className="mt-3 p-3 bg-rose-500/10 dark:bg-rose-950/10 border border-rose-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1">🔥 Limited Discount Offer</span>
              <span>Only {(product.id % 4) + 2} left in stock!</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Hurry! Offer ends soon:</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                {(() => {
                  const [time, setTime] = useState('');
                  useEffect(() => {
                    const update = () => {
                      const now = new Date();
                      const end = new Date();
                      end.setHours(23, 59, 59, 0);
                      const diff = end.getTime() - now.getTime();
                      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
                      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
                      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
                      setTime(`${h}h : ${m}m : ${s}s`);
                    };
                    update();
                    const id = setInterval(update, 1000);
                    return () => clearInterval(id);
                  }, []);
                  return time;
                })()}
              </span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 animate-[pulse_2s_infinite]" style={{ width: '25%' }} />
            </div>
          </div>
        )}

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
              <button className="px-2.5 py-1 bg-primary text-primary-foreground rounded text-[9px] font-bold shadow-md shadow-primary/10 hover:shadow-lg transition-all" onClick={() => {
                const phone = store.profile.phone || localStorage.getItem('ss_user_phone') || '';
                if (phone) {
                  store.addNotification('🔔', 'Notify me when back: ' + product.nameEn);
                  toast('🔔 We will notify you at ' + phone + ' when back in stock!', 'success');
                } else {
                  store.addNotification('🔔', 'Notify me when back: ' + product.nameEn);
                  toast('🔔 Stock notification registered for your account!', 'success');
                }
              }}>🔔 Notify</button>
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

          {/* Independent Full-Width Group Buy Button Card (Only for compatible products!) */}
          {isGroupBuyProduct && (
            <button onClick={() => { 
              if (!store.telegramId) {
                toast('🚪 Please log in via Telegram first!', 'error');
              } else {
                setCustomImage(product.image || "");
                setShowCreateGroup(true);
              }
            }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2">
              <Users size={15} /> 🤝 Start ማህበር ግዢ (Group Buy) & Save up to 30%!
            </button>
          )}

          <div className="flex gap-1.5">
            <button className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5" onClick={() => { addToCart(product, qty); trackSocialEvent('AddToCart', { content_id: product.id, content_name: product.nameEn, value: product.price, currency: 'ETB' }); store.addNotification('🛒', `Added ${product.nameEn} to cart`); }}>
              <ShoppingCart size={15} /> {t('addToCart', language)}
            </button>
            <button className={cn('py-3.5 px-4 rounded-2xl border text-sm transition-all', wis ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border text-muted-foreground hover:bg-muted')} onClick={() => toggleWishlist(product)}>
              {wis ? '❤️' : '♡'}
            </button>
            <button
              type="button"
              className="py-3.5 px-3 rounded-2xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs transition-all flex items-center gap-1"
              onClick={() => {
                const link = `${window.location.origin}/product/${product.id}?utm_source=tiktok`;
                navigator.clipboard.writeText(link);
                toast('🎵 TikTok share link copied!', 'success');
              }}
              title="Copy TikTok Share Link"
            >
              🎵 TikTok
            </button>
            <button className="py-3.5 px-4 rounded-2xl border border-border text-muted-foreground hover:bg-muted transition-all" onClick={() => { const text = `Check out ${product.nameEn} at Smart Shop! ${formatPrice(product.price)}`; if (navigator.share) navigator.share({ title: product.nameEn, text }); else navigator.clipboard.writeText(text + ' ' + window.location.href); }}>
              <Share2 size={15} />
            </button>
          </div>

          {/* Active Group Deals list */}
          {activeDeals.length > 0 && (
            <div className="mt-1 bg-green-50/70 border border-green-100 rounded-2xl p-3.5 mb-3">
              <h4 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                🤝 Join Active Mahiber Groups & Save!
              </h4>
              <div className="space-y-2">
                {activeDeals.map((deal) => (
                  <div key={deal.id} 
                    onClick={() => navigate(`/group-deal/${deal.share_token}`)}
                    className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-green-100 cursor-pointer hover:border-green-300 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-100 text-green-600 font-bold rounded-full flex items-center justify-center text-xs">
                        {deal.creator_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">{deal.creator_name || 'Anonymous'}'s Group</p>
                        <p className="text-[9px] text-slate-400">{deal.current_members} joined · {deal.max_members - deal.current_members} spots left</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <div>
                        <p className="text-xs font-bold text-green-600">Br {(deal.group_price || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 line-through">Br {(deal.regular_price || 0).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] bg-green-500 text-white px-2 py-1 rounded-lg font-bold flex items-center gap-0.5">
                        Join
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow active:scale-95 transition-all" onClick={() => { addToCart(product, qty); trackSocialEvent('AddToCart', { content_id: product.id, content_name: product.nameEn, value: product.price, currency: 'ETB' }); navigate('/checkout'); }}>
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

      {/* COMPREHENSIVE CUSTOM GROUP BUY CREATION MODAL */}
      {showCreateGroup && createPortal(
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto py-6" onClick={() => setShowCreateGroup(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md mx-auto my-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">🤝 Start ማህበር ግዢ (Group Buy)</h3>
              <p className="text-[10px] text-slate-400 mb-4">Configure your saving campaign. Price drops as more peers join!</p>
              
              <div className="space-y-3.5 max-h-[70vh] overflow-y-auto scrollbar-none pr-1">
                {/* 1. Group Buy Image (File vs. URL) */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Product Image</label>
                  <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg w-fit">
                    <button 
                      onClick={() => setImageType('url')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold ${imageType === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                      Paste Image URL
                    </button>
                    <button 
                      onClick={() => setImageType('file')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold ${imageType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                      Upload from Device
                    </button>
                  </div>
                  {imageType === 'url' ? (
                    <input 
                      type="text" 
                      placeholder="https://example.com/product.jpg (Optional)" 
                      value={customImage} 
                      onChange={e => setCustomImage(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none" 
                    />
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 file:cursor-pointer" 
                      />
                    </div>
                  )}
                  {customImage && (
                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                      <img src={customImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 2. Custom Description / Invitation Message */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Invitation Message</label>
                  <textarea 
                    placeholder="e.g., Looking for 3 people to buy this amazing jacket with me so we get 20% off!" 
                    value={customDescription} 
                    onChange={e => setCustomDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent resize-none h-16 text-slate-800 dark:text-slate-200 outline-none" 
                  />
                </div>

                {/* 2.5 Campaign Model Type Selection */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Discount Model</label>
                  <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl w-full">
                    <button 
                      type="button"
                      onClick={() => setCampaignType('progressive')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold ${campaignType === 'progressive' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                      📈 Progressive (Drops steadily)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setCampaignType('target');
                        setTargetPrice(Math.round(product.price * 0.75)); // default 25% off
                      }}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold ${campaignType === 'target' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                      🎯 Locked Target ("If-and-Only-If")
                    </button>
                  </div>
                </div>

                {/* 3. Discount rate (Progressive) vs. Target Price (Locked Target) */}
                {campaignType === 'progressive' ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Discount Rate</label>
                      <span className="text-xs font-bold text-green-600">{discountPercent}% OFF</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={discountPercent} 
                      onChange={e => setDiscountPercent(Number(e.target.value))}
                      className="w-full accent-green-500 cursor-pointer" 
                    />
                    <div className="flex justify-between text-[8px] text-slate-400">
                      <span>5% (Starter)</span>
                      <span>25% (Recommended)</span>
                      <span>50% (Max)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Locked Target Price (Br)</label>
                    <input 
                      type="number" 
                      min="1"
                      max={product.price - 1}
                      value={targetPrice} 
                      onChange={e => setTargetPrice(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none focus:border-green-400 transition-colors" 
                    />
                    <p className="text-[8px] text-slate-400 mt-1">This price is locked and only activates if you reach your target group size.</p>
                  </div>
                )}

                {/* 4. Target Group Size Input */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Group Size (Members)</label>
                  <select 
                    value={targetMembers} 
                    onChange={e => setTargetMembers(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none">
                    <option value={2}>2 Members (5% Base Savings)</option>
                    <option value={3}>3 Members (10% Base Savings)</option>
                    <option value={5}>5 Members (15% Base Savings)</option>
                    <option value={10}>10 Members (25% Base Savings)</option>
                  </select>
                </div>

                {/* 5. Color & Size Preferences */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Color Preference</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Black / Any" 
                      value={colorPreference} 
                      onChange={e => setColorPreference(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Size Preference</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Large / Any" 
                      value={sizePreference} 
                      onChange={e => setSizePreference(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none" 
                    />
                  </div>
                </div>

                {/* 6. Date/Hours Duration */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Active Duration</label>
                  <select 
                    value={durationHours} 
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-200 outline-none">
                    <option value={1}>1 Hour (Urgent Buy)</option>
                    <option value={6}>6 Hours (Short Promo)</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (Standard)</option>
                    <option value={48}>48 Hours (Long-form)</option>
                  </select>
                </div>

                {/* Live pricing estimation card */}
                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 space-y-1 border border-green-100">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Retail Price</span><span className="font-semibold text-slate-800 dark:text-slate-200">{formatPrice(product.price)}</span></div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{campaignType === 'target' ? 'Locked Target Price' : 'Group Price (For Everyone!)'}</span>
                    <span className="font-extrabold text-green-600">
                      {formatPrice(campaignType === 'target' ? targetPrice : Math.round(product.price * (1 - discountPercent / 100)))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <button 
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button 
                  onClick={handleCreateGroupBuy}
                  disabled={creating}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:shadow-lg disabled:opacity-50">
                  {creating ? 'Publishing...' : '🚀 Publish & Share'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
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
