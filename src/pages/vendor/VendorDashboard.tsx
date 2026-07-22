import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { productsApi, ordersApi } from '@/lib/api';
import {
  Store, Package, ShoppingCart, TrendingUp, Settings, LogOut, Menu, X,
  BarChart3, Plus, Edit3, Eye, Save, Tag, DollarSign, Star, ClipboardList,
  Truck, RefreshCw, Camera, Link2, AlertTriangle, Trophy, Download,
  Users, Wallet, Filter, Search, Calendar, ArrowUp, ArrowDown, TrendingDown,
  CheckCircle, Clock, Image, Trash2, Bell, ChevronRight, Activity
} from 'lucide-react';
import { toast } from '@/components/Toast';

type VendorTab = 'dashboard' | 'products' | 'analytics' | 'orders' | 'payouts' | 'settings';

interface ProductForm {
  nameEn: string; name: string; price: string; originalPrice: string; stockCount: string;
  category: string; description: string; descriptionEn: string; brand: string;
  sku: string; colors: string[]; sizes: string[]; features: string[];
  imageUrl: string; localImages: string[]; badge: string;
}

export default function VendorDashboard() {
  const [tab, setTab] = useState<VendorTab>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const store = useStore();
  const { products, orders } = store;
  const vendorId = 1;
  const vendorProducts = products.filter(p => p.vendorId === vendorId || !p.vendorId);
  const vendorName = vendorProducts[0]?.vendorName || 'My Store';

  // Dashboard stats
  const stats = useMemo(() => {
    const sold = vendorProducts.reduce((s, p) => s + (p.soldCount || 0), 0);
    const revenue = vendorProducts.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
    const lowStock = vendorProducts.filter(p => p.stockCount <= 5);
    const avgRating = vendorProducts.length > 0
      ? (vendorProducts.reduce((s, p) => s + (p.rating || 0), 0) / vendorProducts.length).toFixed(1)
      : '0';
    const totalViews = vendorProducts.reduce((s, p) => s + (p.views || p.soldCount * 5 || Math.round(Math.random() * 100 + 20)), 0);
    const conversion = sold > 0 ? Math.min(99, Math.round((sold / Math.max(totalViews, 1)) * 100)) : 0;
    return { sold, revenue, lowStock, avgRating, totalViews, conversion, productCount: vendorProducts.length };
  }, [vendorProducts, orders]);

  const [revenueHistory] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      value: Math.round(5000 + Math.random() * 45000 + i * 3000),
    }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="fixed top-0 left-0 right-0 h-13 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-2">
          <button className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">🏪</div>
            <div>
              <div className="text-sm font-bold">{vendorName}</div>
              <div className="text-[7px] text-slate-400 uppercase tracking-widest">Vendor Dashboard</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 text-[9px] text-emerald-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {stats.productCount} products</span>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => navigate('/profile')}>Back to Store</button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-13 left-0 bottom-0 w-52 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="py-2 px-1.5 space-y-0.5">
          {[
            { id: 'dashboard' as VendorTab, icon: Activity, label: 'Dashboard' },
            { id: 'products' as VendorTab, icon: Package, label: 'Products' },
            { id: 'analytics' as VendorTab, icon: TrendingUp, label: 'Analytics' },
            { id: 'orders' as VendorTab, icon: ShoppingCart, label: 'Orders' },
            { id: 'payouts' as VendorTab, icon: Wallet, label: 'Payouts' },
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
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50" onClick={() => navigate('/profile')}><LogOut size={14} /> Back</button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="lg:ml-52 pt-13 min-h-screen">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {tab === 'dashboard' && <VendorDashboardView products={vendorProducts} stats={stats} revenueHistory={revenueHistory} />}
          {tab === 'products' && <VendorProductsView products={vendorProducts} />}
          {tab === 'analytics' && <VendorAnalyticsView products={vendorProducts} stats={stats} revenueHistory={revenueHistory} />}
          {tab === 'orders' && <VendorOrdersView />}
          {tab === 'payouts' && <VendorPayoutsView stats={stats} />}
          {tab === 'settings' && <VendorSettingsView vendorName={vendorName} />}
        </div>
      </main>
    </div>
  );
}

