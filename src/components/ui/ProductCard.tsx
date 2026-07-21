import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, stars, cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import type { Product, BadgeType } from '@/types';
import { BADGE_COLORS, BADGE_LABELS } from '@/types';

interface ProductCardProps {
  product: Product;
  addingId?: number | null;
  wishAnimId?: number | null;
  onAdd: (e: React.MouseEvent, product: Product) => void;
  onWish: (e: React.MouseEvent, product: Product) => void;
  variant?: 'grid' | 'mini';
}

export const ProductCard = memo(function ProductCard({
  product,
  addingId,
  wishAnimId,
  onAdd,
  onWish,
  variant = 'grid',
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addRecentView, isInWishlist } = useStore();
  const isAdding = addingId === product.id;
  const isWishAnim = wishAnimId === product.id;

  const handleClick = useCallback(() => {
    addRecentView(product);
    navigate(`/product/${product.id}`);
  }, [addRecentView, navigate, product]);

  const badgeColor = BADGE_COLORS[product.badge as BadgeType] || BADGE_COLORS['sale'];
  const badgeLabel = BADGE_LABELS[product.badge as BadgeType] || product.badge;

  if (variant === 'mini') {
    return (
      <div
        className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden border border-border/60 cursor-pointer hover-lift snap-start animate-scaleIn shadow-sm hover:shadow-xl"
        onClick={handleClick}
      >
        <div className="relative aspect-square overflow-hidden bg-muted/30 img-zoom">
          <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
          {product.badge && (
            <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[7px] font-bold text-white z-10 shadow-lg backdrop-blur-sm bg-gradient-to-r ${badgeColor}`}>
              {badgeLabel}
            </span>
          )}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <WishButton isActive={isInWishlist(product.id)} isAnim={isWishAnim} onClick={(e) => onWish(e, product)} size="sm" />
            <CartButton isAdding={isAdding} onClick={(e) => onAdd(e, product)} size="sm" />
          </div>
        </div>
        <div className="p-3">
          <div className="text-[11px] font-semibold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
          <div className="text-[8px] text-muted-foreground/60 mt-0.5 line-clamp-1">{product.nameEn}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="stars text-[10px]">{stars(product.rating)}</span>
            <span className="text-[8px] text-muted-foreground/50">({product.reviews || 0})</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm font-extrabold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[8px] text-muted-foreground/50 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/60 cursor-pointer card-glow group shadow-sm" onClick={handleClick}>
      <div className="relative aspect-square overflow-hidden bg-muted/30 img-zoom">
        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" loading="lazy" />
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[7px] font-bold text-white z-10 shadow-lg bg-gradient-to-r ${badgeColor}`}>
            {badgeLabel}
          </span>
        )}
        {product.stockCount <= 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="text-white text-[10px] font-extrabold bg-destructive/90 px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <WishButton isActive={isInWishlist(product.id)} isAnim={isWishAnim} onClick={(e) => onWish(e, product)} size="md" />
          <CartButton isAdding={isAdding} onClick={(e) => onAdd(e, product)} size="md" />
        </div>
      </div>
      <div className="p-3.5">
        <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</div>
        <div className="text-[8px] text-muted-foreground/60 mt-0.5 line-clamp-1">{product.nameEn}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="stars text-[10px]">{stars(product.rating)}</span>
          <span className="text-[8px] text-muted-foreground/50">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[15px] font-extrabold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <span className="text-[8px] text-muted-foreground/50 line-through">{formatPrice(product.originalPrice)}</span>
              <span className="price-tag discount">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
            </>
          )}
        </div>
        {product.vendorName && (
          <div className="mt-2 flex items-center gap-1 text-[7px] text-orange-600/70 bg-orange-50/50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full w-fit border border-orange-200/30 dark:border-orange-800/30">
            🏪 {product.vendorName}
          </div>
        )}
      </div>
    </div>
  );
});

interface WishButtonProps {
  isActive: boolean;
  isAnim: boolean;
  onClick: (e: React.MouseEvent) => void;
  size: 'sm' | 'md';
}

const WishButton = memo(function WishButton({ isActive, isAnim, onClick, size }: WishButtonProps) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <button
      className={`${dim} rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200`}
      onClick={onClick}
      aria-label={isActive ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <span className={`transition-all ${isActive ? 'text-red-500' : 'text-gray-500'} ${isAnim ? 'animate-heartBeat' : ''}`}>
        {isActive ? '❤️' : '♡'}
      </span>
    </button>
  );
});

interface CartButtonProps {
  isAdding: boolean;
  onClick: (e: React.MouseEvent) => void;
  size: 'sm' | 'md';
}

const CartButton = memo(function CartButton({ isAdding, onClick, size }: CartButtonProps) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <button
      className={`${dim} rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200`}
      onClick={onClick}
      aria-label="Add to cart"
    >
      <ShoppingCart size={size === 'sm' ? 11 : 13} className={isAdding ? 'animate-cartBounce text-green-600' : 'text-gray-500'} />
    </button>
  );
});
