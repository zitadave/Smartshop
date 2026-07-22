import { useState, useEffect } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { ClipboardList, Filter, Search, Trash2, Download, User, Package, ShoppingCart, Store, Settings, DollarSign, Bell, Shield } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  category: 'product' | 'order' | 'vendor' | 'settings' | 'coupon' | 'user' | 'system';
  description: string;
  user: string;
  timestamp: string;
  details?: string;
}

const ICON_MAP: Record<string, any> = {
  product: Package, order: ShoppingCart, vendor: Store, settings: Settings, coupon: DollarSign, user: User, system: Bell,
};

const CATEGORY_COLORS: Record<string, string> = {
  product: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30',
  order: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30',
  vendor: 'text-purple-600 bg-purple-100 dark:bg-purple-950/30',
  settings: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
  coupon: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30',
  user: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/30',
  system: 'text-rose-600 bg-rose-100 dark:bg-rose-950/30',
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Seed sample data + load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ss_activity_log');
    if (stored) {
      try { setLogs(JSON.parse(stored)); } catch {}
      return;
    }

    const sample: LogEntry[] = [
      { id: '1', action: 'Product Created', category: 'product', description: 'Wireless Headphones added to inventory', user: 'Admin', timestamp: new Date(Date.now() - 1800000).toISOString(), details: 'Price: Br 2,499 · Stock: 50' },
      { id: '2', action: 'Order Shipped', category: 'order', description: 'Order ETH-A1B2C3 marked as shipped', user: 'Admin', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Customer: Abebe K. · Br 3,200' },
      { id: '3', action: 'Vendor Approved', category: 'vendor', description: 'Selam W. approved as vendor', user: 'Admin', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Commission: 10%' },
      { id: '4', action: 'Settings Updated', category: 'settings', description: 'Delivery fee changed to Br 50', user: 'Admin', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { id: '5', action: 'Coupon Created', category: 'coupon', description: 'SAVE20 coupon created (20% off)', user: 'Admin', timestamp: new Date(Date.now() - 28800000).toISOString() },
      { id: '6', action: 'Product Deleted', category: 'product', description: 'Old Bluetooth Speaker removed', user: 'Admin', timestamp: new Date(Date.now() - 57600000).toISOString() },
      { id: '7', action: 'Order Refunded', category: 'order', description: 'Order ETH-D4E5F6 refunded', user: 'Admin', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Br 1,200 refunded to customer' },
      { id: '8', action: 'Flash Deal Created', category: 'system', description: 'Coffee Bundle flash deal active for 48h', user: 'Admin', timestamp: new Date(Date.now() - 172800000).toISOString() },
    ];
    setLogs(sample);
    localStorage.setItem('ss_activity_log', JSON.stringify(sample));
  }, []);

  const addLogEntry = (entry: LogEntry) => {
    const updated = [entry, ...logs].slice(0, 200);
    setLogs(updated);
    localStorage.setItem('ss_activity_log', JSON.stringify(updated));
  };

  const clearLogs = () => {
    if (!confirm('Clear all activity logs?')) return;
    setLogs([]);
    localStorage.removeItem('ss_activity_log');
  };

  const exportLogs = () => {
    const csv = ['Action,Category,Description,User,Timestamp'].concat(
      logs.map(l => `"${l.action}","${l.category}","${l.description}","${l.user}","${new Date(l.timestamp).toLocaleString()}"`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.category !== filter) return false;
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ['all', ...new Set(logs.map(l => l.category))];
  const totalActions = logs.length;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList size={20} className="text-indigo-500" /> Activity Log</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{totalActions} actions recorded · Real-time audit trail</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-medium flex items-center gap-1 hover:bg-slate-50 transition-colors" onClick={exportLogs}>
            <Download size={11} /> Export
          </button>
          <button className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[9px] font-medium flex items-center gap-1 hover:bg-red-50 transition-colors" onClick={clearLogs}>
            <Trash2 size={11} /> Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {categories.map(c => (
            <button key={c} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold whitespace-nowrap border transition-all', filter === c ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700')} onClick={() => setFilter(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)} ({c === 'all' ? logs.length : logs.filter(l => l.category === c).length})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent w-full" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {filtered.map((log, i) => {
          const Icon = ICON_MAP[log.category] || ClipboardList;
          return (
            <div key={log.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', CATEGORY_COLORS[log.category] || 'bg-slate-100')}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold">{log.action}</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{log.description}</p>
                      {log.details && <p className="text-[9px] text-slate-400 mt-0.5">{log.details}</p>}
                    </div>
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 whitespace-nowrap', CATEGORY_COLORS[log.category] || 'bg-slate-100')}>
                      {log.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-slate-400">{log.user}</span>
                    <span className="text-[8px] text-slate-300">·</span>
                    <span className="text-[8px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No activity logs found</p>}
      </div>
    </div>
  );
}
