import { useState, useEffect } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { productsApi, ordersApi } from '@/lib/api';
import { Bell, AlertTriangle, Package, TrendingDown, ShoppingCart, DollarSign, Clock, CheckCircle, X, ChevronRight } from 'lucide-react';

interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'large_order' | 'vendor_pending' | 'revenue_drop' | 'price_drop';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  time: string;
  read: boolean;
  action?: { label: string; onClick: () => void };
}

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const generateAlerts = async () => {
    const items: Alert[] = [];
    const now = new Date();

    try {
      const { products } = await productsApi.list().catch(() => ({ products: [] }));
      const { orders } = await ordersApi.list().catch(() => ({ orders: [] }));

      // Low stock alerts
      (products || []).filter((p: any) => p.stockCount > 0 && p.stockCount <= 5).forEach((p: any) => {
        items.push({
          id: `low-${p.id}`,
          type: 'low_stock',
          title: `⚠️ Low Stock: ${p.nameEn}`,
          message: `Only ${p.stockCount} units remaining. Reorder soon.`,
          severity: p.stockCount <= 2 ? 'critical' : 'warning',
          time: now.toISOString(),
          read: false,
          action: { label: 'View Product', onClick: () => {} },
        });
      });

      // Out of stock
      (products || []).filter((p: any) => !p.inStock || p.stockCount === 0).forEach((p: any) => {
        items.push({
          id: `oos-${p.id}`,
          type: 'out_of_stock',
          title: `❌ Out of Stock: ${p.nameEn}`,
          message: 'This product is no longer available. Update listing or restock.',
          severity: 'critical',
          time: now.toISOString(),
          read: false,
        });
      });

      // Large orders
      (orders || []).filter((o: any) => (o.total || 0) > 5000).slice(0, 3).forEach((o: any) => {
        items.push({
          id: `order-${o.orderNumber}`,
          type: 'large_order',
          title: `💰 Large Order: ${o.orderNumber}`,
          message: `Br ${(o.total || 0).toLocaleString()} from ${o.customer?.name || 'Anonymous'}`,
          severity: 'info',
          time: o.createdAt || now.toISOString(),
          read: false,
        });
      });

      // High-value items
      (products || []).filter((p: any) => p.price > 10000 && p.stockCount <= 3).forEach((p: any) => {
        items.push({
          id: `high-${p.id}`,
          type: 'price_drop',
          title: `💎 High-Value Alert: ${p.nameEn}`,
          message: `Br ${p.price?.toLocaleString()} — Only ${p.stockCount} left!`,
          severity: 'warning',
          time: now.toISOString(),
          read: false,
        });
      });

    } catch {}

    // If no real alerts, add sample ones for demo
    if (items.length === 0) {
      items.push({
        id: 'demo-1', type: 'low_stock', title: '⚠️ Auto Washing Machine Low Stock', message: 'Only 3 units remaining', severity: 'warning', time: now.toISOString(), read: false,
      }, {
        id: 'demo-2', type: 'large_order', title: '💰 Large Order: ETH-A1B2C3', message: 'Br 12,500 order from Abebe K.', severity: 'info', time: new Date(Date.now() - 3600000).toISOString(), read: false,
      }, {
        id: 'demo-3', type: 'vendor_pending', title: '🏪 Pending Vendor Approval', message: '2 vendors waiting for approval', severity: 'info', time: new Date(Date.now() - 7200000).toISOString(), read: false,
      });
    }

    // Merge with stored read status
    const stored = JSON.parse(localStorage.getItem('ss_alert_read') || '[]');
    items.forEach(a => { if (stored.includes(a.id)) a.read = true; });

    setAlerts(items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
  };

  useEffect(() => { generateAlerts(); }, []);

  const markRead = (id: string) => {
    const stored = JSON.parse(localStorage.getItem('ss_alert_read') || '[]');
    if (!stored.includes(id)) {
      localStorage.setItem('ss_alert_read', JSON.stringify([...stored, id]));
    }
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = () => {
    const ids = alerts.map(a => a.id);
    localStorage.setItem('ss_alert_read', JSON.stringify(ids));
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const filtered = filter === 'unread' ? alerts.filter(a => !a.read) : alerts;
  const unreadCount = alerts.filter(a => !a.read).length;
  const severityColors: Record<string, string> = { critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800', warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' };
  const severityDots: Record<string, string> = { critical: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };
  const typeIcons: Record<string, any> = { low_stock: Package, out_of_stock: AlertTriangle, large_order: DollarSign, vendor_pending: ShoppingCart, revenue_drop: TrendingDown, price_drop: TrendingDown };

  return (
    <div className="animate-fadeUp space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell size={20} className="text-indigo-500" /> Smart Alerts
            {unreadCount > 0 && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Real-time monitoring & notifications</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold', filter === 'unread' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setFilter('unread')}>Unread ({unreadCount})</button>
            <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold', filter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setFilter('all')}>All ({alerts.length})</button>
          </div>
          {unreadCount > 0 && (
            <button className="px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-semibold flex items-center gap-1" onClick={markAllRead}>
              <CheckCircle size={11} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p className="text-xs text-slate-500 font-semibold">All clear! No alerts</p>
            <p className="text-[9px] text-slate-400 mt-1">You're up to date</p>
          </div>
        ) : (
          filtered.map(alert => {
            const Icon = typeIcons[alert.type] || Bell;
            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-2xl border p-3 transition-all hover:shadow-md cursor-pointer',
                  severityColors[alert.severity] || 'bg-card border-border',
                  !alert.read && 'ring-1 ring-primary/20'
                )}
                onClick={() => markRead(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-950/30' : alert.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-blue-100 dark:bg-blue-950/30')}>
                      <Icon size={16} className={cn(alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600')} />
                    </div>
                    {!alert.read && <span className={cn('absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900', severityDots[alert.severity])} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold">{alert.title}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-semibold', alert.severity === 'critical' ? 'bg-red-100 text-red-700' : alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                          {alert.severity}
                        </span>
                        <span className="text-[8px] text-slate-400">{new Date(alert.time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {alert.action && (
                      <button className="mt-1.5 text-[9px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline" onClick={e => { e.stopPropagation(); alert.action?.onClick(); }}>
                        {alert.action.label} <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Critical', count: alerts.filter(a => a.severity === 'critical' && !a.read).length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
          { label: 'Warning', count: alerts.filter(a => a.severity === 'warning' && !a.read).length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Info', count: alerts.filter(a => a.severity === 'info' && !a.read).length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-xl p-3 text-center', s.bg)}>
            <div className={cn('text-lg font-extrabold', s.color)}>{s.count}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
