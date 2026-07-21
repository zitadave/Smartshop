import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice } from '@/lib/utils';
import PriceDropAlert from '@/components/features/PriceDropAlert';
import { Heart, ShoppingCart, Share2, Trash2 } from 'lucide-react';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, language, toggleWishlist, addToCart } = useStore();

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">❤️ {t('wishlist', language)} ({wishlist.length})</h2>
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl opacity-40 mb-3">♡</div>
          <h3 className="text-sm font-semibold text-muted-foreground">{t('wishlistEmpty', language)}</h3>
          <button className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold" onClick={() => navigate('/shop')}>
            🛍️ {t('shop', language)}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {wishlist.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
              <div className="flex gap-3 p-3 cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                <img src={p.image} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{p.nameEn}</div>
                  <div className="text-[9px] text-muted-foreground truncate mt-0.5">{p.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.originalPrice && <span className="text-[9px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-amber-500 text-[9px]">{'★'.repeat(Math.round(p.rating || 0))}</span>
                    <span className="text-[8px] text-muted-foreground">({p.reviews || 0})</span>
                    <span className="text-[8px] bg-muted px-1 py-0.5 rounded">{p.soldCount || 0} sold</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-t border-border bg-muted/30">
                <div className="flex gap-1">
                  {/* Price Drop Alert */}
                  <PriceDropAlert productId={p.id} currentPrice={p.price} productName={p.nameEn} className="px-2 py-1 text-[8px]" />
                  {/* Stock indicator */}
                  {p.inStock ? (
                    <span className="text-[8px] text-green-600 bg-green-50 px-1.5 py-1 rounded flex items-center gap-0.5">
                      ✅ {p.stockCount}
                    </span>
                  ) : (
                    <span className="text-[8px] text-red-500 bg-red-50 px-1.5 py-1 rounded">❌ Out of stock</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors" onClick={(e) => { e.stopPropagation(); addToCart(p); toggleWishlist(p); navigate('/cart'); }}
                    title="Add to Cart">
                    <ShoppingCart size={12} />
                  </button>
                  <button className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                    title="Remove from Wishlist">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