// ===== DASHBOARD =====
function VendorDashboardView({ products, stats, revenueHistory }: { products: any[]; stats: any; revenueHistory: any[] }) {
  const nav = useNavigate();
  return (
    <div className="space-y-4 animate-fadeUp">
      <h2 className="text-lg font-bold">📊 Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Products', val: stats.productCount, icon: Package, color: 'from-blue-500 to-blue-600', sub: `${stats.sold} sold total` },
          { label: 'Revenue', val: `Br ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-green-600', sub: `${stats.sold} items sold` },
          { label: 'Avg Rating', val: stats.avgRating, icon: Star, color: 'from-amber-500 to-orange-600', sub: `${products.filter(p => p.reviews).length} reviews` },
          { label: 'Conversion Rate', val: `${stats.conversion}%`, icon: TrendingUp, color: 'from-purple-500 to-violet-600', sub: `${stats.totalViews} views` },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}><Icon size={16} className="text-white" /></div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.sub}</div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5 font-semibold">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">📈 Revenue Trend (Last 12 months)</h3>
        <div className="h-32 flex items-end gap-1">
          {revenueHistory.map((d, i) => {
            const max = Math.max(...revenueHistory.map(r => r.value));
            const h = (d.value / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute -top-5 text-[7px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Br {d.value.toLocaleString()}</div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 group-hover:opacity-80 transition-all cursor-pointer"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[7px] text-slate-400">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low Stock */}
      {stats.lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Low Stock Alert ({stats.lowStock.length})</h3>
          </div>
          {stats.lowStock.slice(0, 4).map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800/20 last:border-0">
              <img src={p.image} className="w-6 h-6 rounded object-cover" />
              <span className="flex-1">{p.nameEn}</span>
              <span className="font-bold">{p.stockCount} left</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-xs font-bold hover:shadow-lg transition-all" onClick={() => nav('/vendor')}>
          <Plus size={16} className="inline mr-1" /> Add Product
        </button>
        <button className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white text-xs font-bold hover:shadow-lg transition-all" onClick={() => nav('/vendor')}>
          <TrendingUp size={16} className="inline mr-1" /> View Analytics
        </button>
      </div>
    </div>
  );
}

// ===== PRODUCTS =====
function VendorProductsView({ products }: { products: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'sold'>('name');

  const defaultForm: ProductForm = {
    nameEn: '', name: '', price: '', originalPrice: '', stockCount: '10',
    category: 'electronics', description: '', descriptionEn: '', brand: '',
    sku: `SKU-${generateId().substring(0, 8).toUpperCase()}`,
    colors: [], sizes: [], features: [], imageUrl: '', localImages: [], badge: '',
  };

  const [form, setForm] = useState<ProductForm>(defaultForm);

  const handleNameChange = (val: string) => setForm(f => ({ ...f, nameEn: val, sku: `SKU-${val.substring(0, 4).toUpperCase()}-${generateId().substring(0, 4).toUpperCase()}` }));
  const addItem = (field: 'colors' | 'sizes' | 'features') => {
    const val = prompt(`Enter ${field.slice(0, -1)}:`);
    if (val?.trim()) setForm(f => ({ ...f, [field]: [...f[field], val.trim()] }));
  };
  const removeItem = (field: 'colors' | 'sizes' | 'features', idx: number) => setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));

  const handleLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).slice(0, 3).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, localImages: [...f.localImages, ev.target?.result as string].slice(0, 5) }));
      reader.readAsDataURL(file);
    });
  };

  const handleAdd = async () => {
    if (!form.nameEn.trim() || !form.price) { toast('Name and price required', 'error'); return; }
    try {
      const mainImg = form.imageUrl || form.localImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
      await productsApi.create({
        nameEn: form.nameEn, name: form.name || form.nameEn, price: Number(form.price),
        originalPrice: Number(form.originalPrice) || null, stockCount: Number(form.stockCount) || 10,
        category: form.category, description: form.description, brand: form.brand,
        colors: form.colors, sizes: form.sizes, features: form.features,
        sku: form.sku, image: mainImg, images: [...form.localImages, form.imageUrl].filter(Boolean),
        badge: form.badge, vendorId: 1, vendorName: 'My Store', inStock: true, visible: true,
      });
      toast('✅ Product added!', 'success');
      setShowForm(false);
      setForm(defaultForm);
    } catch { toast('Failed to add product', 'error'); }
  };

  const filtered = products
    .filter(p => !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'price' ? a.price - b.price : sortBy === 'stock' ? a.stockCount - b.stockCount : sortBy === 'sold' ? (b.soldCount || 0) - (a.soldCount || 0) : a.nameEn?.localeCompare(b.nameEn));

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📦 Products ({products.length})</h2>
        <button className={cn('px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors', showForm ? 'bg-red-500 text-white' : 'bg-primary text-white')} onClick={() => setShowForm(!showForm)}>
          <Plus size={12} /> {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="name">Name</option><option value="price">Price</option><option value="stock">Stock</option><option value="sold">Sold</option>
        </select>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4 animate-slideUp">
          <h3 className="text-sm font-bold mb-3">New Product</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">📸 Images</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {form.localImages.map((img, i) => <div key={i} className="relative"><img src={img} className="w-14 h-14 rounded-lg object-cover border border-slate-200" /><button className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]" onClick={() => setForm(f => ({ ...f, localImages: f.localImages.filter((_, j) => j !== i) }))}>✕</button></div>)}
                <button className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary" onClick={() => fileInputRef.current?.click()}><Camera size={16} /></button>
                <button className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary" onClick={() => { const url = prompt('Image URL:'); if (url) setForm(f => ({ ...f, imageUrl: url })); }}><Link2 size={16} /></button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleLocalImage} />
              </div>
            </div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Name *</label><input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Wireless Headphones" value={form.nameEn} onChange={e => handleNameChange(e.target.value)} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Price (Br) *</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="2499" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Brand</label><input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Samsung" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Stock</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={form.stockCount} onChange={e => setForm(f => ({ ...f, stockCount: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
              <select className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['electronics','fashion','home','beauty','groceries','books','sports','baby'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Badge</label>
              <select className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                <option value="">None</option><option value="sale">Sale</option><option value="hot">Hot</option><option value="new">New</option><option value="best-seller">Best Seller</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent resize-none h-16" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Colors, Sizes, Features */}
            {[{ field: 'colors' as const, label: '🎨 Colors' }, { field: 'sizes' as const, label: '📏 Sizes' }, { field: 'features' as const, label: '✨ Features' }].map(({ field, label }) => (
              <div key={field}><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {form[field].map((v, i) => <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[9px]">{v.includes('#') ? <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor: v}} /> : null}{v}<button className="text-red-400 hover:text-red-600" onClick={() => removeItem(field, i)}>✕</button></span>)}
                  <button className="px-2 py-0.5 border border-dashed border-slate-300 rounded-lg text-[9px] text-slate-400 hover:border-primary" onClick={() => addItem(field)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={handleAdd}>
            <Plus size={14} className="inline mr-1" /> Add Product
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><Package size={40} className="mx-auto mb-2 text-slate-300" /><p className="text-xs text-slate-400">No products yet</p></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <img src={p.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{p.nameEn}</div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice(p.price)}</span>
                    {p.originalPrice && <span className="line-through">{formatPrice(p.originalPrice)}</span>}
                    <span>·</span>
                    <span className={cn('font-semibold', p.stockCount > 10 ? 'text-green-600' : 'text-amber-600')}>{p.stockCount} in stock</span>
                    <span>·</span>
                    <span>{p.soldCount || 0} sold</span>
                    {p.sku && <><span>·</span><span className="font-mono text-slate-400">{p.sku}</span></>}
                  </div>
                  {/* Rating mini */}
                  <div className="text-[9px] text-amber-500 mt-0.5">{'★'.repeat(Math.round(p.rating || 0))}{'☆'.repeat(5 - Math.round(p.rating || 0))} {p.rating || 0}</div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Eye size={13} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ANALYTICS =====
function VendorAnalyticsView({ products, stats, revenueHistory }: { products: any[]; stats: any; revenueHistory: any[] }) {
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);
  const maxSold = topProducts[0]?.soldCount || 1;

  return (
    <div className="space-y-4 animate-fadeUp">
      <h2 className="text-lg font-bold">📈 Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', val: `Br ${stats.revenue.toLocaleString()}`, icon: DollarSign, change: '+15%', color: 'text-emerald-600' },
          { label: 'Items Sold', val: stats.sold, icon: ShoppingCart, change: '+8%', color: 'text-blue-600' },
          { label: 'Avg Price', val: formatPrice(stats.productCount > 0 ? Math.round(stats.revenue / stats.productCount) : 0), icon: Tag, change: '+3%', color: 'text-amber-600' },
          { label: 'Conversion', val: `${stats.conversion}%`, icon: TrendingUp, change: '+2.1%', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between mb-1">
              <s.icon size={16} className="text-slate-400" />
              <span className="text-[9px] text-green-600 font-semibold">{s.change}</span>
            </div>
            <div className={cn('text-lg font-bold mt-1', s.color)}>{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Revenue Over Time</h3>
        <div className="h-28 flex items-end gap-1">
          {revenueHistory.map((d, i) => {
            const max = Math.max(...revenueHistory.map(r => r.value));
            return (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:opacity-80 transition-all" style={{ height: `${(d.value / max) * 100}%` }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Trophy size={14} className="text-amber-500" /> Top Selling Products</h3>
        <div className="space-y-2">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className={cn('w-5 text-xs font-bold text-center', i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300')}>{i + 1}</span>
              <img src={p.image} className="w-7 h-7 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate">{p.nameEn}</div>
                <div className="text-[8px] text-slate-400">{p.soldCount || 0} sold · {formatPrice(p.price)}</div>
              </div>
              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((p.soldCount || 0) / maxSold) * 100}%` }} />
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No sales data yet</p>}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold">All Products Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-semibold">Product</th>
              <th className="text-center px-4 py-3 font-semibold">Price</th>
              <th className="text-center px-4 py-3 font-semibold">Sold</th>
              <th className="text-center px-4 py-3 font-semibold">Revenue</th>
              <th className="text-center px-4 py-3 font-semibold">Rating</th>
              <th className="text-center px-4 py-3 font-semibold">Stock</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={p.image} className="w-8 h-8 rounded object-cover" /><span className="text-[10px] font-semibold truncate max-w-[120px]">{p.nameEn}</span></div></td>
                  <td className="px-4 py-3 text-center font-medium">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-center">{p.soldCount || 0}</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-600">{formatPrice((p.soldCount || 0) * p.price)}</td>
                  <td className="px-4 py-3 text-center text-amber-500">{'★'.repeat(Math.round(p.rating || 0))}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', p.stockCount > 10 ? 'bg-green-100 text-green-700' : p.stockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>{p.stockCount}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== ORDERS =====
