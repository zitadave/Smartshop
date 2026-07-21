import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import ToastContainer from './Toast';
import { ShoppingCart, Package, User, Home, Store, Moon, Sun, Search, Sparkles } from 'lucide-react';
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

      {/* Search Overlay */}
      {searchOpen && <div className="search-overlay show" onClick={() => setSearchOpen(false)} />}

      {/* Search Bar */}
      <div className={cn('fixed top-0 left-0 right-0 z-[99] px-4 pt-3 pb-3 bg-card/90 backdrop-blur-2xl border-b border-border transition-all duration-400',
        searchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none')}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" autoFocus placeholder={t('search', language) + '...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-input bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) { navigate('/shop'); setSearchOpen(false); } }} />
          </div>
          <button className="px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors" onClick={() => setSearchOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 glass-strong shadow-sm flex items-center px-3 gap-2 border-b border-border/50">
        <div className="flex items-center gap-2.5 flex-1 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-base shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
            🏪
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-foreground">{t('appName', language)}</div>
            <div className="text-[7px] text-muted-foreground tracking-wider uppercase">{t('appSub', language)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-all hover:scale-105 active:scale-90"
            onClick={() => setSearchOpen(true)}><Search size={16} /></button>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-all hover:scale-105 active:scale-90"
            onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
        </div>
      </header>

      {/* Main */}
      <main className="pt-14 animate-fadeIn">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-2xl border-t border-border z-50 flex pb-safe">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button key={path}
              className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] text-muted-foreground transition-all py-1.5 relative',
                active && 'text-primary')}
              onClick={() => navigate(path)}>
              <div className={cn('p-1.5 rounded-xl transition-all duration-200', active && 'bg-primary/10')}>
                <Icon size={20} className={cn('transition-all duration-200', active && 'scale-110 text-primary')} />
              </div>
              <span className="font-semibold tracking-tight">{t(label as any, language)}</span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />}
              {path === '/cart' && cartCount > 0 && <span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
