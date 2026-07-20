import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { ShoppingCart, Heart, Package, User, Home, Store, Search, Moon, Sun, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

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

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-gradient-to-r from-primary to-blue-700 text-white flex items-center px-3 gap-2 shadow-lg">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-lg backdrop-blur-sm">🏪</div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t('appName', language)}</div>
            <div className="text-[8px] opacity-65">{t('appSub', language)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm relative" onClick={() => navigate('/orders')}>
            <Bell size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm relative" onClick={() => navigate('/cart')}>
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-[7px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-lg">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border z-50 flex pb-safe">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground transition-colors py-1',
                isActive && 'text-primary'
              )}
              onClick={() => navigate(path)}
            >
              <Icon size={20} className={cn('transition-transform', isActive && 'scale-110')} />
              <span>{t(label as any, language)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
