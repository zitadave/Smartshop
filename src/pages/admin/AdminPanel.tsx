import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, ordersApi, analyticsApi, vendorsApi, settingsApi } from '@/lib/api';
import { formatPrice, cn, generateId, formatCountdown, isFlashDealActive, formatTimeRemaining } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Settings as SettingsIcon,
  TrendingUp, Users, MessageSquare, BarChart3, Shield, LogOut, Menu, X,
  Bell, Bot, Rocket, Tags, Scale, Calendar, ClipboardList, ChevronRight,
  Camera, Megaphone, Clock, Globe, Palette, MapPin, FileText, Zap, Upload,
  Search, Plus, Edit3, Trash2, Eye, EyeOff, Check, Loader, ChevronDown,
  DollarSign, Star, Activity, AlertTriangle, Sun, Moon, Gift, CreditCard,
  Gamepad2, Coins, Smartphone, ExternalLink, Command, Columns, List, Database,
  Truck, RotateCcw, RefreshCw, Landmark, BookOpen, Banknote
} from 'lucide-react';
import CommandPalette from '@/components/admin/CommandPalette';
import LiveChart, { StatCard } from '@/components/admin/LiveChart';
import OrderKanban from '@/components/admin/OrderKanban';
import PayoutSystem from '@/components/admin/PayoutSystem';
import CouponAnalytics from '@/components/admin/CouponAnalytics';
import SmartAlerts from '@/components/admin/SmartAlerts';
import AbandonedCartRecovery from '@/components/admin/AbandonedCarts';
import AdminRoles from '@/components/admin/AdminRoles';
import DatabaseBackup from '@/components/admin/DatabaseBackup';
import BulkProductManager from '@/components/admin/BulkProductManager';
import ProductAnalytics from '@/components/admin/ProductAnalytics';
import InventoryForecast from '@/components/admin/InventoryForecast';
import ActivityLog from '@/components/admin/ActivityLog';
import OrderFulfillment from '@/components/admin/OrderFulfillment';
import SLAMonitor from '@/components/admin/SLAMonitor';
import DriverTracker from '@/components/admin/DriverTracker';
import ReturnsManager from '@/components/admin/ReturnsManager';
import AdminSecurity from '@/components/admin/AdminSecurity';
import AdminBotManager from '@/components/admin/AdminBotManager';
import TaxFinanceDashboard from '@/components/admin/TaxFinanceDashboard';
import SmartBooks from '@/components/admin/SmartBooks';
import ManualPaymentReview from '@/components/admin/ManualPaymentReview';
import ProductStudio from '@/components/admin/ProductStudio';
import { sendAdminTelegram, notifyProductCreated, notifyProductUpdated, notifyProductDeleted, notifySettingsChanged, notifyVendorUpdated } from '@/lib/adminNotifier';

type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' 
  | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' 
  | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' 
  | 'bulkProducts' | 'analytics' | 'forecast' | 'activity' | 'security' | 'telegram' 
  | 'fulfillment' | 'sla' | 'driver' | 'returns' | 'finance' | 'smartbooks' | 'manualpayments';

