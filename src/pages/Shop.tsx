import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { Search, ShoppingCart } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', icon: '📋', label: 'All' },
  { id: 'electronics', icon: '📱', label: 'Electronics' },
  { id: 'fashion', icon: '👗', label: 'Fashion' },
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' },
  { id: 'groceries', icon: '🍎', label: 'Groceries' },
  { id: 'books', icon: '📚', label: 'Books' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

const SORTS = [
  { id: '', label: 'Best' },
  { id: 'price_low', label: 'Price: Low' },
  { id: 'price_high', label: 'Price: High' },
  { id: 'newest', label: 'Newest' },
];

export default function Shop() {
  const navigate = useNavigate();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('');

  const filtered = useMemo(() => {
    let f = [...products];
    if (category !== 'all') f = f.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      f = f.filter(p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
    }
    if (sort === 'price_low') f.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') f.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') f.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    else f.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    return f;
  }, [products, search, category, sort]);

  return (
    <div>
      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search', language)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap border transition-all',
              category === cat.id
                ? 'bg-primary text-white border-primary shadow'
                : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
            )}
            onClick={() => setCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + Results Count */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground">{filtered.length} Products</span>
        <div className="flex gap-1">
          {SORTS.map(s => (
            <button
              key={s.id}
              className={cn(
                'px-2.5 py-1 rounded-full text-[9px] font-medium border transition-all',
                sort === s.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border'
              )}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 px-3 pb-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16">
            <div className="text-4xl opacity-40 mb-2">🔍</div>
            <h3 className="text-sm font-semibold text-muted-foreground">No products found</h3>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-all active:scale-98 group" onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}>
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                {p.badge && (
                  <span className={cn(
                    'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-bold text-white z-10',
                    p.badge === 'sale' ? 'bg-destructive' : p.badge === 'hot' ? 'bg-orange-500' : p.badge === 'new' ? 'bg-green-600' : 'bg-purple-600'
                  )}>{p.badge.toUpperCase()}</span>
                )}
                {p.stockCount <= 0 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-10">
                    <span className="text-white text-[10px] font-bold bg-destructive px-2.5 py-1 rounded">Sold Out</span>
                  </div>
                )}
                <button className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-xs z-20 shadow hover:scale-105 transition-all" onClick={e => { e.stopPropagation(); toggleWishlist(p); }}>
                  <span className={isInWishlist(p.id) ? 'text-destructive' : 'text-muted-foreground'}>{isInWishlist(p.id) ? '❤️' : '♡'}</span>
                </button>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-semibold line-clamp-2 leading-tight">{p.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{p.nameEn}</div>
                <div className="text-[10px] text-amber-500 mt-0.5">{stars(p.rating)} ({p.reviews || 0})</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                  {p.originalPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                  {p.originalPrice && <span className="text-[8px] bg-destructive/10 text-destructive px-1 rounded font-semibold">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span>}
                </div>
                {p.vendorName && <div className="text-[8px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">🏪 {p.vendorName}</div>}
                <button className="w-full mt-2 py-2 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1" onClick={e => { e.stopPropagation(); addToCart(p); }}>
                  <ShoppingCart size={12} /> Add
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
