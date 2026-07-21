import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import ToastContainer from './Toast';
import QuickView from './ui/QuickView';
import AIChat from '@/components/ai/AIChat';
import { ShoppingCart, Package, User, Home, Store, Moon, Sun, Search, Sparkles, ChevronRight, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'home' },
  { path: '/shop', icon: Store, label: 'shop' },
  { path: '/cart', icon: ShoppingCart, label: 'cart' },
  { path: '/profile', icon: User, label: 'profile' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, darkMode, setDarkMode, getCartCount } = useStore();
  const cartCount = getCartCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setSearchOpen(false); }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <ToastContainer />
      <QuickView />
      <AIChat />

      {/* Search Overlay */}
      {searchOpen && <div className="search-overlay show" onClick={() => setSearchOpen(false)} />}

      {/* Animated Search Bar */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-[99] px-4 pt-4 pb-4 bg-card/90 backdrop-blur-3xl border-b border-border/50 transition-all duration-500 ease-out',
        searchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}>
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              autoFocus
              placeholder={`🔍 ${t('search', language)}...`}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:bg-card transition-all duration-300"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) { navigate('/shop', { state: { search: searchQuery } }); setSearchOpen(false); } }}
            />
          </div>
          <button
            className="px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 rounded-2xl transition-all duration-200 active:scale-95"
            onClick={() => setSearchOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 glass-strong border-b border-border/40">
        <div className="max-w-2xl mx-auto h-full flex items-center px-4 gap-2">
          <div className="flex items-center gap-3 flex-1 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-lg shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              🏪
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight text-foreground tracking-tight">{t('appName', language)}</div>
              <div className="text-[7px] text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">{t('appSub', language)}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search */}
            <button
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
            </button>

            {/* Theme */}
            <button
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Cart */}
            <button
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90 relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart size={17} />
              {cartCount > 0 && <span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 animate-fadeIn">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 glass-strong border-t border-border/40 z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto h-full flex items-center justify-around px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground/70 transition-all duration-300 relative py-1 px-4 rounded-2xl',
                  active && 'text-primary'
                )}
                onClick={() => navigate(path)}
              >
                <div className={cn(
                  'p-2 rounded-2xl transition-all duration-300',
                  active && 'bg-primary/10'
                )}>
                  <Icon size={20} className={cn('transition-all duration-300', active && 'scale-110')} />
                </div>
                <span className="font-semibold tracking-tight">{t(label as any, language)}</span>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-lg shadow-primary/30" />
                )}
                {path === '/cart' && cartCount > 0 && (
                  <span className="absolute top-0.5 right-3 min-w-[16px] h-[16px] rounded-full bg-destructive text-white text-[7px] font-bold flex items-center justify-center shadow-lg shadow-destructive/40">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
