import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, stars, cn } from '@/lib/utils';
import { toast } from '@/components/Toast';
import type { Product } from '@/types';

let _openProduct: Product | null = null;
let _setProduct: ((p: Product | null) => void) | null = null;

export function showQuickView(product: Product) {
  _setProduct?.(product);
}

export default function QuickView() {
  const navigate = useNavigate();
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  _setProduct = setProduct;
  _openProduct = product;

  const close = useCallback(() => {
    sheetRef.current?.style.setProperty('transform', 'translateY(100%)');
    setTimeout(() => setProduct(null), 300);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) sheetRef.current?.style.setProperty('transform', `translateY(${diff}px)`);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - startY.current;
    if (diff > 80) close();
    else sheetRef.current?.style.setProperty('transform', 'translateY(0%)');
  };

  useEffect(() => {
    if (product) {
      setGalleryIdx(0);
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.image || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=📦'];

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-end justify-center bg-black/30 backdrop-blur-sm"
      style={{ display: product ? 'flex' : 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg bg-card rounded-3xl rounded-b-none overflow-y-auto max-h-[92vh] animate-slideUp shadow-2xl"
        style={{ animation: 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 bg-card pt-3 pb-1 flex flex-col items-center rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mb-2" />
          <button className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" onClick={close}>
            <X size={16} />
          </button>
        </div>

        {/* Image Gallery */}
        <div className="relative aspect-square bg-muted/20 overflow-hidden">
          <img
            src={images[galleryIdx]}
            alt={product.nameEn}
            className="w-full h-full object-cover transition-transform duration-300"
          />
          <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-0.5 rounded-full text-[10px]">
            {galleryIdx + 1}/{images.length}
          </div>
          {images.length > 1 && (
            <>
              <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow" onClick={() => setGalleryIdx(g => (g - 1 + images.length) % images.length)}><ChevronLeft size={18} /></button>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow" onClick={() => setGalleryIdx(g => (g + 1) % images.length)}><ChevronRight size={18} /></button>
            </>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[8px] font-bold text-white bg-gradient-to-r from-primary to-blue-600 shadow-lg">
              {badgeLabel(product.badge)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{product.nameEn}</p>
            </div>
            <button className="shrink-0 w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors" onClick={() => { toggleWishlist(product); toast(isInWishlist(product.id) ? '♡ Removed' : '❤️ Saved!', 'info'); }}>
              <span className={isInWishlist(product.id) ? 'animate-heartBeat' : ''}>{isInWishlist(product.id) ? '❤️' : '♡'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="stars text-amber-500">{stars(product.rating)}</span>
            <span>({product.reviews || 0})</span>
            <span>•</span>
            <span>🛍️ {product.soldCount || 0} sold</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <><span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                <span className="price-tag discount text-[11px]">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span></>
            )}
          </div>

          {product.descriptionEn && (
            <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">{product.descriptionEn}</p>
          )}

          {product.vendorName && (
            <div className="flex items-center gap-1 text-[10px] text-orange-600/70 bg-orange-50/50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full w-fit border border-orange-200/30">
              🏪 {product.vendorName}
            </div>
          )}

          {/* Qty + Add */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-card transition-colors" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={15} /></button>
              <span className="min-w-[28px] text-center font-bold text-sm">{qty}</span>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-card transition-colors" onClick={() => setQty(Math.min(product.stockCount, qty + 1))}><Plus size={15} /></button>
            </div>
            <button
              className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              onClick={() => {
                setIsAdding(true);
                addToCart(product, qty);
                toast(`🛒 ${product.nameEn} added!`, 'cart');
                setTimeout(() => { setIsAdding(false); close(); }, 400);
              }}
            >
              <ShoppingCart size={16} className={isAdding ? 'animate-cartBounce' : ''} />
              {isAdding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>

          {/* View full details */}
          <button
            className="w-full py-2.5 text-xs text-primary font-semibold text-center hover:bg-primary/5 rounded-xl transition-colors"
            onClick={() => { close(); setTimeout(() => navigate(`/product/${product.id}`), 300); }}
          >
            View Full Details →
          </button>
        </div>
      </div>
    </div>
  );
}

function badgeLabel(b: string) {
  const m: Record<string, string> = { sale: 'SALE', hot: 'HOT', new: 'NEW', 'best-seller': 'BEST SELLER', popular: 'POPULAR', premium: 'PREMIUM', 'big-deal': 'BIG DEAL', educational: 'EDUCATIONAL' };
  return m[b] || b;
}