export default function AdminLayout() {
  const [tab, setTab] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // CRITICAL: Clean up old injected CSS from AdminThemeManager (no longer used)
  // This style tag was injected WITHOUT .dark prefix, so it overrode light mode
  useEffect(() => {
    const oldStyles = document.getElementById('admin-theme-styles');
    if (oldStyles) oldStyles.remove();
    const oldDarkMode = document.getElementById('admin-dark-mode');
    if (oldDarkMode) oldDarkMode.remove();
    document.documentElement.removeAttribute('data-admin-theme');
  }, []);

  // Read dark mode from store for independent admin panel styling
  const store = useStore();
  const globalDarkMode = store.darkMode;

  // NUCLEAR OPTION: Inject a <style> tag into admin panel that overrides
  // card backgrounds using !important. This applies to ALL cards (current + future).
  useEffect(() => {
    // Remove any old injected style
    const old = document.getElementById('ap-card-style');
    if (old) old.remove();
    // Create fresh style tag
    const style = document.createElement('style');
    style.id = 'ap-card-style';
    if (globalDarkMode) {
      style.textContent = `
        [data-admin-card] { background-color: #1e293b !important; border-color: #334155 !important; }
        [data-admin-card] .text-slate-400, [data-admin-card] .text-slate-500, [data-admin-card] .text-slate-600 { color: #94a3b8 !important; }
        [data-admin-card] .text-slate-700, [data-admin-card] .text-slate-800, [data-admin-card] .text-slate-900 { color: #e2e8f0 !important; }
        [data-admin-card] .font-bold, [data-admin-card] .font-semibold, [data-admin-card] .font-medium { color: #e2e8f0 !important; }
        [data-admin-card] input, [data-admin-card] select, [data-admin-card] textarea { background-color: #0f172a !important; border-color: #475569 !important; color: #e2e8f0 !important; }
      `;
    } else {
      style.textContent = `
        [data-admin-card] { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
        [data-admin-card] .text-slate-400, [data-admin-card] .text-slate-500, [data-admin-card] .text-slate-600 { color: #64748b !important; }
        [data-admin-card] .text-slate-700, [data-admin-card] .text-slate-800, [data-admin-card] .text-slate-900 { color: #0f172a !important; }
        [data-admin-card] .font-bold, [data-admin-card] .font-semibold, [data-admin-card] .font-medium { color: #0f172a !important; }
        [data-admin-card] input, [data-admin-card] select, [data-admin-card] textarea { background-color: #ffffff !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
      `;
    }
    document.head.appendChild(style);
    // Cleanup on unmount
    return () => { const s = document.getElementById('ap-card-style'); if (s) s.remove(); };
  }, [globalDarkMode]);

  const handleCmdNavigate = (t: string) => {
    setTab(t as Tab);
    setCmdOpen(false);
  };

  const NAV_ITEMS: { id: Tab; icon: any; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'vendors', icon: Store, label: 'Vendors' },
    { id: 'marketplace', icon: Rocket, label: 'Marketplace' },
    { id: 'reviews', icon: Camera, label: 'Reviews' },
    { id: 'broadcast', icon: Megaphone, label: 'Broadcast' },
    { id: 'flashdeals', icon: Zap, label: 'Flash Deals' },
    { id: 'preorders', icon: Clock, label: 'Pre-Orders' },
    { id: 'tracking', icon: MapPin, label: 'Tracking' },
    { id: 'themes', icon: Palette, label: 'Themes' },
    { id: 'coupons', icon: Tags, label: 'Coupons' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'manualpayments', icon: Banknote, label: 'Manual Payments' },
    { id: 'alerts', icon: Bell, label: 'Smart Alerts' },
    { id: 'abandoned', icon: ShoppingCart, label: 'Cart Recovery' },
    { id: 'roles', icon: Shield, label: 'Admin Roles' },
    { id: 'backup', icon: Database, label: 'Backup' },
    { id: 'bulkProducts', icon: Upload, label: 'Bulk Import' },
    { id: 'analytics', icon: BarChart3, label: 'Product Analytics' },
    { id: 'forecast', icon: Clock, label: 'Forecast' },
    { id: 'activity', icon: ClipboardList, label: 'Activity Log' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'telegram', icon: Bot, label: 'Admin Bot' },
    { id: 'fulfillment', icon: Package, label: 'Fulfillment' },
    { id: 'sla', icon: Activity, label: 'SLA Monitor' },
    { id: 'driver', icon: Truck, label: 'Driver Tracking' },
    { id: 'returns', icon: RotateCcw, label: 'Returns' },
    { id: 'finance', icon: Landmark, label: 'Finance & Tax' },
    { id: 'smartbooks', icon: BookOpen, label: 'Smart Books' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900" id="admin-panel" data-admin-root data-admin-mode={globalDarkMode ? 'dark' : 'light'}>
      {/* Toast notifications for admin panel */}
      {/* Command Palette */}
      <CommandPalette onNavigate={handleCmdNavigate} />

      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50" data-admin-header>
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-3">
          <button className="xl:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
              <Rocket size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Admin Panel</h1>
              <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-medium">Smart Shop Management</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] font-medium"
              onClick={() => setCmdOpen(true)}>
              <Command size={12} />
              <span>Search</span>
              <span className="text-[8px] text-slate-400 ml-1 font-mono">⌘K</span>
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" onClick={() => window.open('/', '_blank')}><Eye size={16} /></button>
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => {
              const isDark = !globalDarkMode;
              localStorage.setItem('ss_dark', JSON.stringify(isDark));
              document.documentElement.classList.toggle('dark', isDark);
              store.setDarkMode(isDark);
              setTimeout(function(){ window.location.reload(); }, 100);
            }} title={globalDarkMode ? 'Switch to Light' : 'Switch to Dark'}>
              {globalDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-500" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <Activity size={12} className="text-indigo-500" />
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 capitalize">{tab}</span>
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed top-14 left-0 bottom-0 w-60 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 flex flex-col`} data-admin-sidebar>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {(() => {
            const groups: { title: string; ids: Tab[] }[] = [
              { title: 'STORE', ids: ['overview', 'products', 'orders', 'vendors', 'marketplace', 'reviews'] },
              { title: 'PROMOTION', ids: ['broadcast', 'flashdeals', 'preorders', 'coupons', 'tracking', 'themes'] },
              { title: 'OPERATIONS', ids: ['manualpayments', 'alerts', 'abandoned', 'fulfillment', 'sla', 'driver', 'returns'] },
              { title: 'FINANCE', ids: ['finance', 'smartbooks', 'settings'] },
              { title: 'ADMIN', ids: ['roles', 'security', 'backup', 'telegram', 'activity'] },
              { title: 'INSIGHTS', ids: ['analytics', 'forecast', 'bulkProducts'] },
            ];
            const isCollapsed = (g: string) => collapsedGroups[g] === true;
            const toggle = (g: string) => setCollapsedGroups(c => ({ ...c, [g]: !isCollapsed(g) }));
            return groups.map(group => {
              const hasActive = group.ids.includes(tab);
              return (
                <div key={group.title} className="space-y-0.5">
                  <button className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    onClick={() => toggle(group.title)}>
                    <ChevronRight size={10} className={cn('transition-transform', !isCollapsed(group.title) && 'rotate-90')} />
                    {group.title}
                    {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto" />}
                  </button>
                  {!isCollapsed(group.title) && NAV_ITEMS.filter(i => group.ids.includes(i.id)).map(item => {
                    const Icon = item.icon;
                    const isActive = tab === item.id;
                    return (
                      <button key={item.id} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 group',
                        isActive ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      )} onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                        <div className={cn('p-1.5 rounded-lg transition-all', isActive ? 'bg-indigo-500/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800')}>
                          <Icon size={14} className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')} />
                        </div>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight size={10} className={cn('opacity-0 transition-all', isActive && 'opacity-100')} />
                      </button>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
        <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => { localStorage.setItem('ss_dark', 'false'); document.documentElement.classList.remove('dark'); window.location.href = '/'; }}>
<LogOut size={14} /> <span>Back to Store</span>
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/40 z-30 xl:hidden backdrop-blur-sm" onClick={() => setMenuOpen(false)} />}

      <main className="xl:ml-60 pt-14 min-h-screen transition-all duration-300 overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fadeUp overflow-x-hidden">
          {tab === 'overview' && <Overview onNavigate={handleCmdNavigate} />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'vendors' && <AdminVendors />}
          {tab === 'marketplace' && <AdminMarketplace />}
          {tab === 'reviews' && <AdminReviews />}
          {tab === 'broadcast' && <AdminBroadcast />}
          {tab === 'flashdeals' && <AdminFlashDeals />}
          {tab === 'preorders' && <AdminPreOrders />}
          {tab === 'tracking' && <AdminTracking />}
          {tab === 'themes' && <AdminThemes />}
          {tab === 'coupons' && <CouponAnalytics />}
          {tab === 'alerts' && <SmartAlerts />}
          {tab === 'abandoned' && <AbandonedCartRecovery />}
          {tab === 'roles' && <AdminRoles />}
          {tab === 'backup' && <DatabaseBackup />}
          {/* Admin Theme moved to Settings */}
          {tab === 'bulkProducts' && <BulkProductManager />}
          {tab === 'analytics' && <ProductAnalytics />}
          {tab === 'forecast' && <InventoryForecast />}
          {tab === 'activity' && <ActivityLog />}
          {tab === 'security' && <AdminSecurity />}
          {tab === 'telegram' && <AdminBotManager />}
          {tab === 'fulfillment' && <OrderFulfillment />}
          {tab === 'sla' && <SLAMonitor />}
          {tab === 'driver' && <DriverTracker />}
          {tab === 'returns' && <ReturnsManager />}
          {tab === 'manualpayments' && <ManualPaymentReview />}
          {tab === 'finance' && <TaxFinanceDashboard />}
          {tab === 'smartbooks' && <SmartBooks />}
          {tab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// =============================================
// 1. OVERVIEW
// =============================================
function Overview({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [revenueHistory] = useState(() =>
    Array.from({length: 12}, (_, i) => ({
      label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      value: Math.round(50000 + Math.random() * 150000 + i * 20000),
    }))
  );
  const goto = (t: string) => onNavigate ? onNavigate(t) : null;

  useEffect(() => {
    analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
    const interval = setInterval(() => {
      analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);
  const generateSpark = (base: number) => Array.from({length: 8}, (_, i) => ({ label: `${i+1}h`, value: Math.round(base * (0.7 + Math.random() * 0.6)) }));

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">👋 Welcome back, Admin</h2>
          <p className="text-xs text-slate-500 mt-0.5">Here's what's happening with your store today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-green-600 font-semibold">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Products" value={products.length} sub={`${data.totalSold || 0} sold`} icon={Package}
          color="from-blue-500 to-blue-600" trend={{ value: 12, up: true }} data={generateSpark(products.length || 18)}
          onClick={() => goto('products')} />
        <StatCard label="Revenue" value={`Br ${(data.totalRevenue || 0).toLocaleString()}`} sub={`${data.totalOrders || 0} orders`} icon={DollarSign}
          color="from-emerald-500 to-green-600" trend={{ value: 8, up: true }} data={revenueHistory} />
        <StatCard label="Active Orders" value={data.pendingOrders || 0} sub={`${data.shippedOrders || 0} in transit`} icon={ShoppingCart}
          color="from-orange-500 to-amber-600" trend={{ value: 3, up: false }} data={generateSpark(12)}
          onClick={() => goto('orders')} />
        <StatCard label="Low Stock" value={lowStock.length} sub={`${products.filter(p => !p.inStock).length} out of stock`} icon={AlertTriangle}
          color="from-red-500 to-rose-600" trend={{ value: lowStock.length > 0 ? 15 : 0, up: lowStock.length > 0 }} data={generateSpark(lowStock.length || 3)}
          onClick={() => goto('products')} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">📈 Revenue Trend (12 months)</h3>
          <span className="text-[9px] text-green-600 font-semibold flex items-center gap-1"><TrendingUp size={12} /> +18% vs last year</span>
        </div>
        <LiveChart data={revenueHistory} height={100} color="#6C63FF" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" /> Low Stock Alert ({lowStock.length})</h3>
          {lowStock.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">All stocked!</p> : lowStock.slice(0, 5).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <img src={p.image} className="w-9 h-9 rounded-lg object-cover" />
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{p.nameEn}</div><div className="text-[9px] text-slate-400">{formatPrice(p.price)}</div></div>
              <div className={cn('px-2 py-0.5 rounded-lg text-[9px] font-bold', p.stockCount === 0 ? 'bg-red-100 text-red-600' : p.stockCount <= 2 ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600')}>{p.stockCount === 0 ? 'OUT' : `${p.stockCount} left`}</div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap size={15} className="text-indigo-500" /> Quick Actions</h3>
          <div className="space-y-1.5">
            {[
              { icon: Package, label: 'Manage Products', onClick: () => goto('products') },
              { icon: Megaphone, label: 'Send Broadcast', onClick: () => goto('broadcast') },
              { icon: Zap, label: 'New Flash Deal', onClick: () => goto('flashdeals') },
              { icon: Tags, label: 'Create Coupon', onClick: () => goto('coupons') },
              { icon: DollarSign, label: 'Vendor Payouts', onClick: () => goto('vendors') },
              { icon: Store, label: 'Vendor Dashboard', onClick: () => window.open('/vendor', '_blank') },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" onClick={item.onClick}>
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30"><Icon size={13} className="text-indigo-600" /></div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 2. PRODUCTS — WITH PRODUCT STUDIO PRO
// =============================================
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStudio, setShowStudio] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    productsApi.list().then(d => { setProducts(d?.products || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(loadProducts, [loadProducts]);

  const filtered = products.filter(p => !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()));
  
  const toggleVisibility = async (id: number, v: boolean) => {
    await productsApi.update(id, { visible: !v });
    setProducts(products.map(p => p.id === id ? { ...p, visible: !v } : p));
    const p = products.find(x => x.id === id);
    sendAdminTelegram(`${p?.visible !== false ? '👁️' : '🙈'} <b>Product ${p?.visible !== false ? 'Hidden' : 'Revealed'}</b>\n\n📦 ${p?.nameEn || '#' + id}`);
  };
  const togglePreOrder = async (id: number) => {
    const p = products.find(x => x.id === id);
    await productsApi.update(id, { isPreOrder: !p?.isPreOrder });
    setProducts(products.map(x => x.id === id ? { ...x, isPreOrder: !x.isPreOrder } : x));
    sendAdminTelegram(`${p?.isPreOrder ? '🔄' : '📅'} <b>Pre-Order Toggled</b>\n\n📦 ${p?.nameEn}\nNow: ${p?.isPreOrder ? 'Regular' : 'Pre-Order'}`);
  };
  const deleteProduct = async (id: number) => {
    const p = products.find(x => x.id === id);
    if (!window.confirm('⚠️ Are you sure you want to delete this product? This cannot be undone.')) return;
    await productsApi.delete(id);
    setProducts(products.filter(p => p.id !== id));
    notifyProductDeleted(p?.nameEn || '#' + id);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setShowStudio(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setShowStudio(true);
  };

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp">
      {showStudio && (
        <ProductStudio
          editProduct={editingProduct}
          onClose={() => { setShowStudio(false); setEditingProduct(null); }}
          onSaved={loadProducts}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">📦 Products ({products.length})</h2>
          <p className="text-[10px] text-slate-500">{products.filter(p => p.inStock).length} in stock · {products.filter(p => !p.inStock).length} out of stock</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-34 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 max-w-[140px]"
              placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-lg transition-all"
            onClick={openCreate}>
            <Plus size={13} /> Add Product
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            onClick={loadProducts} title="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden" data-admin-card>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-semibold">Product</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3 font-semibold">Price</th>
              <th className="text-center px-4 py-3 font-semibold">Stock</th>
              <th className="text-center px-4 py-3 font-semibold">Type</th>
              <th className="text-center px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-xs text-slate-400">No products found. Click "Add Product" to create one!</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={p.image} className="w-9 h-9 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate max-w-[160px]">{p.nameEn}</div>
                      <div className="text-[9px] text-slate-400">{p.soldCount || 0} sold</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500 capitalize">{p.category}</td>
                <td className="px-4 py-3 text-right font-bold">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold',
                    p.stockCount > 10 ? 'bg-green-100 text-green-700' : p.stockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>
                    {p.stockCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border',
                    p.isPreOrder ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200')}
                    onClick={() => togglePreOrder(p.id)}>
                    {p.isPreOrder ? 'Pre-Order' : 'Regular'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border',
                    p.visible !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200')}
                    onClick={() => toggleVisibility(p.id, p.visible)}>
                    {p.visible !== false ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"
                      onClick={() => openEdit(p)} title="Edit product">
                      <Edit3 size={13} />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                      onClick={() => deleteProduct(p.id)} title="Delete product">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================
// 3. ORDERS
// =============================================
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState('');
  const fetchOrders = () => {
    ordersApi.list().then(d => setOrders(d?.orders || [])).catch(() => {});
    try { const l = JSON.parse(localStorage.getItem('ss_orders') || '[]'); setOrders(prev => [...l, ...prev].slice(0, 100)); } catch {}
  };
  useEffect(fetchOrders, []);
  const updateStatus = async (n: string, s: string) => { await ordersApi.updateStatus(n, s); setOrders(orders.map(o => o.orderNumber === n ? { ...o, status: s } : o)); };
  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📋 Orders ({orders.length})</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" onClick={fetchOrders}><RefreshCw size={14} /></button>
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setViewMode('kanban')}>
              <Columns size={12} /> Kanban
            </button>
            <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setViewMode('list')}>
              <List size={12} /> List
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {statuses.map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap border transition-all flex-shrink-0',
              viewMode === 'kanban' ? 'hidden' : '',
              (statusFilter === s || (s === 'all' && !statusFilter)) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
            )} onClick={() => setStatusFilter(s === 'all' ? '' : s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {viewMode === 'kanban' && <OrderKanban orders={orders} onUpdate={fetchOrders} />}

      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden" data-admin-card>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 50).map(o => (
              <div key={o.orderNumber} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center"><ShoppingCart size={13} className="text-indigo-600" /></div>
                    <div className="min-w-0"><div className="text-xs font-bold font-mono text-indigo-600 truncate">{o.orderNumber}</div><div className="text-[9px] text-slate-400 truncate">{o.customer?.name} · {o.date}</div></div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold">{formatPrice(o.total || 0)}</span>
                    <select className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1" value={o.status} onChange={e => updateStatus(o.orderNumber, e.target.value)}>
                      {['pending','confirmed','processing','shipped','delivered','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 mt-1.5 ml-[42px] truncate">{o.items?.map((it: any) => `${it.name} ×${it.quantity}`).join(', ')}</div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No orders found</p>}
        </div>
      )}
    </div>
  );
}

// =============================================
// 4. VENDORS
// =============================================
function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [commission, setCommission] = useState(10);
  const [approved, setApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendorView, setVendorView] = useState<'vendors' | 'payouts'>('vendors');
  const [storeName, setStoreName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');

  useEffect(() => {
    vendorsApi.list().then(d => { setVendors(d?.vendors || []); setLoading(false); }).catch(() => setLoading(false));
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
  }, []);

  const updateVendor = async (id: number) => {
    await vendorsApi.update(id, { commission, approved, name: storeName, phone: vendorPhone, email: vendorEmail });
    setVendors(vendors.map(v => v.id === id ? { ...v, commission, approved, name: storeName, phone: vendorPhone, email: vendorEmail } : v));
    setSelectedVendor(null);
    toast('✅ Vendor updated!', 'success');
    notifyVendorUpdated(storeName || selectedVendor?.name || 'Vendor', `Commission: ${commission}%\nStatus: ${approved ? 'Approved' : 'Pending'}`);
  };

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div><h2 className="text-lg font-bold">🏪 Vendor Management ({vendors.length})</h2><p className="text-[10px] text-slate-500">Manage vendor registrations, commissions, payouts and storefronts</p></div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all', vendorView === 'vendors' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setVendorView('vendors')}>Vendors</button>
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all', vendorView === 'payouts' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setVendorView('payouts')}><DollarSign size={11} className="inline" /> Payouts</button>
        </div>
      </div>
      {vendorView === 'payouts' ? <PayoutSystem /> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-indigo-600">{vendors.length}</div><div className="text-[9px] text-slate-500">Total Vendors</div></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-green-600">{vendors.filter(v => v.approved !== false).length}</div><div className="text-[9px] text-slate-500">Approved</div></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-amber-600">{vendors.filter(v => !v.approved).length}</div><div className="text-[9px] text-slate-500">Pending</div></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-purple-600">{products.filter(p => p.vendorId).length}</div><div className="text-[9px] text-slate-500">Vendor Products</div></div>
          </div>

          {selectedVendor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-slideUp">
              <h3 className="text-sm font-bold mb-3">Edit: {selectedVendor.name || selectedVendor.storeName}</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
                <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} /></div>
                <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} /></div>
                <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Commission %</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="rounded" /> Approved</label>
                <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => updateVendor(selectedVendor.id)}>💾 Save</button>
                <button className="px-4 py-2 border rounded-xl text-xs" onClick={() => setSelectedVendor(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendors.map(v => {
              const vendorProds = products.filter(p => p.vendorId === v.id || p.vendorName === v.name);
              return (
                <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-all overflow-x-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{v.name?.charAt(0) || v.storeName?.charAt(0) || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{v.name || v.storeName || 'Vendor'}</div>
                      <div className="text-[9px] text-slate-400 truncate">{v.email || v.phone || 'No contact'}</div>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold flex-shrink-0', v.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{v.approved ? 'Approved' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-2">
                    <span>📦 {vendorProds.length} products</span>
                    <span>·</span>
                    <span>💰 {v.commission || 10}% commission</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button className="text-indigo-600 text-[9px] font-semibold hover:underline flex items-center gap-1" onClick={() => { setSelectedVendor(v); setCommission(v.commission || 10); setApproved(v.approved !== false); setStoreName(v.name || ''); setVendorEmail(v.email || ''); setVendorPhone(v.phone || ''); }}>
                      <Edit3 size={11} /> Edit
                    </button>
                    {vendorProds.length > 0 && (
                      <button className="text-emerald-600 text-[9px] font-semibold hover:underline" onClick={() => window.open(`/store/${v.id}`, '_blank')}>
                        <Eye size={11} className="inline mr-1" /> View Store
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {vendors.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No vendors registered yet</p>}
        </>
      )}
    </div>
  );
}

// =============================================
// 5-23. Remaining admin tabs
// =============================================
function AdminMarketplace() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  const [sponsoredPid, setSponsoredPid] = useState('');
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const sp = settings.sponsoredProducts || [];
  const addSponsored = () => { if (sponsoredPid) { saveSetting('sponsoredProducts', [...sp, Number(sponsoredPid)]); setSponsoredPid(''); toast('✅ Sponsored product added!', 'success'); } };
  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <h2 className="text-lg font-bold">🚀 Marketplace Management</h2>
      <p className="text-[10px] text-slate-500">Manage flash sales, sponsored products, bundle deals, and cross-sell promotions</p>

      {/* Sponsored Products */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">💼 Sponsored Products ({sp.length})</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <select className="flex-1 min-w-[120px] p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={sponsoredPid} onChange={e => setSponsoredPid(e.target.value)}>
            <option value="">Select product...</option>
            {products.filter(p => !sp.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nameEn} - {formatPrice(p.price)}</option>)}
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[10px] font-bold disabled:opacity-50" onClick={addSponsored} disabled={!sponsoredPid}>+ Promote</button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {sp.length === 0 ? <p className="text-[10px] text-slate-400 text-center py-4">No sponsored products</p> :
            sp.map((pid: number) => {
              const p = products.find(x => x.id === pid);
              return <div key={pid} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <img src={p?.image} className="w-8 h-8 rounded-lg object-cover" />
                <span className="flex-1 text-[10px] font-medium truncate">{p?.nameEn || `#${pid}`}</span>
                <span className="text-[9px] text-green-600 font-semibold">{formatPrice(p?.price || 0)}</span>
                <button className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => saveSetting('sponsoredProducts', sp.filter((x: number) => x !== pid))}><Trash2 size={11} /></button>
              </div>;
            })
          }
        </div>
      </div>

      {/* Bundle Deals */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">🔗 Bundle Deals</h3>
        {Object.keys(settings.bundleDeals || {}).length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">No bundle deals. Coming soon: buy together and save!</p>}
        {Object.entries(settings.bundleDeals || {}).map(([pid, d]: any) => {
          const p = products.find(x => x.id === Number(pid));
          return <div key={pid} className="flex items-center gap-2 py-2 text-[10px]">{p?.nameEn} + bundle · {d.discount}% off</div>;
        })}
      </div>

      {/* Cross-sell */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-4">
        <h3 className="text-sm font-bold mb-2">📊 Marketplace Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3"><div className="text-lg font-bold text-indigo-600">{products.length}</div><div className="text-[9px] text-slate-500">Total Products</div></div>
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3"><div className="text-lg font-bold text-green-600">{products.filter(p => p.inStock).length}</div><div className="text-[9px] text-slate-500">In Stock</div></div>
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3"><div className="text-lg font-bold text-amber-600">{sp.length}</div><div className="text-[9px] text-slate-500">Sponsored</div></div>
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3"><div className="text-lg font-bold text-purple-600">{Object.keys(settings.flashSales || {}).length}</div><div className="text-[9px] text-slate-500">Flash Sales</div></div>
        </div>
      </div>
    </div>
  );
}

function AdminReviews() {
  const store = useStore();
  const { photoReviews, removePhotoReview } = store;
  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold mb-4">📸 Reviews ({photoReviews.length})</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {photoReviews.slice(0, 20).map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{r.userName?.charAt(0)}</div>
                <div><div className="text-xs font-semibold flex items-center gap-1">{r.userName} {r.verified && <Check size={10} className="text-green-500" />}</div><div className="text-[9px] text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div></div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removePhotoReview(r.id)}><Trash2 size={12} /></button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">{r.text}</p>
            {r.images?.length > 0 && <div className="flex gap-1 mt-1.5">{(typeof r.images === 'string' ? JSON.parse(r.images) : r.images).slice(0, 3).map((img: string, i: number) => <img key={i} src={img} className="w-10 h-10 rounded-lg object-cover" />)}</div>}
          </div>
        ))}
      </div>
      {photoReviews.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No reviews yet</p>}
    </div>
  );
}

