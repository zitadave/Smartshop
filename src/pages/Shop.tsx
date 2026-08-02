import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { useProducts, stripStopWords } from '@/hooks/useProducts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useCart } from '@/hooks/useCart';
import { useButtonAnimation, useWishlistAnimation } from '@/hooks/useAnimations';
import { ProductCard } from '@/components/ui/ProductCard';
import { CardSkeleton } from '@/components/ui/Skeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, SORT_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/components/Toast';
import { Search, X, Filter, ArrowUp, Sparkles, RefreshCw, Mic, Loader2 } from 'lucide-react';
import { getLanguageMeta } from '@/i18n/translations';
import type { Product, CategoryId, SortMode } from '@/types';

export default function Shop() {

  const navigate = useNavigate();
  const location = useLocation();
  const { toggleWishlist, language, settings } = useStore();
  const { filtered, search, setSearch, category, setCategory, sort, setSort } = useProducts();
  const cart = useCart();
  const btnAnim = useButtonAnimation();
  const wishAnim = useWishlistAnimation();
  const [showFilters, setShowFilters] = useState(false);
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(filtered, { pageSize: 8 });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortParam = params.get('sort');
    if (sortParam === 'sale' || sortParam === 'price_low') {
      setSort('price_low');
      setShowFilters(true);
    }
  }, [location.search, setSort]);

  // AI Voice-Note Ordering states
  const [recording, setRecording] = useState(false);

  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = getLanguageMeta(language).speechCode;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setRecording(true);
          toast('🎙️ Listening... Speak your search', 'info');
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setRecording(false);
          toast('❌ Voice recognition error: ' + event.error, 'error');
        };

        recognition.onend = () => {
          setRecording(false);
        };

        recognition.onresult = async (event: any) => {
          const spokenText = event.results[0][0].transcript;
          console.log('[SPEECH] Transcribed text:', spokenText);
          
          const purified = stripStopWords(spokenText);
          if (!purified) {
            setSearch(spokenText);
            return;
          }
          setSearch(purified);
          
          try {
            const isAmharic = /[\u1200-\u137F]/.test(purified);
            const pair = isAmharic ? 'am|en' : 'en|am';
            
            const cacheKey = `ss_trans_${purified.replace(/\s+/g, '_')}_${pair}`;
            let translated = localStorage.getItem(cacheKey);

            if (!translated) {
              const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(purified)}&langpair=${pair}`);
              if (res.ok) {
                const d = await res.json();
                translated = d.responseData?.translatedText;
                if (translated) {
                  localStorage.setItem(cacheKey, translated);
                }
              }
            }

            if (translated && translated.toLowerCase() !== purified.toLowerCase()) {
              setSearch(purified + ' ' + translated);
              toast(`🎙️ Search: "${purified}" (expanded: "${translated}")`, 'success');
            } else {
              toast(`🎙️ Search: "${purified}"`, 'success');
            }
          } catch (err) {
            console.warn('Free Translation API failed:', err);
            toast(`🎙️ Search: "${purified}"`, 'success');
          }
        };

        recognition.start();
      } else {
        toast('❌ Speech Recognition is not supported on this browser.', 'error');
      }
    } catch (err: any) {
      toast('❌ Microphone access denied: ' + err.message, 'error');
    }
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const translateTypedQuery = async () => {
    if (!search.trim()) return;
    const purified = stripStopWords(search);
    try {
      const isAmharic = /[\u1200-\u137F]/.test(purified);
      const pair = isAmharic ? 'am|en' : 'en|am';
      
      const cacheKey = `ss_trans_${purified.replace(/\s+/g, '_')}_${pair}`;
      let translated = localStorage.getItem(cacheKey);

      if (!translated) {
        toast('✨ Translating search query...', 'info');
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(purified)}&langpair=${pair}`);
        if (res.ok) {
          const d = await res.json();
          translated = d.responseData?.translatedText;
          if (translated) {
            localStorage.setItem(cacheKey, translated);
          }
        }
      }

      if (translated && translated.toLowerCase() !== purified.toLowerCase()) {
        setSearch(purified + ' ' + translated);
        toast(`✨ Search expanded with: "${translated}"`, 'success');
      } else {
        toast('✨ Query is already translated.', 'info');
      }
    } catch {
      toast('❌ Translation failed.', 'error');
    }
  };

  // Read search from navigation state (header search overlay)
  useEffect(() => {
    const state = location.state as { search?: string } | null;
    if (state?.search) {
      setSearch(state.search);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleAdd = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    btnAnim.trigger(product.id);
    cart.add(product);
  }, [btnAnim, cart]);

  const handleWish = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    wishAnim.trigger(product.id);
    toggleWishlist(product);
  }, [wishAnim, toggleWishlist]);

  return (
    <div>
      {/* Sticky Header */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-3xl border-b border-border/40 shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder={recording ? "🎙️ Listening... Speak your search query" : "🔍 Search or tap mic to voice search..."}
              className={cn("w-full pl-10 pr-12 py-3 rounded-2xl border bg-card/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:bg-card transition-all duration-300 placeholder:text-muted-foreground/40 shadow-sm text-foreground",
                recording ? "border-rose-500 ring-4 ring-rose-500/15 animate-pulse bg-rose-50/5 dark:bg-rose-950/5" : "border-border/60"
              )}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              aria-label="Search products"
              disabled={recording}
            />
            {search && !recording && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20">
                <button 
                  onClick={translateTypedQuery}
                  className="text-muted-foreground/50 hover:text-primary p-0.5 transition-colors"
                  title="Translate & Expand Search"
                >
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                </button>
                <button className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={15} />
                </button>
              </div>
            )}
            <button 
              onClick={toggleRecording}
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                recording ? "text-rose-500 hover:text-rose-600 bg-rose-100 dark:bg-rose-950/40 animate-pulse scale-105" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              )}
              title="Voice Ordering"
            >
              <Mic size={15} />
            </button>
          </div>
        </div>

        {/* Category + Filter Row */}
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {[...CATEGORIES, ...((settings as any).customCategories || [])].map(cat => (
              <button key={cat.id}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-medium whitespace-nowrap border transition-all duration-300 flex-shrink-0',
                  category === cat.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                )}
                onClick={() => setCategory(cat.id as CategoryId)}
                aria-label={`Filter by ${cat.label}`}
              >
                <span className="text-xs">{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
          <button
            className={cn('p-2.5 rounded-2xl border transition-all duration-300 flex-shrink-0', showFilters ? 'bg-primary text-white border-primary shadow-lg' : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:bg-muted')}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle sort options"
          >
            <Filter size={14} />
          </button>
        </div>

        {/* Sort Options */}
        {showFilters && (
          <div className="px-4 pb-3 animate-slideDown">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {SORT_OPTIONS.map(s => (
                <button key={s.id}
                  className={cn(
                    'px-4 py-2 rounded-2xl text-[10px] font-medium border transition-all duration-300 flex-shrink-0',
                    sort === s.id ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' : 'bg-card/60 text-muted-foreground/70 border-border/60 hover:border-primary/30'
                  )}
                  onClick={() => setSort(s.id as SortMode)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result Count */}
        <div className="px-4 pb-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
          </span>
          {category !== 'all' && <span className="text-[8px] text-muted-foreground/40">in {category}</span>}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          description="Try adjusting your search or filters"
          action={{ label: '✨ Clear Filters', onClick: () => { setSearch(''); setCategory('all'); setSort(''); } }}
        />
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-6 stagger">
            {visibleItems.map(p => (
              <ProductCard key={p.id} product={p}
                onAdd={handleAdd} onWish={handleWish}
                addingId={btnAnim.activeId} wishAnimId={wishAnim.activeId} />
            ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <RefreshCw size={18} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && visibleItems.length > 0 && (
            <p className="text-center text-[10px] text-muted-foreground/40 pb-4">You've reached the end</p>
          )}
        </>
      )}

      {/* Scroll to Top */}
      {filtered.length > 0 && (
        <button
          className="fixed bottom-20 right-4 w-10 h-10 rounded-2xl bg-primary text-white shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-90 transition-all animate-fadeUp"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
