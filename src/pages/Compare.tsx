import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, stars, cn } from '@/lib/utils';
import PriceDropAlert from '@/components/features/PriceDropAlert';
import { X, ShoppingCart, Heart, Star } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function Compare() {
  const navigate = useNavigate();
  const { compareList, products, toggleCompare, addToCart, toggleWishlist } = useStore();
  const items = compareList.map(id => products.find(p => p.id === id)).filter(Boolean) as any[];

  if (items.length < 2) {
    return (
      <div className="px-3 pt-3 pb-4 max-w-lg mx-auto text-center">
        <div className="text-5xl opacity-40 mb-3 py-8">⚖️</div>
        <h2 className="text-base font-bold mb-1">Compare Products</h2>
        <p className="text-xs text-muted-foreground mb-4">Add at least 2 products to compare</p>
        <p className="text-[10px] bg-muted rounded-xl p-3 max-w-xs mx-auto">
          💡 Long-press any product and select "Compare" to add it here
        </p>
        <button className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold" onClick={() => navigate('/shop')}>
          🛍️ Browse Products
        </button>
      </div>
    );
  }

  const specs = [
    { label: 'Price', render: (p: any) => (
      <div>
        <div className="font-bold text-primary">{formatPrice(p.price)}</div>
        {p.originalPrice && <div className="text-[9px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</div>}
        <PriceDropAlert productId={p.id} currentPrice={p.price} productName={p.nameEn} className="mt-1 px-2 py-0.5 text-[8px]" />
      </div>
    )},
    { label: 'Rating', render: (p: any) => (
      <div className="flex items-center gap-1">
        <span className="text-amber-500 text-sm">{stars(p.rating)}</span>
        <span className="text-xs font-semibold">{p.rating || 0}</span>
        <span className="text-[9px] text-muted-foreground">({p.reviews || 0})</span>
      </div>
    )},
    { label: 'Stock', render: (p: any) => (
      <span className={cn('text-[10px] font-semibold', p.inStock ? 'text-green-600' : 'text-red-500')}>
        {p.inStock ? `✅ ${p.stockCount} in stock` : '❌ Out of stock'}
      </span>
    )},
    { label: 'Sold', render: (p: any) => <span className="text-xs">{p.soldCount || 0}</span> },
    { label: 'Category', render: (p: any) => <span className="text-xs capitalize">{p.category}</span> },
    { label: 'Vendor', render: (p: any) => <span className="text-xs">{p.vendorName || 'Smart Shop'}</span> },
  ];

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">⚖️ Compare ({items.length})</h2>
        <button className="text-[9px] text-destructive px-2 py-1 rounded hover:bg-destructive/10" onClick={() => { items.forEach(p => toggleCompare(p.id)); }}>
          Clear All
        </button>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {items.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-2">
            <div className="relative">
              <img src={p.image} className="w-full h-28 object-cover rounded-lg cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
              <button className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center" onClick={() => toggleCompare(p.id)}>
                <X size={10} />
              </button>
            </div>
            <div className="text-[10px] font-semibold truncate mt-1">{p.nameEn}</div>
            <div className="flex items-center gap-1 mt-1">
              <button className="flex-1 py-1.5 bg-primary text-white rounded text-[8px] font-semibold flex items-center justify-center gap-0.5" onClick={() => { addToCart(p); toast('🛒 Added to cart!', 'cart'); }}>
                <ShoppingCart size={8} /> Add
              </button>
              <button className="p-1.5 rounded border border-border" onClick={() => { toggleWishlist(p); toast(p.nameEn + (useStore.getState().isInWishlist(p.id) ? ' added to wishlist' : ' removed from wishlist'), 'wish'); }}>
                <Heart size={10} className={useStore.getState().isInWishlist(p.id) ? 'text-red-500 fill-red-500' : ''} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Specs Comparison */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {specs.map((spec, i) => (
          <div key={i} className={cn('grid grid-cols-3 border-b border-border last:border-0', i % 2 === 0 ? 'bg-muted/30' : '')}>
            <div className="px-2.5 py-2 text-[10px] font-semibold text-muted-foreground border-r border-border">
              {spec.label}
            </div>
            {items.map(p => (
              <div key={p.id} className="px-2.5 py-2 border-r border-border last:border-0">
                {spec.render(p)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