function VendorOrdersView() {
  const store = useStore();
  const { orders } = store;

  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold mb-4">📋 Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <ShoppingCart size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-400">No orders yet</p>
          <p className="text-[9px] text-slate-400 mt-1">Orders will appear when customers purchase your products</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.slice(0, 30).map(o => (
              <div key={o.orderNumber} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center"><ShoppingCart size={13} className="text-indigo-600" /></div>
                    <div><div className="text-xs font-bold font-mono text-indigo-600">{o.orderNumber}</div><div className="text-[9px] text-slate-400">{o.customer?.name} · {o.date}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold">{formatPrice(o.total || 0)}</div>
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{o.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PAYOUTS =====
function VendorPayoutsView({ stats }: { stats: any }) {
  const [payouts, setPayouts] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_vendor_payouts') || '[]'); } catch { return []; }
  });

  const totalEarned = stats.revenue;
  const commission = Math.round(totalEarned * 0.1); // 10% platform fee
  const netEarned = totalEarned - commission;
  const paidOut = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = netEarned - paidOut;

  const requestPayout = () => {
    const payout = {
      id: generateId(),
      amount: Math.max(0, pending),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      method: 'Telebirr',
    };
    const updated = [payout, ...payouts];
    localStorage.setItem('ss_vendor_payouts', JSON.stringify(updated));
    setPayouts(updated);
    toast('✅ Payout requested!', 'success');
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Wallet size={20} className="text-emerald-500" /> Payouts</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', val: formatPrice(totalEarned), icon: DollarSign, color: 'from-blue-500 to-blue-600' },
          { label: 'Platform Fee (10%)', val: formatPrice(commission), icon: TrendingDown, color: 'from-amber-500 to-orange-600' },
          { label: 'Net Earnings', val: formatPrice(netEarned), icon: Wallet, color: 'from-emerald-500 to-green-600' },
          { label: 'Pending Payout', val: formatPrice(pending), icon: Clock, color: 'from-purple-500 to-violet-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}><Icon size={16} className="text-white" /></div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Request Payout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Request Payout</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Available for withdrawal: <strong className="text-slate-800 dark:text-slate-200 text-sm">{formatPrice(Math.max(0, pending))}</strong></p>
            <p className="text-[9px] text-slate-400 mt-0.5">Paid out so far: {formatPrice(paidOut)}</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50" onClick={requestPayout} disabled={pending <= 0}>
            <Wallet size={14} className="inline mr-1" /> Request Payout
          </button>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold">Payout History ({payouts.length})</h3></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {payouts.slice(0, 10).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', p.status === 'paid' ? 'bg-green-100' : 'bg-amber-100')}>
                {p.status === 'paid' ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-600" />}
              </div>
              <div className="flex-1"><div className="text-[10px] font-semibold">{formatPrice(p.amount)}</div><div className="text-[8px] text-slate-400">{new Date(p.requestedAt).toLocaleDateString()} · {p.method}</div></div>
              <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{p.status}</span>
            </div>
          ))}
          {payouts.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No payouts yet</p>}
        </div>
      </div>
    </div>
  );
}

// ===== SETTINGS =====
function VendorSettingsView({ vendorName }: { vendorName: string }) {
  const [name, setName] = useState(vendorName);
  const [email, setEmail] = useState('vendor@mystore.com');
  const [phone, setPhone] = useState('+251-911-XXXXXX');
  const [bio, setBio] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoRestock, setAutoRestock] = useState(false);

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">⚙️ Settings</h2>

      {/* Store Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Store Profile</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Bio</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell customers about your store" /></div>
        </div>
        <button className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => toast('✅ Settings saved!', 'success')}>
          <Save size={12} className="inline mr-1" /> Save Changes
        </button>
      </div>

      {/* Preferences */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Bell size={14} className="text-blue-500" /> Notifications</h3>
          <label className="flex items-center gap-2 text-xs mb-2"><input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="rounded" /> Email notifications for new orders</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={autoRestock} onChange={e => setAutoRestock(e.target.checked)} className="rounded" /> Auto-restock alerts</label>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><DollarSign size={14} className="text-emerald-500" /> Commission Rate</h3>
          <p className="text-xs text-slate-500">Current commission: <strong className="text-slate-800 dark:text-slate-200">10%</strong></p>
          <p className="text-[9px] text-slate-400 mt-1">Platform fee deducted from each sale</p>
          <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-[9px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle size={10} /> Your store is active and visible
          </div>
        </div>
      </div>
    </div>
  );
}
