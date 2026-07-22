import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { settingsApi } from '@/lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Percent, Calendar, Download, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function CouponAnalytics() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [usageHistory, setUsageHistory] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_coupon_usage') || '[]'); } catch { return []; }
  });

  const coupons = settings.coupons || [];
  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  const saveCoupon = () => {
    if (!code) return;
    const newCoupons = [...coupons, { code: code.toUpperCase(), discount, used: 0, active: true, revenue: 0, createdAt: new Date().toISOString() }];
    saveSetting('coupons', newCoupons);
    setCode('');
    toast('✅ Coupon created!', 'success');
  };

  const recordUsage = (idx: number) => {
    const coupon = coupons[idx];
    const revenue = Math.round(Math.random() * 5000 + 500);
    const updated = coupons.map((c: any, i: number) => i === idx ? { ...c, used: (c.used || 0) + 1, revenue: (c.revenue || 0) + revenue } : c);
    saveSetting('coupons', updated);
    const entry = { code: coupon.code, discount: coupon.discount, revenue, date: new Date().toISOString() };
    const history = [entry, ...usageHistory].slice(0, 100);
    localStorage.setItem('ss_coupon_usage', JSON.stringify(history));
    setUsageHistory(history);
  };

  const totalUsage = coupons.reduce((s: number, c: any) => s + (c.used || 0), 0);
  const totalRevenue = coupons.reduce((s: number, c: any) => s + (c.revenue || 0), 0);
  const avgDiscount = coupons.length > 0 ? coupons.reduce((s: number, c: any) => s + (c.discount || 0), 0) / coupons.length : 0;
  const bestCoupon = [...coupons].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))[0];

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">🏷️ Coupon Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Coupons', val: coupons.filter((c: any) => c.active !== false).length, icon: Percent, color: 'from-blue-500 to-indigo-600', sub: `${coupons.length} total` },
          { label: 'Total Usage', val: totalUsage, icon: ShoppingCart, color: 'from-emerald-500 to-green-600', sub: `${totalRevenue > 0 ? Math.round(totalRevenue / totalUsage) : 0} avg/use` },
          { label: 'Revenue Driven', val: `Br ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-orange-600', sub: `from ${totalUsage} uses` },
          { label: 'Avg Discount', val: `${avgDiscount.toFixed(1)}%`, icon: TrendingUp, color: 'from-purple-500 to-violet-600', sub: bestCoupon ? `Best: ${bestCoupon.code}` : 'No coupons' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}><s.icon size={16} className="text-white" /></div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.sub}</div>
            <div className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5 font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create Coupon */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Plus size={16} /> New Coupon</h3>
        <div className="flex gap-2">
          <input className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent uppercase" placeholder="COUPON CODE" value={code} onChange={e => setCode(e.target.value)} />
          <input className="w-20 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-center" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={saveCoupon}>+ Create</button>
        </div>
      </div>

      {/* Coupon Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold">Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-center px-4 py-3 font-semibold">Discount</th>
                <th className="text-center px-4 py-3 font-semibold">Uses</th>
                <th className="text-right px-4 py-3 font-semibold">Revenue</th>
                <th className="text-right px-4 py-3 font-semibold">Avg Order</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold font-mono text-indigo-600">{c.code}</td>
                  <td className="px-4 py-3 text-center font-semibold">{c.discount}%</td>
                  <td className="px-4 py-3 text-center">{c.used || 0}</td>
                  <td className="px-4 py-3 text-right font-bold">Br {(c.revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">Br {c.used ? Math.round((c.revenue || 0) / c.used).toLocaleString() : 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', c.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                      {c.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-[8px] font-semibold hover:bg-indigo-200" onClick={() => recordUsage(i)}>Simulate Use</button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => saveSetting('coupons', coupons.filter((_: any, j: number) => j !== i))}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No coupons created yet</p>}
      </div>

      {/* Usage Timeline */}
      {usageHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Calendar size={14} /> Recent Usage</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {usageHistory.slice(0, 20).map((u: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
                <span className="font-bold font-mono text-indigo-600">{u.code}</span>
                <span className="text-green-600">-{u.discount}%</span>
                <span className="flex-1 text-right text-emerald-600 font-semibold">+Br {u.revenue}</span>
                <span className="text-[9px] text-slate-400">{new Date(u.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
