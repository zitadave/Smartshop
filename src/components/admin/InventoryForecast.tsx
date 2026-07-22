import { useState, useMemo } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { TrendingDown, AlertTriangle, RefreshCw, Bell, Package, Clock, Calendar, TrendingUp } from 'lucide-react';
import { toast } from '@/components/Toast';

interface Forecast {
  productId: number;
  name: string;
  image: string;
  currentStock: number;
  dailySales: number;
  daysUntilOut: number;
  sellByDate: string;
  recommendedOrder: number;
  status: 'critical' | 'warning' | 'healthy';
}

export default function InventoryForecast() {
  const { products } = useStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('warning');
  const [autoRestock, setAutoRestock] = useState(() => localStorage.getItem('ss_auto_restock') === 'true');

  // Calculate forecast for each product
  const forecasts: Forecast[] = useMemo(() => {
    return products
      .filter(p => p.inStock)
      .map(p => {
        const dailySales = Math.max(0.1, (p.soldCount || 0) / 30); // average daily sales
        const daysUntilOut = Math.round(p.stockCount / dailySales);
        const sellDate = new Date(Date.now() + daysUntilOut * 86400000);
        const leadTime = 7; // days to restock
        const recommendedOrder = Math.max(1, Math.round(dailySales * (leadTime + 14) - p.stockCount));
        let status: 'critical' | 'warning' | 'healthy' = 'healthy';
        if (daysUntilOut <= 7) status = 'critical';
        else if (daysUntilOut <= 21) status = 'warning';

        return {
          productId: p.id,
          name: p.nameEn,
          image: p.image,
          currentStock: p.stockCount,
          dailySales: Math.round(dailySales * 10) / 10,
          daysUntilOut,
          sellByDate: sellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          recommendedOrder: Math.max(0, recommendedOrder),
          status,
        };
      })
      .sort((a, b) => a.daysUntilOut - b.daysUntilOut);
  }, [products]);

  const filtered = filter === 'all' ? forecasts : forecasts.filter(f => f.status === filter || (filter === 'warning' ? f.status !== 'healthy' : true));
  const criticalCount = forecasts.filter(f => f.status === 'critical').length;
  const warningCount = forecasts.filter(f => f.status === 'warning').length;

  const toggleAutoRestock = () => {
    const val = !autoRestock;
    setAutoRestock(val);
    localStorage.setItem('ss_auto_restock', String(val));
    toast(val ? '🔔 Auto-restock alerts enabled' : 'Auto-restock disabled', 'success');
  };

  const simulateRestock = (productId: number) => {
    toast('📦 Restock order sent to supplier!', 'success');
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Clock size={20} className="text-amber-500" /> Inventory Forecasting</h2>
      <p className="text-[10px] text-slate-500">AI-powered predictions based on sales velocity. Know exactly when to restock.</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tracked Products', val: forecasts.length, icon: Package, color: 'from-blue-500 to-indigo-600' },
          { label: 'Critical (≤7 days)', val: criticalCount, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
          { label: 'Warning (≤21 days)', val: warningCount, icon: TrendingDown, color: 'from-amber-500 to-orange-600' },
          { label: 'Healthy', val: forecasts.filter(f => f.status === 'healthy').length, icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          {(['all', 'critical', 'warning'] as const).map(f => (
            <button key={f} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold capitalize', filter === f ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setFilter(f)}>
              {f} {f === 'critical' ? `(${criticalCount})` : f === 'warning' ? `(${warningCount})` : `(${forecasts.length})`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={autoRestock} onChange={toggleAutoRestock} className="rounded" />
          <Bell size={12} /> Auto-restock alerts
        </label>
      </div>

      {/* Forecast Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-center px-4 py-3 font-semibold">Stock</th>
                <th className="text-center px-4 py-3 font-semibold">Daily Sales</th>
                <th className="text-center px-4 py-3 font-semibold">Days Left</th>
                <th className="text-center px-4 py-3 font-semibold">Sell-By</th>
                <th className="text-center px-4 py-3 font-semibold">Forecast</th>
                <th className="text-center px-4 py-3 font-semibold">Restock Qty</th>
                <th className="text-right px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(f => (
                <tr key={f.productId} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={f.image} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-[10px] font-semibold truncate max-w-[140px]">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{f.currentStock}</td>
                  <td className="px-4 py-3 text-center">{f.dailySales}/day</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('font-bold', f.status === 'critical' ? 'text-red-600' : f.status === 'warning' ? 'text-amber-600' : 'text-green-600')}>
                      {f.daysUntilOut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[9px]">{f.sellByDate}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', f.status === 'critical' ? 'bg-red-500' : f.status === 'warning' ? 'bg-amber-500' : 'bg-green-500')}
                          style={{ width: `${Math.min(100, (f.daysUntilOut / 30) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{f.recommendedOrder}</td>
                  <td className="px-4 py-3 text-right">
                    {f.status !== 'healthy' && (
                      <button className="px-2 py-1 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 rounded text-[8px] font-semibold hover:bg-indigo-200 transition-colors" onClick={() => simulateRestock(f.productId)}>
                        Restock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">All products are well-stocked!</p>}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-3 flex items-start gap-3">
        <Calendar size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-[9px] text-indigo-700 dark:text-indigo-300">
          <strong>📊 Forecast Methodology:</strong> Predictions are based on average daily sales over 30 days. The "Restock Qty" recommends ordering enough to cover 3 weeks of sales plus 1 week lead time. Critical items (≤7 days) need immediate attention.
        </div>
      </div>
    </div>
  );
}