function AdminBroadcast() {
  const store = useStore();
  const { settings, setSettings, broadcastMessages, setBroadcastMessages } = store;
  const [title, setTitle] = useState(''); const [message, setMessage] = useState(''); const [type, setType] = useState<'info' | 'promo' | 'alert' | 'event'>('info');
  const [linkUrl, setLinkUrl] = useState(''); const [expiryDate, setExpiryDate] = useState(''); const [btnText, setBtnText] = useState('');
  const [scheduleDate, setScheduleDate] = useState(''); const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  const sendBroadcast = () => {
    if (!title.trim() || !message.trim()) { toast('❌ Title and message are required', 'error'); return; }
    const newMsg = {
      id: generateId(),
      title: title.trim(),
      message: message.trim(),
      icon: type === 'promo' ? '🎉' : type === 'alert' ? '⚠️' : type === 'event' ? '✨' : '📢',
      type, priority,
      link: linkUrl || undefined,
      linkText: btnText || undefined,
      expiresAt: expiryDate || undefined,
      scheduledAt: scheduleDate || undefined,
      createdAt: new Date().toISOString(),
      seen: false
    };
    const updated = [newMsg, ...broadcastMessages];
    setBroadcastMessages(updated);
    setSettings({ ...settings, broadcastMessages: updated } as any);
    settingsApi.update({ ...settings, broadcastMessages: updated });
    setTitle(''); setMessage(''); setLinkUrl(''); setBtnText(''); setExpiryDate(''); setScheduleDate('');
    toast('✅ Broadcast created! It will appear on the shop.', 'success');
    sendAdminTelegram(`📢 <b>New Broadcast</b>\n\n<b>${newMsg.title}</b>\n${newMsg.message}\n\nType: ${type} | Priority: ${priority}`);
  };

  const deleteBroadcast = (id: string) => {
    const updated = broadcastMessages.filter(m => m.id !== id);
    setBroadcastMessages(updated);
    setSettings({ ...settings, broadcastMessages: updated } as any);
    settingsApi.update({ ...settings, broadcastMessages: updated });
    toast('🗑️ Deleted', 'info');
  };

  const typeColors: Record<string, string> = {
    info: 'from-blue-500 to-blue-600',
    promo: 'from-orange-500 to-amber-600',
    alert: 'from-red-500 to-rose-600',
    event: 'from-purple-500 to-violet-600'
  };
  const priorityBadges: Record<string, string> = {
    normal: 'bg-slate-100 text-slate-600',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const scheduledCount = broadcastMessages.filter((m: any) => m.scheduledAt).length;
  const activeCount = broadcastMessages.filter((m: any) => !m.expiresAt || new Date(m.expiresAt) > new Date()).length;

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">📢 Broadcast Studio ({broadcastMessages.length})</h2>
          <p className="text-[10px] text-slate-500">Create, schedule and manage in-app announcements for all users</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[9px] font-semibold">{activeCount} active</span>
          {scheduledCount > 0 && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-semibold">{scheduledCount} scheduled</span>}
        </div>
      </div>

      {/* Create Form - Comprehensive */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">✍️ Create Campaign</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Title *</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="e.g. Weekend Mega Sale" value={title} onChange={e => setTitle(e.target.value)} maxLength={60} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Type</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="info">📢 Info - General</option>
                <option value="promo">🎉 Promo - Sales & Offers</option>
                <option value="alert">⚠️ Alert - Important</option>
                <option value="event">✨ Event - Announcements</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={priority} onChange={e => setPriority(e.target.value as any)}>
                <option value="normal">🟢 Normal</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Message *</label>
          <textarea className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-20" placeholder="Write your broadcast message here. Keep it concise (max 300 chars)." value={message} onChange={e => setMessage(e.target.value)} maxLength={300} />
          <div className="text-right text-[8px] text-slate-400">{message.length}/300</div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Link URL (optional)</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Button Text</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Learn More / Shop Now" value={btnText} onChange={e => setBtnText(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Expiry Date</label>
            <input type="date" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Schedule For</label>
            <input type="datetime-local" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-50" onClick={sendBroadcast} disabled={!title.trim() || !message.trim()}>
            {scheduleDate ? '📅 Schedule Broadcast' : '📢 Send to All Users'}
          </button>
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50" onClick={() => { setTitle(''); setMessage(''); setLinkUrl(''); setBtnText(''); setExpiryDate(''); setScheduleDate(''); }}>Clear</button>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold">Campaign History ({broadcastMessages.length})</h3>
          <div className="flex gap-1.5">
            <span className="text-[9px] px-2 py-1 rounded bg-blue-50 text-blue-700">📢 {broadcastMessages.filter((m: any) => m.type === 'info').length} Info</span>
            <span className="text-[9px] px-2 py-1 rounded bg-orange-50 text-orange-700">🎉 {broadcastMessages.filter((m: any) => m.type === 'promo').length} Promo</span>
            <span className="text-[9px] px-2 py-1 rounded bg-red-50 text-red-700">⚠️ {broadcastMessages.filter((m: any) => m.type === 'alert').length} Alert</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {broadcastMessages.slice(0, 30).length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400"><Megaphone size={32} className="mx-auto mb-2 text-slate-300" />No broadcasts yet. Create your first campaign above!</div>
          )}
          {broadcastMessages.slice(0, 30).map((m: any) => {
            const isExpired = m.expiresAt && new Date(m.expiresAt) < new Date();
            const isScheduled = m.scheduledAt && new Date(m.scheduledAt) > new Date();
            return (
              <div key={m.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0', typeColors[m.type])}>{m.icon || '📢'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold">{m.title}</span>
                      <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', priorityBadges[m.priority || 'normal'])}>{(m.priority || 'normal').toUpperCase()}</span>
                      {isExpired && <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">EXPIRED</span>}
                      {isScheduled && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">SCHEDULED</span>}
                      {m.seen ? '👁️' : '🆕'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.message}</div>
                    <div className="flex gap-3 text-[8px] text-slate-400 mt-1 flex-wrap">
                      <span>{new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                      <span className="capitalize">📁 {m.type}</span>
                      {m.link && <a href={m.link} className="text-indigo-500 underline" target="_blank">{m.linkText || 'Link'} ↗</a>}
                      {m.expiresAt && <span>⏳ Exp: {new Date(m.expiresAt).toLocaleDateString()}</span>}
                      {m.scheduledAt && <span>📅 {new Date(m.scheduledAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0" onClick={() => deleteBroadcast(m.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-indigo-600">{broadcastMessages.length}</div><div className="text-[9px] text-slate-500">Total Campaigns</div></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-green-600">{activeCount}</div><div className="text-[9px] text-slate-500">Active Now</div></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-orange-600">{scheduledCount}</div><div className="text-[9px] text-slate-500">Scheduled</div></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center"><div className="text-lg font-bold text-red-600">{broadcastMessages.filter((m: any) => m.priority === 'urgent').length}</div><div className="text-[9px] text-slate-500">Urgent</div></div>
      </div>
    </div>
  );
}

function AdminFlashDeals() {
  const store = useStore(); const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const flashSales = settings.flashSales || {};
  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-lg font-bold">⚡ Flash Deal Studio</h2><p className="text-[10px] text-slate-500">Create time-limited discounts to drive urgency</p></div>
        <span className="text-[9px] text-slate-400">{Object.values(flashSales).filter((d: any) => isFlashDealActive(d)).length} live now</span>
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">New Flash Deal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Product</label>
            <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-prod">
              <option value="">Select product...</option>
              {products.filter(p => p.inStock).map(p => <option key={p.id} value={p.id}>{p.nameEn} - {formatPrice(p.price)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Discount %</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {[10, 15, 20, 25, 30, 40, 50].map(n => (
                <button key={n} className="px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-medium hover:border-orange-400 hover:text-orange-600" onClick={() => { const el = document.getElementById('fd-discount') as HTMLInputElement; if (el) el.value = String(n); }}>{n}%</button>
              ))}
            </div>
            <input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-discount" placeholder="Custom %" defaultValue={20} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
            <input type="datetime-local" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-end" />
            <div className="flex gap-1 mt-1 flex-wrap">
              {[1, 3, 6, 12, 24, 48, 72].map(h => (
                <button key={h} className="px-2 py-1 rounded border border-slate-200 text-[8px] font-medium hover:border-orange-400" onClick={() => { const el = document.getElementById('fd-end') as HTMLInputElement; if (el) { const d = new Date(Date.now() + h * 3600000); el.value = d.toISOString().slice(0, 16); } }}>{h}h</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Max Quantity</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-qty" defaultValue={50} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Deal Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-name" placeholder="e.g. Midnight Madness" /></div>
          <div className="flex items-end">
            <button className="w-full p-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-bold hover:shadow-lg" onClick={() => {
              const pid = (document.getElementById('fd-prod') as HTMLSelectElement)?.value;
              const end = (document.getElementById('fd-end') as HTMLInputElement)?.value;
              if (!pid || !end) { toast('❌ Select product and end time', 'error'); return; }
              const discount = Number((document.getElementById('fd-discount') as HTMLInputElement)?.value) || 20;
              const maxQty = Number((document.getElementById('fd-qty') as HTMLInputElement)?.value) || 50;
              const name = (document.getElementById('fd-name') as HTMLInputElement)?.value || '';
              const p = products.find(x => x.id === Number(pid));
              saveSetting('flashSales', { ...flashSales, [pid]: { end: new Date(end).getTime(), startedAt: Date.now(), discount, maxQty, name: name || undefined } });
              toast('⚡ Flash deal created! ' + discount + '% off', 'success');
              sendAdminTelegram(`⚡ <b>Flash Deal Created!</b>\n\n📦 ${p?.nameEn || 'Product'}\n💰 ${discount}% OFF\n⏰ Ends: ${new Date(end).toLocaleString()}\n📊 Max: ${maxQty} units`);
            }}>⚡ Launch Deal</button>
          </div>
        </div>
      </div>

      {/* Active Deals */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Active Deals ({Object.keys(flashSales).length})</h3>
        </div>
        {Object.keys(flashSales).length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No flash deals. Launch one above!</p> :
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(flashSales).map(([pid, d]: any) => {
              const p = products.find(x => x.id === Number(pid));
              const active = isFlashDealActive(d);
              return <div key={pid} className={cn('flex items-center gap-3 p-3 rounded-xl border overflow-x-hidden', active ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' : 'border-slate-200 dark:border-slate-700')}>
                <img src={p?.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{p?.nameEn || '#' + pid}</div>
                  <div className="flex gap-2 text-[9px] text-slate-500 mt-0.5 flex-wrap">
                    <span className={active ? 'text-green-600 font-semibold' : 'text-slate-400'}>{active ? formatCountdown(d.end) : 'Expired'}</span>
                    <span className="text-red-500 font-bold">-{d.discount || 20}%</span>
                    <span>Max: {d.maxQty || 50}</span>
                    {d.name && <span className="text-indigo-500">🎯 {d.name}</span>}
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0" onClick={() => { const fs = { ...flashSales }; delete fs[pid]; saveSetting('flashSales', fs); toast('🗑️ Removed', 'info'); }}><Trash2 size={12} /></button>
              </div>;
            })}
          </div>
        }
      </div>
    </div>
  );
}

function AdminPreOrders() {
  const store = useStore(); const { preOrders, settings, setSettings } = store;
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">🚀 Pre-Orders ({preOrders.length})</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">⚙️ Settings</h3>
        <label className="flex items-center gap-2 text-xs mb-3"><input type="checkbox" checked={settings.preOrderEnabled !== false} onChange={e => saveSetting('preOrderEnabled', e.target.checked)} className="rounded" /> Enable Pre-Orders</label>
        <div className="flex items-center gap-3"><span className="text-xs">Default Deposit %:</span><input type="number" className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={settings.preOrderDefaultDeposit || 30} onChange={e => saveSetting('preOrderDefaultDeposit', Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2">{preOrders.slice(0, 20).map(po => (
        <div key={po.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{po.orderNumber}</span><span className="text-[9px] px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 font-semibold">{po.status}</span></div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{po.productName} · Deposit: {formatPrice(po.deposit)} {po.releaseDate ? `· Release: ${new Date(po.releaseDate).toLocaleDateString()}` : ''}</div>
        </div>
      ))}{preOrders.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No pre-orders yet</p>}</div>
    </div>
  );
}

function AdminTracking() {
  const store = useStore(); const { orders, orderTracking, setOrderTracking } = store;
  const [selectedOrder, setSelectedOrder] = useState(''); const [carrier, setCarrier] = useState('Ethio Express'); const [trackingNum, setTrackingNum] = useState('');
  const addTracking = () => {
    if (!selectedOrder) { toast('❌ Select an order first', 'error'); return; }
    setOrderTracking(selectedOrder, {
      carrier, trackingNumber: trackingNum || `ET-${Date.now().toString(36).toUpperCase()}`,
      status: 'shipped', lastUpdate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toLocaleDateString(),
      coordinates: { lat: 9.03, lng: 38.74 },
      timeline: [
        { label: 'Order Placed', time: new Date().toLocaleString(), completed: true, location: 'Addis Ababa' },
        { label: 'Processing', time: new Date().toLocaleString(), completed: true, location: 'Warehouse' },
        { label: 'In Transit', time: '', completed: false },
        { label: 'Out for Delivery', time: '', completed: false },
        { label: 'Delivered', time: '', completed: false },
      ]
    });
    toast('✅ Tracking added!', 'success');
  };
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">📍 Order Tracking</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">Add Tracking to Order</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent col-span-3" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}>
            <option value="">Select order...</option>
            {orders.map(o => <option key={o.orderNumber} value={o.orderNumber}>{o.orderNumber} - {o.customer?.name}</option>)}
          </select>
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} />
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Tracking #" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
          <button className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={addTracking}>+ Add Tracking</button>
        </div>
      </div>
      <div className="space-y-2">{Object.entries(orderTracking).slice(0, 10).map(([on, t]: any) => (
        <div key={on} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{on}</span><span className="text-[9px] text-slate-400">{t.carrier}</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">#{t.trackingNumber} · ETA: {t.estimatedDelivery}</div>
        </div>
      ))}{Object.keys(orderTracking).length === 0 && <p className="text-xs text-slate-400 text-center py-8">No tracking records</p>}</div>
    </div>
  );
}

function AdminThemes() {
  const store = useStore(); const { themePreset, setThemePreset, customAccent, setCustomAccent, darkMode, setDarkMode } = store;
  const THEMES = [
    { id: 'default' as const, name: 'Default', colors: ['#6C63FF', '#8B5CF6', '#4F46E5'], icon: '💎', desc: 'Classic indigo' },
    { id: 'ocean' as const, name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#0284C7'], icon: '🌊', desc: 'Cool blue tones' },
    { id: 'forest' as const, name: 'Forest', colors: ['#10B981', '#34D399', '#059669'], icon: '🌿', desc: 'Natural green' },
    { id: 'sunset' as const, name: 'Sunset', colors: ['#F59E0B', '#F97316', '#D97706'], icon: '🌅', desc: 'Warm orange' },
    { id: 'midnight' as const, name: 'Midnight', colors: ['#6366F1', '#818CF8', '#4338CA'], icon: '🌙', desc: 'Deep night' },
    { id: 'rose' as const, name: 'Rose', colors: ['#EC4899', '#F43F5E', '#DB2777'], icon: '🌹', desc: 'Elegant pink' },
  ];
  const applyTheme = (preset: typeof THEMES[0]['id']) => {
    setThemePreset(preset);
    const t = THEMES.find(x => x.id === preset);
    if (t) {
      localStorage.setItem('ss_theme', JSON.stringify(preset));
      const root = document.documentElement;
      root.style.setProperty('--color-primary', t.colors[0]);
      root.style.setProperty('--color-primary-foreground', '#ffffff');
      root.style.setProperty('--color-ring', t.colors[0] + '40');
      root.style.setProperty('--primary-hex', t.colors[0]);
      root.style.setProperty('--accent-hex', t.colors[1]);
      root.style.setProperty('--accent-color', t.colors[1]);
      toast('🎨 Theme applied: ' + t.name, 'success');
    }
  };
  const currentTheme = THEMES.find(t => t.id === themePreset) || THEMES[0];
  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-lg font-bold">🎨 Store Theme Studio</h2><p className="text-[10px] text-slate-500">Customize colors for the CUSTOMER-FACING storefront. (Admin panel colors are in "Admin Theme" tab.)</p></div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1', !darkMode ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => { localStorage.setItem('ss_dark', 'false'); document.documentElement.classList.remove('dark'); setDarkMode(false); }}><Sun size={12} /> Light</button>
          <button className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1', darkMode ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => { localStorage.setItem('ss_dark', 'true'); document.documentElement.classList.add('dark'); setDarkMode(true); }}><Moon size={12} /> Dark</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEMES.map(t => (
          <button key={t.id} className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all', themePreset === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900')} onClick={() => applyTheme(t.id)}>
            <div className="flex gap-1">{t.colors.map((c, i) => <div key={i} className="w-6 h-6 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: c }} />)}</div>
            <span className="text-[11px] font-medium">{t.icon} {t.name}</span>
            <span className="text-[8px] text-slate-400">{t.desc}</span>
            {themePreset === t.id && <Check size={14} className="text-indigo-600" />}
          </button>
        ))}
      </div>

      {/* Live Preview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800"><h3 className="text-sm font-bold">👁️ Live Preview</h3></div>
        <div className="p-4">
          <div className="max-w-xs mx-auto rounded-xl border overflow-hidden shadow-lg" style={{ borderColor: currentTheme.colors[0] + '40' }}>
            <div className="h-24 flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, ' + currentTheme.colors[0] + ', ' + currentTheme.colors[1] + ')' }}>
              Smart Shop
            </div>
            <div className="p-3 space-y-2 bg-white dark:bg-slate-800">
              <div className="flex gap-1 flex-wrap"><span className="text-[9px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: currentTheme.colors[0] }}>NEW</span><span className="text-[9px] text-slate-400">Premium Product</span></div>
              <div className="text-lg font-bold" style={{ color: currentTheme.colors[0] }}>Br 2,499</div>
              <button className="w-full py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, ' + currentTheme.colors[0] + ', ' + currentTheme.colors[1] + ')' }}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Accent */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4 flex-wrap overflow-x-hidden">
        <div className="flex items-center gap-3">
          <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-0" value={customAccent} onChange={e => setCustomAccent(e.target.value)} />
          <div><div className="text-xs font-semibold">Custom Accent</div><div className="text-[9px] text-slate-400 font-mono">{customAccent}</div></div>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: customAccent }}
          onClick={() => {
            const root = document.documentElement;
            root.style.setProperty('--color-primary', customAccent);
            root.style.setProperty('--color-ring', customAccent + '40');
            root.style.setProperty('--primary-hex', customAccent);
            root.style.setProperty('--accent-hex', customAccent);
            localStorage.setItem('ss_accent', JSON.stringify(customAccent));
            toast('✅ Custom accent applied!', 'success');
          }}>Apply Accent</button>
      </div>
    </div>
  );
}

function AdminSettings() {
  const store = useStore(); const { settings, setSettings, darkMode, setDarkMode } = store;
  const [commission, setCommission] = useState(settings.vendorCommission || 10);
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 50);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThreshold || 1000);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(settings.priceAlertEnabled !== false);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const gameSettings = (settings as any)?.gameSettings || {};
  const wheelSegments = (settings as any)?.wheelSegments || [];

  const updateGameSetting = (key: string, val: any) => { saveSetting('gameSettings', { ...gameSettings, [key]: val }); };
  const updateWheelSegment = (idx: number, field: string, val: any) => {
    const updated = [...wheelSegments];
    updated[idx] = { ...updated[idx], [field]: val };
    saveSetting('wheelSegments', updated);
  };
  const addWheelSegment = () => { saveSetting('wheelSegments', [...wheelSegments, { label: '🎁 New Prize', color: '#6366F1', value: 50 }]); };
  const removeWheelSegment = (idx: number) => { if (wheelSegments.length > 2) saveSetting('wheelSegments', wheelSegments.filter((_: any, i: number) => i !== idx)); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><SettingsIcon size={20} /> Settings</h2>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">💰 Commission & Delivery</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Vendor Commission %</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Delivery Fee (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Free Delivery Over</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={freeThreshold} onChange={e => setFreeThreshold(Number(e.target.value))} /></div>
        </div>
        <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={() => { saveSetting('vendorCommission', commission); saveSetting('deliveryFee', deliveryFee); saveSetting('freeDeliveryThreshold', freeThreshold); toast('✅ Settings saved!', 'success'); notifySettingsChanged(`Commission: ${commission}%\nDelivery Fee: Br ${deliveryFee}\nFree Delivery: Br ${freeThreshold}`); }}>💾 Save Settings</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3">🎨 Appearance</h3>
        <div className="flex gap-3 mb-4">
          <button className={cn('flex-1 py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all', !darkMode ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500')} onClick={() => { 
            localStorage.setItem('ss_dark', 'false'); 
            document.documentElement.classList.remove('dark');
            setDarkMode(false);
            // Force reload so index.html inline script cleans old injected CSS
            setTimeout(() => window.location.reload(), 100);
          }}>☀️ Light</button>
          <button className={cn('flex-1 py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all', darkMode ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500')} onClick={() => { 
            localStorage.setItem('ss_dark', 'true'); 
            document.documentElement.classList.add('dark');
            setDarkMode(true);
          }}>🌙 Dark</button>
        </div>
        <h3 className="text-sm font-bold mb-3">🔔 Features & Toggles</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={priceAlertEnabled} onChange={e => { setPriceAlertEnabled(e.target.checked); saveSetting('priceAlertEnabled', e.target.checked); }} className="rounded" /> Enable Price Drop Alerts</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.affiliateEnabled !== false} onChange={e => saveSetting('affiliateEnabled', e.target.checked)} className="rounded" /> Enable Affiliate Program</label>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
            <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-2">🛠️ System Toggles</h4>
            <label className="flex items-center gap-2 text-xs mb-2"><input type="checkbox" checked={settings.chapaTestMode !== false} onChange={e => saveSetting('chapaTestMode', e.target.checked)} className="rounded" /> Chapa Test Mode (sandbox for testing without license)</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.marketplaceMode !== false} onChange={e => saveSetting('marketplaceMode', e.target.checked)} className="rounded" /> Marketplace Mode (show "Become a Vendor" on shop)</label>
          </div>
          <div className="mt-2 flex items-center gap-3"><span className="text-xs">Affiliate Commission %:</span><input type="number" className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={settings.affiliateCommission || 10} onChange={e => saveSetting('affiliateCommission', Number(e.target.value))} /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Gamepad2 size={16} /> Game & Loyalty Settings</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Min Points for Cash</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.minPointsForCash || 100} onChange={e => updateGameSetting('minPointsForCash', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate (pts→Br)</label><input type="number" step="0.1" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.pointsToCashRate || 0.5} onChange={e => updateGameSetting('pointsToCashRate', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Daily Spins</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.spinsPerDay || 1} onChange={e => updateGameSetting('spinsPerDay', Number(e.target.value))} /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Wheel Font Size</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={gameSettings.wheelFontSize || 20} onChange={e => updateGameSetting('wheelFontSize', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Wheel Font Color</label><input type="color" className="w-full mt-1 h-9 rounded-lg cursor-pointer border-0" value={gameSettings.wheelFontColor || '#ffffff'} onChange={e => updateGameSetting('wheelFontColor', e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Show Emoji</label><label className="flex items-center gap-2 text-xs mt-2"><input type="checkbox" checked={gameSettings.wheelShowEmoji !== false} onChange={e => updateGameSetting('wheelShowEmoji', e.target.checked)} className="rounded" /> Show emoji on wheel</label></div>
        </div>
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Wheel Segments ({wheelSegments.length || 10})</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(wheelSegments.length > 0 ? wheelSegments : [
            { label: '🚚 Free Delivery', color: '#e53e3e', value: 0 }, { label: '💰 Br 50 Off', color: '#dd6b20', value: 50 },
            { label: '💎 Br 100 Off', color: '#d69e2e', value: 100 }, { label: '🎯 10% Off', color: '#38a169', value: 10 },
            { label: '🔥 15% Off', color: '#3182ce', value: 15 }, { label: '⭐ 25% Off', color: '#805ad5', value: 25 },
            { label: '🏆 50 Pts', color: '#ed64a6', value: 50 }, { label: '👑 100 Pts', color: '#0bc5ea', value: 100 },
            { label: '🔄 Try Again', color: '#a0aec0', value: 0 }, { label: '🎁 Br 20 Off', color: '#e53e3e', value: 20 },
          ]).map((seg: any, i: number) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-[9px] font-bold text-slate-400 w-5">{i + 1}</span>
              <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={seg.label} onChange={e => updateWheelSegment(i, 'label', e.target.value)} />
              <input type="color" className="w-7 h-7 rounded-lg cursor-pointer border-0" value={seg.color} onChange={e => updateWheelSegment(i, 'color', e.target.value)} />
              <input type="number" className="w-16 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={seg.value} onChange={e => updateWheelSegment(i, 'value', Number(e.target.value))} />
              <button className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeWheelSegment(i)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
        <button className="mt-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-[10px] text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all w-full" onClick={addWheelSegment}>+ Add Segment</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🔥 Streak</h3>
          <div className="space-y-3">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Streak Days</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.streakDays || 7} onChange={e => updateGameSetting('streakDays', Number(e.target.value))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Daily Bonus Points</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.streakBonus || 10} onChange={e => updateGameSetting('streakBonus', Number(e.target.value))} /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden" data-admin-card>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🎁 Mystery Box</h3>
          <div className="space-y-3">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Boxes per Purchase</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.boxesPerPurchase || 1} onChange={e => updateGameSetting('boxesPerPurchase', Number(e.target.value))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Max Prize (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.maxBoxPrize || 1000} onChange={e => updateGameSetting('maxBoxPrize', Number(e.target.value))} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
