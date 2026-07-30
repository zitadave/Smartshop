import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { vendorsApi } from '@/lib/api';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Download, Filter, Search, ChevronRight, Wallet, ChevronDown, Check, XCircle, Loader } from 'lucide-react';
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
  payment_method?: string;
  account_name?: string;
  account_number?: string;
  notes?: string;
}

interface VendorEarnings {
  vendorId: number;
  vendorName: string;
  totalSales: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  lastPayout?: string;
  payoutMethod?: string;
  payoutDetails?: string;
}

export default function PayoutSystem() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Disbursement Modal states
  const [payoutToDisburse, setPayoutToDisburse] = useState<Payout | null>(null);
  const [disbursing, setDisbursing] = useState(false);

  const fetchPayoutsData = () => {
    setLoading(true);
    Promise.all([
      vendorsApi.list().then(d => setVendors(d?.vendors || [])),
      fetch('/api/payouts')
        .then(r => r.json())
        .then(d => { if (d && d.payouts) setPayouts(d.payouts); })
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  // Calculate earnings per vendor
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
      payoutMethod: v.payoutMethod || 'Telebirr',
      payoutDetails: v.payoutDetails || '',
    };
  });

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  const processManualPayout = async (vendorId: number, amount: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          vendor_name: vendor.name || vendor.storeName || `Vendor #${vendorId}`,
          amount,
          commission_deducted: Math.round(amount * 0.1),
          payment_method: vendor.payoutMethod || 'telebirr',
          account_name: vendor.name || '',
          account_number: vendor.payoutDetails || '',
          notes: 'Admin Disbursal'
        })
      });
      const d = await res.json();
      if (d.success) {
        toast(`✅ Payout request of ${formatPrice(amount)} created!`, 'success');
        fetchPayoutsData();
        setShowPayoutForm(false);
        setSelectedVendor(null);
      }
    } catch (e: any) {
      toast('Error processing: ' + e.message, 'error');
    }
  };

  const handleDisburseConfirm = async () => {
    if (!payoutToDisburse) return;
    setDisbursing(true);

    const isAutomated = ['chapa', 'telebirr'].includes((payoutToDisburse.payment_method || '').toLowerCase());
    
    if (isAutomated) {
      toast(`⚡ Connecting to ${payoutToDisburse.payment_method} automated disbursal servers...`, 'info');
      await new Promise(r => setTimeout(r, 2000)); // Simulate gateway ping
    }

    try {
      const res = await fetch(`/api/payouts/${payoutToDisburse.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', notes: `Payout disbursed successfully via ${payoutToDisburse.payment_method}.` })
      });
      const d = await res.json();
      setDisbursing(false);
      setPayoutToDisburse(null);
      if (d.success) {
        toast(`🎉 Payout of ${formatPrice(payoutToDisburse.amount)} successfully disbursed!`, 'success');
        fetchPayoutsData();
      } else {
        toast('Failed to disburse: ' + d.error, 'error');
      }
    } catch (err: any) {
      setDisbursing(false);
      setPayoutToDisburse(null);
      toast('Error: ' + err.message, 'error');
    }
  };

  const filteredPayouts = payouts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.vendorName.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search)) return false;
    return true;
  });

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="space-y-4 animate-fadeUp text-left">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Paid out', val: formatPrice(totalPaid), icon: Wallet, color: 'from-emerald-500 to-green-600' },
          { label: 'Pending Requests', val: formatPrice(totalPending), icon: Clock, color: 'from-amber-500 to-orange-600' },
          { label: 'Active Vendors', val: vendors.length, icon: DollarSign, color: 'from-blue-500 to-indigo-600' },
          { label: 'Total Payouts Run', val: payouts.length, icon: CheckCircle, color: 'from-purple-500 to-violet-600' },
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
          <h3 className="text-sm font-bold">Vendor Earnings & Billing Setup</h3>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-primary/90 transition-colors" onClick={() => setShowPayoutForm(true)}>
            <DollarSign size={12} /> New Payout Request
          </button>
        </div>

        {/* Payout Form */}
        {showPayoutForm && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-slideDown">
            <h4 className="text-xs font-bold mb-3">Process Payout</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-foreground" onChange={e => {
                const v = vendors.find(v => v.id === Number(e.target.value));
                setSelectedVendor(v);
              }}>
                <option value="">Select vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name || v.storeName || `Vendor #${v.id}`}</option>
                ))}
              </select>
              <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-foreground" placeholder="Amount (Br)" id="payout-amount" />
              <button className="p-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold" onClick={() => {
                const amount = Number((document.getElementById('payout-amount') as HTMLInputElement)?.value);
                if (!selectedVendor || !amount) return toast('Select vendor and enter amount', 'error');
                processManualPayout(selectedVendor.id, amount);
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
                <th className="text-left px-4 py-3 font-semibold">Saved Payout Destination</th>
                <th className="text-right px-4 py-3 font-semibold">Paid</th>
                <th className="text-right px-4 py-3 font-semibold">Pending</th>
                <th className="text-right px-4 py-3 font-semibold">Last Payout</th>
              </tr>
            </thead>
            <tbody>
              {vendorEarnings.map((v) => (
                <tr key={v.vendorId} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {v.vendorName.charAt(0)}
                      </div>
                      <span className="font-semibold">{v.vendorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-semibold">{v.payoutMethod || 'Telebirr'}</div>
                    <div className="text-[8px] text-slate-400 truncate max-w-[200px]">{v.payoutDetails || 'No details configured.'}</div>
                  </td>
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

      {/* Payout History / Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold">Payout Transactions Log ({payouts.length})</h3>
          <div className="flex gap-2">
            <input className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent w-32" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-foreground" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {filteredPayouts.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/20 border dark:border-slate-800 hover:shadow-sm transition-all flex-wrap sm:flex-nowrap">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', p.status === 'paid' ? 'bg-green-100 dark:bg-green-950/30' : 'bg-amber-100 dark:bg-amber-950/30')}>
                {p.status === 'paid' ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-foreground">{p.vendorName}</div>
                <div className="text-[8.5px] text-slate-400">Method: <strong className="text-indigo-500 uppercase">{p.payment_method}</strong> · Destination: {p.account_number || 'N/A'}</div>
                {p.notes && <div className="text-[8px] text-slate-500 italic mt-0.5">Note: "{p.notes}"</div>}
              </div>
              
              <div className="text-right flex items-center gap-3 flex-shrink-0">
                <div>
                  <div className="text-xs font-bold text-foreground">{formatPrice(p.amount)}</div>
                  <span className={cn('text-[8px] font-semibold capitalize block', p.status === 'paid' ? 'text-green-600' : 'text-amber-600')}>{p.status}</span>
                </div>

                {/* Disburse Action Trigger */}
                {p.status === 'pending' && (
                  <button 
                    onClick={() => setPayoutToDisburse(p)}
                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow text-white rounded-lg text-[9px] font-bold active:scale-[0.96] transition-all"
                  >
                    ⚡ Disburse
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredPayouts.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No payouts matching filter</p>}
        </div>
      </div>

      {/* Disbursal Gateway Modal */}
      {payoutToDisburse && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPayoutToDisburse(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-2xl relative text-center animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
              <Wallet size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">Execute Disbursal Gateway</h3>
            <p className="text-[10.5px] text-slate-500 mb-4 leading-relaxed">
              Are you sure you want to disburse **{formatPrice(payoutToDisburse.amount)}** to **{payoutToDisburse.vendorName}**?<br/>
              Preferred Method: <strong className="text-indigo-500 uppercase">{payoutToDisburse.payment_method}</strong> ({payoutToDisburse.account_number})
            </p>

            {/* Manual CBE Instructions */}
            {String(payoutToDisburse.payment_method).toLowerCase() === 'cbe bank' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30 text-left text-[9px] text-blue-700 dark:text-blue-400 mb-4 space-y-1">
                <div className="font-bold flex items-center gap-1">🏦 CBE Bank Manual Instruction:</div>
                <div>Please execute the bank transfer manually to:</div>
                <div>• Bank: **Commercial Bank of Ethiopia (CBE)**</div>
                <div>• Name: **{payoutToDisburse.account_name || payoutToDisburse.vendorName}**</div>
                <div>• Account: **{payoutToDisburse.account_number}**</div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button 
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850" 
                onClick={() => setPayoutToDisburse(null)}
                disabled={disbursing}
              >
                Cancel
              </button>
              <button 
                className="flex-[1.5] py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5" 
                onClick={handleDisburseConfirm}
                disabled={disbursing}
              >
                {disbursing ? <Loader size={12} className="animate-spin" /> : '⚡'}
                {disbursing ? 'Disbursing...' : 'Confirm Disbursal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
