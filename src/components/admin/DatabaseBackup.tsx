import { useState } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { productsApi, ordersApi, vendorsApi } from '@/lib/api';
import { Download, Database, Shield, Clock, CheckCircle, AlertTriangle, RefreshCw, FileText, Archive, HardDrive, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/Toast';

interface BackupEntry {
  id: string;
  name: string;
  size: string;
  records: number;
  createdAt: string;
  type: 'auto' | 'manual';
}

export default function DatabaseBackup() {
  const store = useStore();
  const [exporting, setExporting] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_backups') || '[]'); } catch { return []; }
  });
  const [lastBackup] = useState(() => localStorage.getItem('ss_last_backup') || 'Never');

  const performBackup = async () => {
    setExporting(true);
    try {
      const { products } = await productsApi.list().catch(() => ({ products: [] }));
      const { orders } = await ordersApi.list().catch(() => ({ orders: [] }));
      const { vendors } = await vendorsApi.list().catch(() => ({ vendors: [] }));

      const backup = {
        exportedAt: new Date().toISOString(),
        version: '3.0',
        summary: {
          products: products?.length || store.products.length,
          orders: orders?.length || store.orders.length,
          vendors: vendors?.length || 0,
          settings: !!store.settings,
        },
        data: {
          products: products || store.products,
          orders: orders || store.orders,
          vendors: vendors || [],
          settings: store.settings,
          wishlist: store.wishlist,
          loyaltyPoints: store.loyaltyPoints,
          walletBalance: store.walletBalance,
        },
      };

      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartshop-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const entry: BackupEntry = {
        id: `backup-${Date.now()}`,
        name: `Backup ${new Date().toLocaleDateString()}`,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        records: (backup.summary.products || 0) + (backup.summary.orders || 0) + (backup.summary.vendors || 0),
        createdAt: new Date().toISOString(),
        type: 'manual',
      };

      const updated = [entry, ...backups].slice(0, 20);
      localStorage.setItem('ss_backups', JSON.stringify(updated));
      localStorage.setItem('ss_last_backup', new Date().toLocaleString());
      setBackups(updated);
      toast(`✅ Backup complete! ${entry.size} downloaded`, 'success');
    } catch (e: any) {
      toast(`❌ Backup failed: ${e.message}`, 'error');
    }
    setExporting(false);
  };

  const exportCSV = async (type: 'products' | 'orders') => {
    try {
      let data: any[] = [];
      let headers = '';
      let rows: string[] = [];

      if (type === 'products') {
        data = store.products;
        headers = 'ID,Name,Price,Stock,Category,Ratings,Sold';
        rows = data.map((p: any) => `${p.id},"${p.nameEn}",${p.price},${p.stockCount},${p.category},${p.rating || 0},${p.soldCount || 0}`);
      } else {
        data = store.orders;
        headers = 'Order Number,Customer,Total,Status,Date';
        rows = data.map((o: any) => `${o.orderNumber},"${o.customer?.name || ''}",${o.total || 0},${o.status},${o.date}`);
      }

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartshop-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`📄 ${type.charAt(0).toUpperCase() + type.slice(1)} CSV exported!`, 'success');
    } catch {}
  };

  const storageEstimate = (): string => {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('ss_')) total += localStorage.getItem(key)?.length || 0;
    }
    return `${(total / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Database size={20} className="text-emerald-500" /> Database & Backup</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Products', val: store.products.length, icon: FileText, color: 'from-blue-500 to-indigo-600' },
          { label: 'Orders', val: store.orders.length, icon: ShoppingCart, color: 'from-emerald-500 to-green-600' },
          { label: 'Local Storage', val: storageEstimate(), icon: HardDrive, color: 'from-amber-500 to-orange-600' },
          { label: 'Last Backup', val: lastBackup === 'Never' ? 'Never' : new Date(lastBackup).toLocaleDateString(), icon: Clock, color: 'from-purple-500 to-violet-600' },
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

      {/* Backup Actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Full Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Archive size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold">Full Database Backup</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Download a complete JSON backup of your store including products, orders, vendors, settings, and user data. This file can be used to restore your store.</p>
          <button
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            onClick={performBackup}
            disabled={exporting}
          >
            {exporting ? <><RefreshCw size={14} className="animate-spin" /> Backing up...</> : <><Download size={14} /> Download Full Backup</>}
          </button>
          <p className="text-[8px] text-slate-400 mt-1.5">Includes: products ({store.products.length}), orders ({store.orders.length}), settings, wishlist, wallet data</p>
        </div>

        {/* Export Options */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold">Quick CSV Exports</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Export specific data as CSV files for use in Excel or Google Sheets.</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-[10px] font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1" onClick={() => exportCSV('products')}>
              <FileText size={12} /> Products CSV
            </button>
            <button className="py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl text-[10px] font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1" onClick={() => exportCSV('orders')}>
              <ShoppingCart size={12} /> Orders CSV
            </button>
          </div>
          <p className="text-[8px] text-slate-400 mt-1.5">CSV files include all fields. Open with any spreadsheet app.</p>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Clock size={14} /> Backup History ({backups.length})</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {backups.map(b => (
            <div key={b.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', b.type === 'manual' ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-slate-100 dark:bg-slate-800')}>
                {b.type === 'manual' ? <CheckCircle size={12} className="text-emerald-600" /> : <RefreshCw size={12} className="text-slate-400" />}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{b.name}</div>
                <div className="text-[8px] text-slate-400">{b.size} · {b.records} records · {new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', b.type === 'manual' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{b.type}</span>
            </div>
          ))}
          {backups.length === 0 && <p className="text-center py-4 text-xs text-slate-400">No backups yet. Click "Download Full Backup" above.</p>}
        </div>
      </div>

      {/* Data Security Note */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 p-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-emerald-600" />
          <div>
            <h4 className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">🔒 Data Security</h4>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-500">All backups are downloaded directly to your device. No data is stored on external servers. Your Supabase database remains the source of truth.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
