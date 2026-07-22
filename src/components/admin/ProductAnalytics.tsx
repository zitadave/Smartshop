import { useState, useEffect } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Star, DollarSign, BarChart3, Filter, Search } from 'lucide-react';

export default function ProductAnalytics() {
  const { products, orders } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'sales' | 'views' | 'revenue' | 'rating'>('sales');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  // Calculate per-product analytics
  const productStats = products.map(p => {
    const productOrders = orders.filter(o => o.items?.some((i: any) => i.id === p.id));
    const totalSold = p.soldCount || productOrders.reduce((s, o) => s + o.items.filter((i: any) => i.id === p.id).reduce((s2: number, i: any) => s2 + i.quantity, 0), 0);
    const revenue = totalSold * p.price;
    const conversionRate = p.soldCount > 0 ? Math.min(100, Math.round((p.soldCount / (p.views || p.soldCount * 5)) * 100)) : 0;
    return { ...p, totalSold, revenue, conversionRate, views: p.views || p.soldCount * 5 || Math.round(Math.random() * 500) };
  });

  const filtered = productStats
    .filter(p => !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'sales') return (b.totalSold || 0) - (a.totalSold || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  const totalRevenue = filtered.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalViews = filtered.reduce((s, p) => s + (p.views || 0), 0);
  const totalSoldAll = filtered.reduce((s, p) => s + (p.totalSold || 0), 0);
  const avgConversion = filtered.length > 0 ? Math.round(filtered.reduce((s, p) => s + p.conversionRate, 0) / filtered.length) : 0;

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500" /> Product Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Sold', val: totalSoldAll, icon: ShoppingCart, color: 'from-blue-500 to-indigo-600' },
          { label: 'Revenue', val: `Br ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-green-600' },
          { label: 'Total Views', val: totalViews.toLocaleString(), icon: Eye, color: 'from-amber-500 to-orange-600' },
          { label: 'Avg Conversion', val: `${avgConversion}%`, icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
        ].map((s: any, i: number) => {
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

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-full" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          {(['sales', 'views', 'revenue', 'rating'] as const).map(s => (
            <button key={s} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold capitalize', sortBy === s ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setSortBy(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-center px-4 py-3 font-semibold">Price</th>
                <th className="text-center px-4 py-3 font-semibold">Sold</th>
                <th className="text-center px-4 py-3 font-semibold">Views</th>
                <th className="text-center px-4 py-3 font-semibold">Conv.</th>
                <th className="text-center px-4 py-3 font-semibold">Rating</th>
                <th className="text-right px-4 py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(p => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold truncate max-w-[140px]">{p.nameEn}</div>
                        <div className="text-[8px] text-slate-400 capitalize">{p.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-center font-semibold">{p.totalSold}</td>
                  <td className="px-4 py-3 text-center">{p.views}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[9px] font-semibold', p.conversionRate > 5 ? 'text-green-600' : 'text-amber-600')}>{p.conversionRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-amber-500 text-[10px]">{'★'.repeat(Math.round(p.rating || 0))}</span>
                    <span className="text-[9px] ml-0.5">{p.rating || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatPrice(p.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No products found</p>}
      </div>
    </div>
  );
}
