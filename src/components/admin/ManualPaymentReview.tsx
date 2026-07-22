/**
 * Manual Payment Review — Admin reviews bank transfer receipts
 * User submits: bank name, receipt number, amount, optional note
 * Admin approves → order confirmed | Admin rejects → order cancelled
 */
import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { sendAdminTelegram } from '@/lib/adminNotifier';
import { toast } from '@/components/Toast';
import { Check, X, Eye, Search, RefreshCw, Banknote, Clock, AlertCircle } from 'lucide-react';

interface ManualPayment {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  bankName: string;
  receiptNumber: string;
  paidAmount: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const STORAGE_KEY = 'ss_manual_payments';

function getPayments(): ManualPayment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function savePayments(p: ManualPayment[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export function addManualPayment(payment: Omit<ManualPayment, 'id' | 'status' | 'createdAt'>) {
  const all = getPayments();
  all.unshift({
    ...payment,
    id: 'MP-' + Date.now().toString(36).toUpperCase(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  savePayments(all);
  // Notify admin via Telegram
  sendAdminTelegram(
    `🏦 <b>New Manual Payment Submitted</b>\n\nOrder: ${payment.orderNumber}\nCustomer: ${payment.customerName}\nAmount: ${formatPrice(payment.amount)}\nBank: ${payment.bankName}\nReceipt: ${payment.receiptNumber}\n\n<a href="https://smartshop-steel.vercel.app/admin-panel">Review in Admin Panel</a>`
  );
}

export default function ManualPaymentReview() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const refresh = () => setPayments(getPayments());
  useEffect(refresh, []);

  const filtered = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.orderNumber.toLowerCase().includes(search.toLowerCase()) && !p.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approve = (id: string) => {
    const updated = payments.map(p => p.id === id ? { ...p, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin' } : p);
    savePayments(updated);
    setPayments(updated);
    const p = updated.find(x => x.id === id);
    toast(`✅ Payment approved for ${p?.orderNumber}! Order confirmed.`, 'success');
    sendAdminTelegram(`✅ <b>Manual Payment Approved</b>\n\nOrder: ${p?.orderNumber}\nCustomer: ${p?.customerName}\nAmount: ${formatPrice(p?.amount || 0)}\nThe order has been confirmed and will be processed.`);
  };

  const reject = (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    const updated = payments.map(p => p.id === id ? { ...p, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin' } : p);
    savePayments(updated);
    setPayments(updated);
    const p = updated.find(x => x.id === id);
    toast(`❌ Payment rejected for ${p?.orderNumber}`, 'info');
    sendAdminTelegram(`❌ <b>Manual Payment Rejected</b>\n\nOrder: ${p?.orderNumber}\nCustomer: ${p?.customerName}\nAmount: ${formatPrice(p?.amount || 0)}${reason ? '\nReason: ' + reason : ''}`);
  };

  const pending = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Banknote size={20} className="text-emerald-500" /> Manual Payment Review</h2>
          <p className="text-[10px] text-slate-500">Review bank transfer receipts submitted by customers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-semibold">{pending} pending</span>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" onClick={refresh}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button key={f} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all', filter === f ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({payments.filter(p => f === 'all' || p.status === f).length})
          </button>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" placeholder="Search order/customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <Banknote size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-500 font-semibold">No manual payments to review</p>
            <p className="text-[9px] text-slate-400 mt-1">When customers submit bank transfer receipts, they'll appear here.</p>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-4', p.status === 'pending' ? 'border-amber-200 dark:border-amber-800' : p.status === 'approved' ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800')}>
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', p.status === 'pending' ? 'bg-amber-100' : p.status === 'approved' ? 'bg-emerald-100' : 'bg-red-100')}>
                {p.status === 'pending' ? <Clock size={18} className="text-amber-600" /> : p.status === 'approved' ? <Check size={18} className="text-emerald-600" /> : <X size={18} className="text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono text-indigo-600">{p.orderNumber}</span>
                  <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', p.status === 'pending' ? 'bg-amber-100 text-amber-700' : p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{p.status.toUpperCase()}</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  <div className="text-[10px]"><span className="text-slate-400">Customer:</span> <span className="font-medium">{p.customerName}</span> <span className="text-slate-400">· {p.customerPhone}</span></div>
                  <div className="text-[10px]"><span className="text-slate-400">Amount:</span> <span className="font-bold text-emerald-600">{formatPrice(p.amount)}</span></div>
                  <div className="flex gap-3 text-[10px] flex-wrap">
                    <span><span className="text-slate-400">Bank:</span> {p.bankName}</span>
                    <span><span className="text-slate-400">Receipt:</span> <span className="font-mono font-bold">{p.receiptNumber}</span></span>
                    {p.paidAmount && <span><span className="text-slate-400">Paid:</span> {formatPrice(Number(p.paidAmount))}</span>}
                  </div>
                  {p.note && <div className="text-[9px] text-slate-500 italic mt-0.5">"{p.note}"</div>}
                </div>
                <div className="text-[8px] text-slate-400 mt-1">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {p.status === 'pending' && (
                  <>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:shadow-lg" onClick={() => approve(p.id)}>
                      <Check size={11} /> Approve
                    </button>
                    <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:bg-red-600" onClick={() => reject(p.id)}>
                      <X size={11} /> Reject
                    </button>
                  </>
                )}
                {p.reviewedAt && <div className="text-[8px] text-slate-400">{new Date(p.reviewedAt).toLocaleDateString()}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Account Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-4">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Banknote size={15} className="text-blue-500" /> Bank Accounts for Manual Payments</h3>
        <div className="text-[10px] text-blue-700 dark:text-blue-400 space-y-1">
          <p>Customers will see these bank details in checkout when they select "Manual Payment":</p>
          <div className="mt-2 space-y-1 bg-white/50 dark:bg-black/20 rounded-xl p-3">
            <div className="font-mono text-xs">🏦 Commercial Bank of Ethiopia (CBE)</div>
            <div className="font-mono text-xs text-slate-600">Account: 100000XXXXXXX</div>
            <div className="font-mono text-xs text-slate-600">Name: Smart Shop Trading PLC</div>
          </div>
          <div className="space-y-1 bg-white/50 dark:bg-black/20 rounded-xl p-3 mt-1">
            <div className="font-mono text-xs">🏦 Dashen Bank</div>
            <div className="font-mono text-xs text-slate-600">Account: 0987654321</div>
            <div className="font-mono text-xs text-slate-600">Name: Smart Shop Trading PLC</div>
          </div>
          <p className="mt-2 text-[9px]">Update these in Settings → Business Settings once your accounts are opened.</p>
        </div>
      </div>
    </div>
  );
}
