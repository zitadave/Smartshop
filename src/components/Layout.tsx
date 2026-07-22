import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { isRunningInTelegram } from '@/lib/telegram';
import ToastContainer from './Toast';
import QuickView from './ui/QuickView';
import AIChat from '@/components/ai/AIChat';
import PWAInstallPrompt from './PWAInstallPrompt';
import { ShoppingCart, Package, User, Home, Store, Moon, Sun, Search, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'home' },
  { path: '/shop', icon: Store, label: 'shop' },
  { path: '/orders', icon: Package, label: 'orders' },
  { path: '/profile', icon: User, label: 'profile' },
];

// Running inside Telegram WebView — disable heavy animations
const TG = isRunningInTelegram();
const ANIM_CLASS = TG ? '' : 'animate-fadeIn';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, darkMode, setDarkMode, getCartCount, wishlist } = useStore();
  const cartCount = getCartCount();
  const wishlistCount = wishlist.length;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <ToastContainer />
      <QuickView />
      <AIChat />
      {!TG && <PWAInstallPrompt />}

      <header className="fixed top-0 left-0 right-0 h-14 z-50 glass-strong border-b border-border/40">
        <div className="max-w-2xl mx-auto h-full flex items-center px-4 gap-2">
          <div className="flex items-center gap-3 flex-1 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-lg shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">🏪</div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight text-foreground tracking-tight">{t('appName', language)}</div>
              <div className="text-[7px] text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">{t('appSub', language)}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90"
              onClick={() => navigate('/shop')}><Search size={17} /></button>

            {wishlistCount > 0 && (
              <button className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90 relative"
                onClick={() => navigate('/wishlist')}>
                <Heart size={17} className="text-red-500 fill-red-500" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-white text-[7px] font-bold flex items-center justify-center shadow-lg shadow-destructive/40">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              </button>
            )}

            <button className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90"
              onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>

            {cartCount > 0 && (
              <button className="w-9 h-9 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-90 relative"
                onClick={() => navigate('/cart')}>
                <ShoppingCart size={17} />
                <span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-14">
        <div className="max-w-2xl mx-auto"><Outlet /></div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 glass-strong border-t border-border/40 z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto h-full flex items-center justify-around px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} className={cn('flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground/70 transition-all duration-300 relative py-1 px-4 rounded-2xl', active && 'text-primary')}
                onClick={() => navigate(path)}>
                <div className={cn('p-2 rounded-2xl transition-all duration-300', active && 'bg-primary/10')}>
                  <Icon size={20} className={cn('transition-all duration-300', active && 'scale-110')} />
                </div>
                <span className="font-semibold tracking-tight">{t(label as any, language)}</span>
                {active && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-lg shadow-primary/30" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
