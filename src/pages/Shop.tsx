import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, stars, cn } from '@/lib/utils';
import { Search, ShoppingCart, SlidersHorizontal, X, Heart, ChevronDown, Sparkles, Filter, ArrowUp } from 'lucide-react';
import { toast } from '@/components/Toast';

const CATEGORIES = [
  { id: 'all', icon: '✨', label: 'All' }, { id: 'electronics', icon: '📱', label: 'Tech' },
  { id: 'fashion', icon: '👗', label: 'Fashion' }, { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' }, { id: 'groceries', icon: '🍎', label: 'Food' },
  { id: 'books', icon: '📚', label: 'Books' }, { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

const SORTS = [
  { id: '', icon: '🔥', label: 'Best' }, { id: 'price_low', icon: '💵', label: 'Low→High' },
  { id: 'price_high', icon: '💰', label: 'High→Low' }, { id: 'newest', icon: '✨', label: 'Newest' },
];

export default function Shop() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const { products, language, addToCart, toggleWishlist, isInWishlist, addRecentView } = store;
  const initialSearch = (location.state as any)?.search || '';
  const [search, setSearch] = useState(initialSearch);
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
    toast(`🛒 ${p.nameEn} added`, 'success');
    setTimeout(() => setAddingId(null), 450);
  };

  return (
    <div>
      {/* Search + Filters */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-3xl border-b border-border/40 shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <input type="text" placeholder={`🔍 ${t('search', language)}...`}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border/60 bg-card/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:bg-card transition-all duration-300 placeholder:text-muted-foreground/40 shadow-sm"
              value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            {search && <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors p-0.5" onClick={() => setSearch('')}><X size={15} /></button>}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-2.5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat.id} className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-medium whitespace-nowrap border transition-all duration-300 flex-shrink-0',
                category === cat.id
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
              )} onClick={() => setCategory(cat.id)}>
                <span className="text-xs">{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
          <button className={cn('p-2.5 rounded-2xl border transition-all duration-300 flex-shrink-0', showFilters ? 'bg-primary text-white border-primary shadow-lg' : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:bg-muted')}
            onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-3 animate-slideDown">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {SORTS.map(s => (
                <button key={s.id} className={cn(
                  'px-4 py-2 rounded-2xl text-[10px] font-medium border transition-all duration-300 flex-shrink-0',
                  sort === s.id ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:border-primary/30'
                )} onClick={() => setSort(s.id)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60 font-medium">{filtered.length} {filtered.length === 1 ? 'product' : 'products'} found</span>
          {category !== 'all' && <span className="text-[8px] text-muted-foreground/40">in {category}</span>}
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 px-4">
          <div className="text-5xl mb-4 opacity-30 animate-float">🔍</div>
          <h3 className="text-base font-semibold text-muted-foreground/70 mb-1">No products found</h3>
          <p className="text-xs text-muted-foreground/40 mb-6">Try adjusting your search</p>
          <button className="px-7 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
            onClick={() => { setSearch(''); setCategory('all'); }}>
            <Sparkles size={14} className="inline mr-1.5" />Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6 stagger">
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-2xl overflow-hidden border border-border/60 cursor-pointer card-glow group shadow-sm"
              onClick={() => { addRecentView(p); navigate(`/product/${p.id}`); }}>
              <div className="relative aspect-square overflow-hidden bg-muted/30 img-zoom">
                <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                {p.badge && (
                  <span className={cn('absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[7px] font-bold text-white z-10 shadow-lg backdrop-blur-sm',
                    p.badge === 'sale' ? 'bg-gradient-to-r from-red-500 to-rose-500' : p.badge === 'hot' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : p.badge === 'new' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-purple-500 to-violet-500')}>
                    {p.badge.toUpperCase()}
                  </span>
                )}
                {p.stockCount <= 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <span className="text-white text-[10px] font-extrabold bg-destructive/90 px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                  <button className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200"
                    onClick={e => { e.stopPropagation(); toggleWishlist(p); }}>
                    <span className={isInWishlist(p.id) ? 'text-red-500' : 'text-gray-500'}>{isInWishlist(p.id) ? '❤️' : '♡'}</span>
                  </button>
                  <button className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs z-20 shadow-sm hover:bg-white/90 hover:scale-110 active:scale-85 transition-all duration-200"
                    onClick={e => handleAdd(e, p)}>
                    <ShoppingCart size={13} className={addingId === p.id ? 'animate-cartBounce text-green-600' : 'text-gray-500'} />
                  </button>
                </div>
              </div>
              <div className="p-3.5">
                <div className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]">{p.name}</div>
                <div className="text-[8px] text-muted-foreground/60 mt-0.5 line-clamp-1">{p.nameEn}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="stars text-[10px]">{stars(p.rating)}</span>
                  <span className="text-[8px] text-muted-foreground/50">({p.reviews || 0})</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[15px] font-extrabold text-primary">{formatPrice(p.price)}</span>
                  {p.originalPrice && <><span className="text-[8px] text-muted-foreground/50 line-through">{formatPrice(p.originalPrice)}</span>
                    <span className="price-tag discount">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span></>}
                </div>
                {p.vendorName && <div className="mt-2 flex items-center gap-1 text-[7px] text-orange-600/70 bg-orange-50/50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full w-fit border border-orange-200/30 dark:border-orange-800/30">🏪 {p.vendorName}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scroll to top */}
      {filtered.length > 0 && (
        <button
          className="fixed bottom-20 right-4 w-10 h-10 rounded-2xl bg-primary text-white shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-90 transition-all animate-fadeUp"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
