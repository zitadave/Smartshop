import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { Store, Package, ShoppingCart, TrendingUp, Settings, LogOut, Menu, X, BarChart3, Plus, Edit3, Eye, EyeOff } from 'lucide-react';

type VendorTab = 'overview' | 'products' | 'orders' | 'analytics' | 'settings';

export default function VendorDashboard() {
  const [tab, setTab] = useState<VendorTab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const store = useStore();
  const { products } = store;

  // Filter products for this vendor (use first product's vendor as demo)
  const vendorId = 1;
  const vendorProducts = products.filter(p => p.vendorId === vendorId);
  const vendorName = vendorProducts[0]?.vendorName || 'Your Store';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-2">
          <button className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">🏪</div>
            <div>
              <div className="text-sm font-bold">{vendorName}</div>
              <div className="text-[7px] text-slate-400 uppercase tracking-widest">Vendor Dashboard</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => navigate('/')}>Back to Store</button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-12 left-0 bottom-0 w-52 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="py-2 px-1.5 space-y-0.5">
          {[
            { id: 'overview' as VendorTab, icon: BarChart3, label: 'Overview' },
            { id: 'products' as VendorTab, icon: Package, label: 'My Products' },
            { id: 'orders' as VendorTab, icon: ShoppingCart, label: 'Orders' },
            { id: 'analytics' as VendorTab, icon: TrendingUp, label: 'Analytics' },
            { id: 'settings' as VendorTab, icon: Settings, label: 'Settings' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all', tab === item.id ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                <Icon size={15} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 dark:border-slate-800">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50" onClick={() => { store.setProfile({ name: '', phone: '', registered: false, joinedAt: '' }); navigate('/'); }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="lg:ml-52 pt-12 min-h-screen">
        <div className="p-4 max-w-6xl mx-auto">
          {tab === 'overview' && <VendorOverview products={vendorProducts} />}
          {tab === 'products' && <VendorProducts products={vendorProducts} />}
          {tab === 'orders' && <VendorOrders />}
          {tab === 'analytics' && <VendorAnalytics products={vendorProducts} />}
          {tab === 'settings' && <VendorSettings />}
        </div>
      </main>
    </div>
  );
}

function VendorOverview({ products }: { products: any[] }) {
  const totalSales = products.reduce((s, p) => s + (p.soldCount || 0), 0);
  const totalRevenue = products.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
  const lowStock = products.filter(p => p.stockCount <= 5);

  return (
    <div className="space-y-4 animate-fadeUp">
      <h2 className="text-lg font-bold">📊 Vendor Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Products', val: products.length, icon: '📦', color: 'blue' },
          { label: 'Sales', val: totalSales, icon: '🛍️', color: 'green' },
          { label: 'Revenue', val: `Br ${totalRevenue.toLocaleString()}`, icon: '💰', color: 'emerald' },
          { label: 'Low Stock', val: lowStock.length, icon: '⚠️', color: 'red' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{s.val}</div>
            <div className="text-[9px] text-slate-500 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-4">
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2">⚠️ Low Stock Alert</h3>
          {lowStock.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800/20 last:border-0">
              <span>{p.nameEn}</span>
              <span className="ml-auto font-bold">{p.stockCount} left</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
        <div className="text-[10px] opacity-80">Quick Tip</div>
        <div className="text-sm font-bold mt-1">Use high-quality product images to increase sales by up to 30%!</div>
      </div>
    </div>
  );
}

function VendorProducts({ products }: { products: any[] }) {
  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📦 My Products ({products.length})</h2>
        <button className="px-3 py-2 bg-primary text-white rounded-xl text-[10px] font-bold flex items-center gap-1"><Plus size={12} /> Add Product</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{p.nameEn}</div>
                <div className="text-[9px] text-slate-400">{formatPrice(p.price)} · {p.soldCount || 0} sold · Stock: {p.stockCount}</div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Eye size={13} /></button>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No products yet. Add your first product!</p>}
      </div>
    </div>
  );
}

function VendorOrders() {
  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold mb-4">📋 Orders</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="text-xs text-slate-400">No orders yet</p>
        <p className="text-[9px] text-slate-400 mt-1">Orders will appear here when customers purchase your products</p>
      </div>
    </div>
  );
}

function VendorAnalytics({ products }: { products: any[] }) {
  const totalRevenue = products.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold mb-4">📈 Analytics</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Revenue', val: `Br ${totalRevenue.toLocaleString()}`, change: '+12%' },
          { label: 'Total Sales', val: `${products.reduce((s, p) => s + (p.soldCount || 0), 0)}`, change: '+8%' },
          { label: 'Avg. Rating', val: `${(products.reduce((s, p) => s + (p.rating || 0), 0) / (products.length || 1)).toFixed(1)}`, change: '+0.2' },
          { label: 'Conversion', val: '3.2%', change: '+0.5%' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-[9px] text-slate-500">{s.label}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{s.val}</div>
            <span className="text-[9px] text-green-600 font-semibold">{s.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorSettings() {
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold mb-4">⚙️ Vendor Settings</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Store Profile</h3>
        <div className="space-y-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" defaultValue="Your Store Name" /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Contact Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" defaultValue="vendor@store.com" /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" defaultValue="+251-911-XXXXXX" /></div>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save Changes</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Commission Rate</h3>
        <p className="text-xs text-slate-500">Your current commission rate: <strong className="text-slate-800 dark:text-slate-200">10%</strong></p>
      </div>
    </div>
  );
}
