import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { ShoppingCart, Clock, Send, Smartphone, CheckCircle, XCircle, AlertTriangle, ChevronRight, User, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from '@/components/Toast';

interface AbandonedCart {
  id: string;
  customerName: string;
  phone: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'recovered' | 'lost';
  recoveredAt?: string;
  notified: boolean;
}

export default function AbandonedCartRecovery() {
  const [carts, setCarts] = useState<AbandonedCart[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_abandoned_carts') || '[]'); } catch { return []; }
  });
  const [filter, setFilter] = useState<string>('all');

  // Seed sample data if empty
  useEffect(() => {
    if (carts.length === 0) {
      const samples: AbandonedCart[] = [
        { id: 'cart-1', customerName: 'Abebe K.', phone: '+251-911-123456', items: [{ name: 'Wireless Headphones', price: 2500, qty: 1 }, { name: 'Phone Case', price: 350, qty: 2 }], total: 3200, createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), status: 'active', notified: false },
        { id: 'cart-2', customerName: 'Selam W.', phone: '+251-922-654321', items: [{ name: 'Ethiopian Coffee Set', price: 1800, qty: 1 }], total: 1800, createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 172800000).toISOString(), status: 'active', notified: false },
        { id: 'cart-3', customerName: 'Biruk T.', phone: '+251-933-789012', items: [{ name: 'Running Shoes', price: 4500, qty: 1 }, { name: 'Socks Pack', price: 250, qty: 3 }], total: 5250, createdAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), status: 'active', notified: true },
      ];
      setCarts(samples);
      localStorage.setItem('ss_abandoned_carts', JSON.stringify(samples));
    }
  }, []);

  const save = (updated: AbandonedCart[]) => {
    localStorage.setItem('ss_abandoned_carts', JSON.stringify(updated));
    setCarts(updated);
  };

  const sendReminder = (cartId: string) => {
    const updated = carts.map(c => c.id === cartId ? { ...c, notified: true } : c);
    save(updated);
    toast('📱 Telegram reminder sent to customer!', 'success');
  };

  const markRecovered = (cartId: string) => {
    const updated = carts.map(c => c.id === cartId ? { ...c, status: 'recovered' as const, recoveredAt: new Date().toISOString() } : c);
    save(updated);
    toast('✅ Cart marked as recovered!', 'success');
  };

  const markLost = (cartId: string) => {
    const updated = carts.map(c => c.id === cartId ? { ...c, status: 'lost' as const } : c);
    save(updated);
    toast('Cart marked as lost', 'info');
  };

  const filtered = filter === 'all' ? carts : carts.filter(c => c.status === filter);
  const totalValue = carts.filter(c => c.status === 'active').reduce((s, c) => s + c.total, 0);
  const recoveredValue = carts.filter(c => c.status === 'recovered').reduce((s, c) => s + c.total, 0);

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-orange-500" /> Abandoned Cart Recovery</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Recover lost sales with Telegram reminders</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Carts', val: carts.filter(c => c.status === 'active').length, icon: ShoppingCart, color: 'from-orange-500 to-amber-600', sub: `${carts.length} total` },
          { label: 'At-Risk Value', val: `Br ${totalValue.toLocaleString()}`, icon: DollarSign, color: 'from-red-500 to-rose-600', sub: 'Abandoned total' },
          { label: 'Recovered', val: carts.filter(c => c.status === 'recovered').length, icon: CheckCircle, color: 'from-emerald-500 to-green-600', sub: `Br ${recoveredValue.toLocaleString()} saved` },
          { label: 'Recovery Rate', val: carts.length > 0 ? `${Math.round((carts.filter(c => c.status === 'recovered').length / carts.length) * 100)}%` : '0%', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', sub: 'Conversion rate' },
        ].map((s: any, i: number) => {
          const Icon = s.icon; const upTrend = s.label === 'Recovery Rate';
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

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {['all', 'active', 'recovered', 'lost'].map(s => {
          const count = s === 'all' ? carts.length : carts.filter(c => c.status === s).length;
          return (
            <button key={s} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap border transition-all', (filter === s) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700')} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Cart List */}
      <div className="space-y-2">
        {filtered.map(cart => {
          const hoursAgo = Math.floor((Date.now() - new Date(cart.createdAt).getTime()) / 3600000);
          const expiringSoon = new Date(cart.expiresAt).getTime() - Date.now() < 86400000;
          return (
            <div key={cart.id} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-3 transition-all hover:shadow-md',
              cart.status === 'active' ? 'border-slate-200 dark:border-slate-800' : cart.status === 'recovered' ? 'border-green-200 dark:border-green-800' : 'border-slate-200 dark:border-slate-800 opacity-60'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cart.status === 'active' ? 'bg-orange-100 dark:bg-orange-950/30' : cart.status === 'recovered' ? 'bg-green-100 dark:bg-green-950/30' : 'bg-slate-100 dark:bg-slate-800')}>
                    {cart.status === 'active' ? <ShoppingCart size={16} className="text-orange-600" /> : cart.status === 'recovered' ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{cart.customerName}</span>
                      {expiringSoon && cart.status === 'active' && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">Expiring</span>}
                    </div>
                    <div className="text-[9px] text-slate-400">📞 {cart.phone} · {hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">{formatPrice(cart.total)}</div>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', cart.status === 'active' ? 'bg-orange-100 text-orange-700' : cart.status === 'recovered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>{cart.status}</span>
                </div>
              </div>

              {/* Items */}
              <div className="mt-1.5 ml-11 text-[9px] text-slate-500 truncate">
                {cart.items.map((it, i) => `${it.name} ×${it.qty}`).join(', ')}
              </div>

              {/* Actions */}
              {cart.status === 'active' && (
                <div className="flex gap-1.5 mt-2 ml-11">
                  <button className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[8px] font-bold flex items-center gap-1 hover:shadow-md transition-all" onClick={() => markRecovered(cart.id)}>
                    <CheckCircle size={10} /> Mark Recovered
                  </button>
                  <button className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-[8px] font-bold flex items-center gap-1 hover:shadow-md transition-all" onClick={() => sendReminder(cart.id)}>
                    <Send size={10} /> Send Reminder
                  </button>
                  <button className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[8px] font-medium text-slate-500 hover:bg-slate-50 transition-all" onClick={() => markLost(cart.id)}>
                    Lost
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No carts found</p>}
      </div>
    </div>
  );
}
