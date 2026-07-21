import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { Search, ShoppingCart, SlidersHorizontal, X, Heart, ChevronDown, Sparkles, Filter } from 'lucide-react';
import { toast } from '@/components/Toast';

const CATEGORIES = [
  { id: 'all', icon: '📋', label: 'All' }, { id: 'electronics', icon: '📱', label: 'Electronics' },
  { id: 'fashion', icon: '👗', label: 'Fashion' }, { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' }, { id: 'groceries', icon: '🍎', label: 'Groceries' },
  { id: 'books', icon: '📚', label: 'Books' }, { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

const SORTS = [
  { id: '', icon: '🔥', label: 'Best' }, { id: 'price_low', icon: '💰', label: 'Low' },
  { id: 'price_high', icon: '💰', label: 'High' }, { id: 'newest', icon: '🆕', label: 'New' },
];

export default function Shop() {
  const navigate = useNavigate();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let f = [...products];
    if (category !== 'all') f = f.filter(p => p.category === category);
    if (search.trim()) { const q = search.toLowerCase().trim(); f = f.filter(p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q)); }
    if (sort === 'price_low') f.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') f.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') f.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    else f.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    return f;
  }, [products, search, category, sort]);

  const handleAdd = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    setAddingId(p.id);
    addToCart(p);
    toast(`🛒 ${p.nameEn} added!`, 'cart');
    setTimeout(() => setAddingId(null), 500);
  };

  return (
    <div>
      {/* Sticky Search + Filters */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={`🔍 ${t('search', language)}...`}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground/60 shadow-sm"
              value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSearch('')}><X size={16} /></button>}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat.id} className={cn(
                'flex items-center gap-1 px-3.5 py-1.5 rounded-2xl text-[10px] font-medium whitespace-nowrap border transition-all flex-shrink-0',
                category === cat.id ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              )} onClick={() => setCategory(cat.id)}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <button className={cn('p-2 rounded-2xl border transition-all flex-shrink-0', showFilters ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted')}
            onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-2.5 animate-slideDown">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {SORTS.map(s => (
                <button key={s.id} className={cn(
                  'px-3.5 py-1.5 rounded-2xl text-[10px] font-medium border transition-all flex-shrink-0',
                  sort === s.id ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-card text-muted-foreground border-border hover:border-primary'
                )} onClick={() => setSort(s.id)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-medium">{filtered.length} {filtered.length === 1 ? 'product' : 'products'} found</span>
          <span className="text-[9px] text-muted-foreground/60">{category !== 'all' ? ` in ${category}` : ' • All categories'}</span>
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 px-4">
          <div className="text-5xl mb-4 opacity-30 animate-float">🔍</div>
          <h3 className="text-base font-semibold text-muted-foreground mb-1">No products found</h3>
          <p className="text-xs text-muted-foreground/60 mb-6">Try a different search or category</p>
          <button className="px-6 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            onClick={() => { setSearch(''); setCategory('all'); }}>
            <Sparkles size={14} className="inline mr-1.5" />Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 stagger">
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer card-glow group"
              onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}>
              <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
                <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                {p.badge && (
                  <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white z-10 shadow-lg',
                    p.badge === 'sale' ? 'bg-gradient-to-r from-red-600 to-red-500' : p.badge === 'hot' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : p.badge === 'new' ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-purple-600 to-violet-500')}>
                    {p.badge.toUpperCase()}
                  </span>
                )}
                {p.stockCount <= 0 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <span className="text-white text-xs font-extrabold bg-destructive px-3 py-1.5 rounded-lg shadow-lg">Sold Out</span>
                  </div>
                )}
                <button className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:scale-110 active:scale-90 transition-all"
                  onClick={e => { e.stopPropagation(); toggleWishlist(p); }}>
                  <span className={isInWishlist(p.id) ? 'text-red-500' : 'text-muted-foreground'}>{isInWishlist(p.id) ? '❤️' : '♡'}</span>
                </button>
              </div>
              <div className="p-3.5">
                <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]">{p.name}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{p.nameEn}</div>
                <div className="stars mt-1">{stars(p.rating)}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-base font-extrabold text-primary">{formatPrice(p.price)}</span>
                  {p.originalPrice && <><span className="text-[9px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>
                    <span className="price-tag discount">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span></>}
                </div>
                {p.vendorName && <div className="mt-1.5 flex items-center gap-1 text-[8px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full w-fit">🏪 {p.vendorName}</div>}
                <button
                  className={cn('w-full mt-2.5 py-2.5 rounded-xl text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 btn-ripple shadow-sm',
                    addingId === p.id ? 'bg-green-600 scale-95' : 'bg-primary hover:bg-primary/90 active:scale-95')}
                  onClick={e => handleAdd(e, p)}>
                  <ShoppingCart size={13} className={cn(addingId === p.id && 'animate-cartBounce')} />
                  {addingId === p.id ? '✓ Added!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
