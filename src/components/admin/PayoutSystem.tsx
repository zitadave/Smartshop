import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { vendorsApi } from '@/lib/api';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Download, Filter, Search, ChevronRight, Wallet, ChevronDown } from 'lucide-react';
import { toast } from '@/components/Toast';

interface Payout {
  id: string;
  vendorId: number;
  vendorName: string;
  amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'cancelled';
  period: string;
  paidAt?: string;
  createdAt: string;
}

interface VendorEarnings {
  vendorId: number;
  vendorName: string;
  totalSales: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  lastPayout?: string;
}

export default function PayoutSystem() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_payouts') || '[]'); } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  useEffect(() => {
    vendorsApi.list().then(d => setVendors(d?.vendors || [])).catch(() => {});
  }, []);

  const savePayouts = (updated: Payout[]) => {
    localStorage.setItem('ss_payouts', JSON.stringify(updated));
    setPayouts(updated);
  };

  // Calculate earnings per vendor (simulated from orders data)
  const vendorEarnings: VendorEarnings[] = vendors.map(v => {
    const vendorPayouts = payouts.filter(p => p.vendorId === v.id);
    const paid = vendorPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = vendorPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    return {
      vendorId: v.id,
      vendorName: v.name || v.storeName || `Vendor #${v.id}`,
      totalSales: v.productCount || 0,
      totalCommission: paid + pending,
      paidCommission: paid,
      pendingCommission: pending,
      lastPayout: vendorPayouts.filter(p => p.status === 'paid').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.paidAt,
    };
  });

  const totalPending = vendorEarnings.reduce((s, v) => s + v.pendingCommission, 0);
  const totalPaid = vendorEarnings.reduce((s, v) => s + v.paidCommission, 0);

  const processPayout = (vendorId: number, amount: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const payout: Payout = {
      id: generateId(),
      vendorId,
      vendorName: vendor.name || vendor.storeName || `Vendor #${vendorId}`,
      amount,
      commission: Math.round(amount * 0.1), // 10% commission cut
      status: 'paid',
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    savePayouts([payout, ...payouts]);
    setShowPayoutForm(false);
    setSelectedVendor(null);
    toast(`✅ Payout of ${formatPrice(amount)} processed to ${payout.vendorName}`, 'success');
  };

  const filteredPayouts = payouts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.vendorName.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search)) return false;
    return true;
  });

  const pendingPayouts = payouts.filter(p => p.status === 'pending');

  return (
    <div className="space-y-4 animate-fadeUp">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Paid', val: formatPrice(totalPaid), icon: Wallet, color: 'from-emerald-500 to-green-600' },
          { label: 'Pending', val: formatPrice(totalPending), icon: Clock, color: 'from-amber-500 to-orange-600' },
          { label: 'Vendors', val: vendors.length, icon: DollarSign, color: 'from-blue-500 to-indigo-600' },
          { label: 'Payouts', val: payouts.filter(p => p.status === 'paid').length, icon: CheckCircle, color: 'from-purple-500 to-violet-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}>
              <s.icon size={16} className="text-white" />
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vendor Earnings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold">Vendor Earnings</h3>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-primary/90 transition-colors" onClick={() => setShowPayoutForm(true)}>
            <DollarSign size={12} /> New Payout
          </button>
        </div>

        {/* Payout Form */}
        {showPayoutForm && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-slideDown">
            <h4 className="text-xs font-bold mb-3">Process Payout</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" onChange={e => {
                const v = vendors.find(v => v.id === Number(e.target.value));
                setSelectedVendor(v);
              }}>
                <option value="">Select vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name || v.storeName || `Vendor #${v.id}`}</option>
                ))}
              </select>
              <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Amount (Br)" id="payout-amount" />
              <button className="p-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold" onClick={() => {
                const amount = Number((document.getElementById('payout-amount') as HTMLInputElement)?.value);
                if (!selectedVendor || !amount) return alert('Select vendor and enter amount');
                processPayout(selectedVendor.id, amount);
              }}>
                Process Payout
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Vendor</th>
                <th className="text-right px-4 py-3 font-semibold">Products</th>
                <th className="text-right px-4 py-3 font-semibold">Total Commission</th>
                <th className="text-right px-4 py-3 font-semibold">Paid</th>
                <th className="text-right px-4 py-3 font-semibold">Pending</th>
                <th className="text-right px-4 py-3 font-semibold">Last Payout</th>
              </tr>
            </thead>
            <tbody>
              {vendorEarnings.map((v, i) => (
                <tr key={v.vendorId} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {v.vendorName.charAt(0)}
                      </div>
                      <span className="font-semibold">{v.vendorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{v.totalSales}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatPrice(v.totalCommission)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatPrice(v.paidCommission)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', v.pendingCommission > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>
                      {formatPrice(v.pendingCommission)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 text-[9px]">
                    {v.lastPayout ? new Date(v.lastPayout).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendors.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No vendors yet</p>}
      </div>

      {/* Payout History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Payout History ({payouts.length})</h3>
          <div className="flex gap-2">
            <input className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent w-32" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {filteredPayouts.slice(0, 20).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', p.status === 'paid' ? 'bg-green-100 dark:bg-green-950/30' : 'bg-amber-100 dark:bg-amber-950/30')}>
                {p.status === 'paid' ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold">{p.vendorName}</div>
                <div className="text-[8px] text-slate-400">{p.period} · {p.commission > 0 && `${formatPrice(p.commission)} commission`}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold">{formatPrice(p.amount)}</div>
                <span className={cn('text-[8px] font-semibold', p.status === 'paid' ? 'text-green-600' : 'text-amber-600')}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
        {filteredPayouts.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No payouts yet</p>}
      </div>
    </div>
  );
}
