import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import ToastContainer from './Toast';
import { ShoppingCart, Heart, Package, User, Home, Store, Moon, Sun, Bell, Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'home' },
  { path: '/shop', icon: Store, label: 'shop' },
  { path: '/orders', icon: Package, label: 'orders' },
  { path: '/profile', icon: User, label: 'profile' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, darkMode, setDarkMode, setLanguage, getCartCount } = useStore();
  const cartCount = getCartCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close search on navigation
  useEffect(() => { setSearchOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Toast Container */}
      <ToastContainer />

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay show" onClick={() => setSearchOpen(false)} />
      )}

      {/* Search Bar (expanded) */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-[99] px-3 pt-2 pb-3 bg-card border-b border-border transition-all duration-300',
        searchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder={t('search', language)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) { navigate('/shop'); setSearchOpen(false); } }}
            />
          </div>
          <button className="p-2.5 text-sm font-medium text-primary" onClick={() => setSearchOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 glass-strong shadow-sm flex items-center px-3 gap-2 border-b border-border">
        <div className="flex items-center gap-2.5 flex-1 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-base shadow-sm group-hover:shadow-md transition-shadow">
            🏪
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-foreground">{t('appName', language)}</div>
            <div className="text-[8px] text-muted-foreground tracking-wide">{t('appSub', language)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={16} />
          </button>

          {/* Theme Toggle */}
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Cart */}
          <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors relative"
            onClick={() => navigate('/cart')}>
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 animate-fadeIn">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-t border-border z-50 flex pb-safe">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground transition-all py-1 relative',
                isActive && 'text-primary'
              )}
              onClick={() => navigate(path)}
            >
              <div className={cn(
                'p-1 rounded-lg transition-all',
                isActive && 'bg-primary/10'
              )}>
                <Icon size={20} className={cn('transition-transform', isActive && 'scale-110')} />
              </div>
              <span className="font-medium">{t(label as any, language)}</span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
