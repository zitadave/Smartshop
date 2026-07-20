import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, ordersApi, analyticsApi, vendorsApi, settingsApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Settings as SettingsIcon,
  TrendingUp, Users, MessageSquare, BarChart3, Shield, LogOut, Menu, X,
  Bell, Rocket, Tags, Scale, Calendar, ClipboardList, ChevronRight
} from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'coupons' | 'disputes' | 'subscriptions' | 'audit' | 'settings';

const NAV_ITEMS: { id: Tab; icon: any; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'products', icon: Package, label: 'Products' },
  { id: 'orders', icon: ShoppingCart, label: 'Orders' },
  { id: 'vendors', icon: Store, label: 'Vendors' },
  { id: 'marketplace', icon: Rocket, label: 'Marketplace' },
  { id: 'coupons', icon: Tags, label: 'Coupons' },
  { id: 'disputes', icon: Scale, label: 'Disputes' },
  { id: 'subscriptions', icon: Calendar, label: 'Subscriptions' },
  { id: 'audit', icon: ClipboardList, label: 'Audit' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
];

export default function AdminLayout() {
  const [tab, setTab] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center px-3 z-50 gap-2 shadow-lg">
        <button className="lg:hidden p-1.5" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="text-base">🏪</span>
        <div>
          <span className="text-sm font-bold">Admin Panel</span>
          <span className="text-[8px] opacity-60 block -mt-0.5">Smart Shop Management</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{tab}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-12 left-0 bottom-0 w-56 bg-card border-r border-border z-40 transition-transform duration-200 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
        <div className="py-2 px-1.5 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                  tab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                onClick={() => { setTab(item.id); setMenuOpen(false); }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted" onClick={() => window.location.href = '/'}>
            <LogOut size={14} /> Back to Shop
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main */}
      <main className="lg:ml-56 pt-12 min-h-screen">
        <div className="p-3 max-w-6xl mx-auto">
          {tab === 'overview' && <Overview />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'vendors' && <AdminVendors />}
          {tab === 'marketplace' && <AdminMarketplace />}
          {tab === 'coupons' && <AdminCoupons />}
          {tab === 'disputes' && <AdminDisputes />}
          {tab === 'subscriptions' && <AdminSubscriptions />}
          {tab === 'audit' && <AdminAudit />}
          {tab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Overview() {
  const [data, setData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
  }, []);

  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);
  const top = data.topProducts || [];
  const stats = [
    { label: 'Products', val: data.totalProducts || 0, sub: `${data.totalSold || 0} sold`, color: 'text-blue-600' },
    { label: 'Revenue', val: `Br ${(data.totalRevenue || 0).toLocaleString()}`, sub: `${data.totalOrders || 0} orders`, color: 'text-green-600' },
    { label: 'Pending', val: data.pendingOrders || 0, sub: `${data.shippedOrders || 0} shipped`, color: 'text-orange-600' },
    { label: 'Low Stock', val: lowStock.length, sub: 'items', color: 'text-red-600' },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📊 Dashboard</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className={cn('text-xl font-extrabold mt-0.5', s.color)}>{s.val}</div>
            <div className="text-[9px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Low Stock */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">⚠️ Low Stock</h3>
        {lowStock.length === 0 ? <p className="text-xs text-muted-foreground">All stocked</p> : (
          lowStock.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
              <img src={p.image} className="w-8 h-8 rounded object-cover" />
              <span className="flex-1">{p.nameEn}</span>
              <span className="text-orange-600 font-semibold">{p.stockCount} left</span>
            </div>
          ))
        )}
      </div>

      {/* Top Products */}
      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-xs font-semibold mb-2">🏆 Top Selling</h3>
        {top.length === 0 ? <p className="text-xs text-muted-foreground">No data</p> : (
          top.slice(0, 5).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
              <span className="text-green-600 font-bold w-5">{i + 1}.</span>
              <span className="flex-1">{p.name}</span>
              <span className="text-muted-foreground">{p.sold} sold</span>
              <span className="font-semibold">Br {p.revenue?.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== PRODUCTS ====================
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<any>(null);

  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);

  const filtered = products.filter(p =>
    !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVisibility = async (id: number, visible: boolean) => {
    await productsApi.update(id, { visible: !visible });
    setProducts(products.map(p => p.id === id ? { ...p, visible: !visible } : p));
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await productsApi.delete(id);
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">📦 Products ({products.length})</h2>
      </div>
      <input
        className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-3"
        placeholder="🔍 Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="space-y-1.5">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-2.5 flex items-center gap-2.5">
            <img src={p.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{p.nameEn}</div>
              <div className="text-[10px] text-muted-foreground">
                Br {p.price?.toLocaleString()} · {p.category} · Stock: {p.stockCount}
                {p.visible === false && <span className="text-orange-500 ml-1">· Hidden</span>}
              </div>
            </div>
            <button className={cn('px-2 py-1 rounded text-[9px] font-semibold', p.visible !== false ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')} onClick={() => toggleVisibility(p.id, p.visible)}>
              {p.visible !== false ? 'Visible' : 'Hidden'}
            </button>
            <button className="px-2 py-1 rounded text-[9px] bg-muted text-muted-foreground" onClick={() => setEditProduct(p)}>✏️</button>
            <button className="px-2 py-1 rounded text-[9px] bg-red-50 text-red-600" onClick={() => deleteProduct(p.id)}>🗑️</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No products found</p>}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center" onClick={() => setEditProduct(null)}>
          <div className="bg-card rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 lg:hidden" />
            <h3 className="text-sm font-bold mb-3">✏️ Edit: {editProduct.nameEn}</h3>
            <div className="space-y-2">
              <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" defaultValue={editProduct.nameEn} placeholder="Name (EN)" onChange={e => setEditProduct({ ...editProduct, nameEn: e.target.value })} />
              <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" defaultValue={editProduct.name} placeholder="Name (AM)" onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
              <div className="flex gap-2">
                <input className="flex-1 p-2 border border-input rounded-lg text-xs bg-card" type="number" defaultValue={editProduct.price} placeholder="Price" onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} />
                <input className="flex-1 p-2 border border-input rounded-lg text-xs bg-card" type="number" defaultValue={editProduct.stockCount} placeholder="Stock" onChange={e => setEditProduct({ ...editProduct, stockCount: Number(e.target.value) })} />
              </div>
              <select className="w-full p-2 border border-input rounded-lg text-xs bg-card" defaultValue={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}>
                {['electronics', 'fashion', 'home', 'beauty', 'groceries', 'books', 'sports', 'baby'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea className="w-full p-2 border border-input rounded-lg text-xs bg-card" rows={2} defaultValue={editProduct.descriptionEn} placeholder="Description" onChange={e => setEditProduct({ ...editProduct, descriptionEn: e.target.value })} />
              <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" defaultValue={editProduct.image} placeholder="Image URL" onChange={e => setEditProduct({ ...editProduct, image: e.target.value })} />
              <button className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-semibold" onClick={async () => {
                await productsApi.update(editProduct.id, editProduct);
                setProducts(products.map(p => p.id === editProduct.id ? editProduct : p));
                setEditProduct(null);
              }}>💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ORDERS ====================
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { ordersApi.list().then(d => setOrders(d?.orders || [])).catch(() => {}); }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const updateStatus = async (orderNumber: string, status: string) => {
    await ordersApi.updateStatus(orderNumber, status);
    setOrders(orders.map(o => o.orderNumber === orderNumber ? { ...o, status } : o));
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📋 Orders ({orders.length})</h2>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-3">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(s => (
          <button key={s} className={cn('px-2.5 py-1 rounded-full text-[9px] font-medium whitespace-nowrap border', filter === s ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.orderNumber} className="bg-card rounded-xl border border-border p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-primary font-mono">{o.orderNumber}</span>
              <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold', o.status === 'completed' || o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600')}>{o.status}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {o.customer?.name} | {o.customer?.phone} | {o.customer?.city} | Br {(o.total || 0).toLocaleString()}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {o.status === 'confirmed' && <button className="px-2 py-1 rounded text-[9px] bg-blue-100 text-blue-700" onClick={() => updateStatus(o.orderNumber, 'processing')}>Process</button>}
              {o.status === 'processing' && <button className="px-2 py-1 rounded text-[9px] bg-blue-100 text-blue-700" onClick={() => updateStatus(o.orderNumber, 'shipped')}>Ship</button>}
              {o.status === 'shipped' && <button className="px-2 py-1 rounded text-[9px] bg-green-100 text-green-700" onClick={() => updateStatus(o.orderNumber, 'delivered')}>Delivered</button>}
              {o.status === 'delivered' && <button className="px-2 py-1 rounded text-[9px] bg-green-100 text-green-700" onClick={() => updateStatus(o.orderNumber, 'completed')}>Complete</button>}
              <button className="px-2 py-1 rounded text-[9px] bg-red-50 text-red-600" onClick={() => updateStatus(o.orderNumber, 'cancelled')}>Cancel</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No orders</p>}
      </div>
    </div>
  );
}

// ==================== VENDORS ====================
function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    vendorsApi.list().then(d => setVendors(d?.vendors || [])).catch(() => {});
    settingsApi.get().then(d => setSettings(d?.settings || {})).catch(() => {});
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await vendorsApi.update(id, { status });
    setVendors(vendors.map(v => v.id === id ? { ...v, status } : v));
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🏪 Vendors ({vendors.length})</h2>
      <div className="space-y-2">
        {vendors.map(v => (
          <div key={v.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <div className="flex-1">
              <div className="text-xs font-semibold">{v.shopName}</div>
              <div className="text-[10px] text-muted-foreground">{v.name} | {v.phone} | Comm: {v.commission}%</div>
            </div>
            <select
              className={cn('px-2 py-1 rounded text-[9px] font-semibold border', v.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : v.status === 'suspended' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-orange-100 text-orange-600 border-orange-200')}
              value={v.status}
              onChange={e => updateStatus(v.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspend</option>
            </select>
          </div>
        ))}
        {vendors.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No vendors</p>}
      </div>
    </div>
  );
}

// ==================== SETTINGS ====================
function AdminSettings() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => { settingsApi.get().then(d => setSettings(d?.settings || {})).catch(() => {}); }, []);

  const save = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    await settingsApi.update(updated);
    setSettings(updated);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">⚙️ Settings</h2>
      <div className="space-y-3">
        {/* Vendor Settings */}
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="text-xs font-semibold mb-3">🏪 Vendor Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-xs">
              <input type="checkbox" className="w-4 h-4" checked={settings.vendorRegistration !== false} onChange={e => save('vendorRegistration', e.target.checked)} />
              Enable Vendor Registration
            </label>
            <div>
              <label className="text-[10px] text-muted-foreground">Commission Rates</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['standard', 'new', 'hot', 'bestseller', 'popular', 'premium'].map(key => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-[9px] capitalize flex-1">{key}</span>
                    <input type="number" className="w-14 p-1.5 border border-input rounded text-[10px] bg-card text-center"
                      value={settings.commissionRates?.[key] || (key === 'hot' || key === 'bestseller' ? 15 : key === 'new' || key === 'sale' ? 10 : 5)}
                      onChange={e => {
                        const rates = { ...(settings.commissionRates || {}), [key]: Number(e.target.value) };
                        save('commissionRates', rates);
                      }}
                    /><span className="text-[9px]">%</span>
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 text-xs">
              <input type="checkbox" className="w-4 h-4" checked={settings.vendorApproval !== false} onChange={e => save('vendorApproval', e.target.checked)} />
              Products need approval
            </label>
          </div>
        </div>

        {/* Store Settings */}
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="text-xs font-semibold mb-3">🏬 Store Settings</h3>
          <div className="space-y-2">
            <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" defaultValue={settings.storeName || 'Smart Shop'} placeholder="Store Name" onChange={e => save('storeName', e.target.value)} />
            <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" type="number" defaultValue={settings.deliveryFee || 0} placeholder="Delivery Fee" onChange={e => save('deliveryFee', Number(e.target.value))} />
            <input className="w-full p-2 border border-input rounded-lg text-xs bg-card" type="number" defaultValue={settings.minOrder || 0} placeholder="Min Order" onChange={e => save('minOrder', Number(e.target.value))} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MARKETPLACE ====================
function AdminMarketplace() {
  const [settings, setSettings] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    settingsApi.get().then(d => setSettings(d?.settings || {})).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    await settingsApi.update(updated);
    setSettings(updated);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🚀 Marketplace</h2>
      
      {/* Flash Sales */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">🔥 Flash Sales</h3>
        <div className="text-[10px] text-muted-foreground mb-2">Set time-limited sales with countdown timers</div>
        <div className="space-y-1.5">
          {Object.entries(settings.flashSales || {}).map(([pid, sale]: any) => {
            const p = products.find(x => x.id === Number(pid));
            const remaining = Math.max(0, Math.floor((sale.end - Date.now()) / 1000));
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <span>🔥</span>
                <span className="flex-1">{p?.nameEn || `#${pid}`}</span>
                <span className="text-red-500">{remaining}s</span>
                <button className="text-red-500 text-[9px]" onClick={() => {
                  const fs = { ...settings.flashSales };
                  delete fs[pid];
                  saveSetting('flashSales', fs);
                }}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <select className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="fs-prod">
            <option value="">Select product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <input type="datetime-local" className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="fs-end" />
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => {
            const pid = (document.getElementById('fs-prod') as HTMLSelectElement)?.value;
            const end = (document.getElementById('fs-end') as HTMLInputElement)?.value;
            if (!pid || !end) return alert('Select product and end time');
            const flash = { ...(settings.flashSales || {}), [pid]: { end: new Date(end).getTime(), startedAt: Date.now() } };
            saveSetting('flashSales', flash);
          }}>+ Add</button>
        </div>
      </div>

      {/* Sponsored */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">💼 Sponsored Products</h3>
        <div className="space-y-1.5">
          {(settings.sponsoredProducts || []).map((pid: number) => {
            const p = products.find(x => x.id === pid);
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <span>💼</span>
                <span className="flex-1">{p?.nameEn || `#${pid}`}</span>
                <button className="text-red-500 text-[9px]" onClick={() => saveSetting('sponsoredProducts', (settings.sponsoredProducts || []).filter((x: number) => x !== pid))}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <select className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="sp-prod">
            <option value="">Select product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => {
            const pid = (document.getElementById('sp-prod') as HTMLSelectElement)?.value;
            if (!pid) return;
            saveSetting('sponsoredProducts', [...(settings.sponsoredProducts || []), Number(pid)]);
          }}>+ Add</button>
        </div>
      </div>

      {/* Bundles */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">🎁 Bundle Deals</h3>
        <div className="space-y-1.5">
          {Object.entries(settings.bundleDeals || {}).map(([pid, b]: any) => {
            const main = products.find(x => x.id === Number(pid));
            const withP = products.find(x => x.id === b.withId);
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <span>🎁</span>
                <span className="flex-1">{main?.nameEn || `#${pid}`} + {withP?.nameEn || `#${b.withId}`} <span className="text-green-600">-{b.discount}%</span></span>
                <button className="text-red-500 text-[9px]" onClick={() => { const bd = { ...settings.bundleDeals }; delete bd[pid]; saveSetting('bundleDeals', bd); }}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <select className="p-2 border border-input rounded-lg text-[10px] bg-card" id="bd-main">
            <option value="">Main</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <select className="p-2 border border-input rounded-lg text-[10px] bg-card" id="bd-with">
            <option value="">With</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <input type="number" className="p-2 border border-input rounded-lg text-[10px] bg-card" id="bd-disc" defaultValue={15} placeholder="Disc %" />
        </div>
        <button className="w-full mt-2 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => {
          const main = (document.getElementById('bd-main') as HTMLSelectElement)?.value;
          const withP = (document.getElementById('bd-with') as HTMLSelectElement)?.value;
          const disc = Number((document.getElementById('bd-disc') as HTMLInputElement)?.value) || 15;
          if (!main || !withP || main === withP) return;
          const bundles = { ...(settings.bundleDeals || {}), [main]: { withId: Number(withP), discount: disc } };
          saveSetting('bundleDeals', bundles);
        }}>+ Add Bundle</button>
      </div>
    </div>
  );
}

// ==================== COUPONS, DISPUTES, SUBSCRIPTIONS, AUDIT ====================
function AdminCoupons() {
  const [settings, setSettings] = useState<any>({});
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);

  useEffect(() => { settingsApi.get().then(d => setSettings(d?.settings || {})).catch(() => {}); }, []);

  const coupons = settings.coupons || [];
  const saveCoupon = () => {
    if (!code) return;
    const newCoupons = [...coupons, { code: code.toUpperCase(), discount, used: 0, active: true, createdAt: new Date().toISOString() }];
    setSettings({ ...settings, coupons: newCoupons });
    settingsApi.update({ ...settings, coupons: newCoupons });
    setCode('');
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🏷️ Coupons ({coupons.length})</h2>
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">New Coupon</h3>
        <div className="flex gap-2">
          <input className="flex-1 p-2 border border-input rounded-lg text-xs bg-card uppercase" placeholder="CODE" value={code} onChange={e => setCode(e.target.value)} />
          <input className="w-16 p-2 border border-input rounded-lg text-xs bg-card text-center" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={saveCoupon}>+</button>
        </div>
      </div>
      <div className="space-y-1.5">
        {coupons.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 bg-card rounded-xl border border-border p-2.5 text-xs">
            <span>🏷️</span>
            <span className="font-bold text-primary font-mono">{c.code}</span>
            <span className="text-muted-foreground">{c.discount}%</span>
            <span className="text-muted-foreground text-[9px]">Used: {c.used || 0}</span>
            <span className={cn('ml-auto px-1.5 py-0.5 rounded text-[9px]', c.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>{c.active !== false ? 'Active' : 'Inactive'}</span>
            <button className="text-red-500 text-[9px]" onClick={() => {
              const newC = coupons.filter((_: any, j: number) => j !== i);
              setSettings({ ...settings, coupons: newC });
              settingsApi.update({ ...settings, coupons: newC });
            }}>🗑️</button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No coupons</p>}
      </div>
    </div>
  );
}

function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem('admin_disputes') || '[]'); setDisputes(d); } catch(e) {}
  }, []);

  return (
    <div>
      <h2 className="text-base font-bold mb-3">⚖️ Disputes ({disputes.length})</h2>
      <p className="text-xs text-muted-foreground mb-3">Dispute resolution center — manage from your existing admin panel at /admin</p>
      <div className="space-y-1.5">
        {disputes.slice(0, 10).map((d: any, i: number) => (
          <div key={i} className="bg-card rounded-xl border border-border p-2.5 text-xs flex items-center gap-2">
            <span>⚖️</span>
            <span className="font-semibold">{d.orderNumber}</span>
            <span className="text-muted-foreground">{d.type}</span>
            <span className="ml-auto">{d.resolution}</span>
          </div>
        ))}
        {disputes.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No disputes</p>}
      </div>
      <a href="/admin" className="block text-center text-xs text-primary mt-4 underline">Go to full admin panel →</a>
    </div>
  );
}

function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('admin_subscriptions') || '[]'); setSubs(s); } catch(e) {}
  }, []);

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📦 Subscriptions ({subs.length})</h2>
      <a href="/admin" className="block text-center text-xs text-primary underline">Manage in full admin panel →</a>
    </div>
  );
}

function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    try { const l = JSON.parse(localStorage.getItem('admin_audit_log') || '[]'); setLogs(l); } catch(e) {}
  }, []);

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📋 Audit Log ({logs.length})</h2>
      <a href="/admin" className="block text-center text-xs text-primary underline">View full audit log in admin panel →</a>
    </div>
  );
}
