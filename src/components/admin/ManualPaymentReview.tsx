/**
 * Manual Payment Review — Admin reviews bank transfer receipts
 * User submits: bank name, receipt number, amount, image, note
 * Admin approves → order confirmed | Admin rejects → order cancelled
 * Admin can edit bank accounts shown to customers
 */
import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { sendAdminTelegram, sendFileToTelegram } from '@/lib/adminNotifier';
import { toast } from '@/components/Toast';
import { Check, X, Search, RefreshCw, Banknote, Clock, Edit3, Plus, Trash2, Save, Image as ImageIcon, ExternalLink } from 'lucide-react';

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
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface BankAccount {
  name: string;
  account: string;
  holder: string;
}

const STORAGE_KEY = 'ss_manual_payments';
const BANK_KEY = 'ss_bank_accounts';

function getPayments(): ManualPayment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function savePayments(p: ManualPayment[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function getBankAccounts(): BankAccount[] {
  try { return JSON.parse(localStorage.getItem(BANK_KEY) || '[]'); } catch { return []; }
}
function saveBankAccounts(b: BankAccount[]) {
  try { localStorage.setItem(BANK_KEY, JSON.stringify(b)); } catch {}
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
  
  // Send text notification
  sendAdminTelegram(
    `🏦 <b>New Manual Payment Submitted</b>\n\nOrder: ${payment.orderNumber}\nCustomer: ${payment.customerName}\nAmount: ${formatPrice(payment.amount)}\nBank: ${payment.bankName}\nDepositor: ${payment.receiptNumber}\n\nReview: https://smartshop-steel.vercel.app/admin-panel`
  );
  
  // If there's a receipt image, send it as a file too
  if (payment.receiptImage) {
    try {
      const base64Data = payment.receiptImage.split(',')[1] || payment.receiptImage;
      sendFileToTelegram(base64Data, `receipt-${payment.orderNumber}.jpg`, {
        contentType: 'image/jpeg',
        caption: `📸 Receipt for order ${payment.orderNumber} - ${payment.bankName}`,
        silent: true,
      });
    } catch {}
  }
}

export default function ManualPaymentReview() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [showBankEditor, setShowBankEditor] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const refresh = () => setPayments(getPayments());
  useEffect(() => { refresh(); setBankAccounts(getBankAccounts()); }, []);

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
    toast(`✅ Payment approved for ${p?.orderNumber}!`, 'success');
    sendAdminTelegram(`✅ <b>Manual Payment Approved</b>\n\nOrder: ${p?.orderNumber}\nCustomer: ${p?.customerName}\nAmount: ${formatPrice(p?.amount || 0)}\nThe order has been confirmed.`);
  };

  const reject = (id: string) => {
    const reason = prompt('Reason for rejection:');
    const updated = payments.map(p => p.id === id ? { ...p, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin' } : p);
    savePayments(updated);
    setPayments(updated);
    const p = updated.find(x => x.id === id);
    toast(`❌ Payment rejected for ${p?.orderNumber}`, 'info');
    sendAdminTelegram(`❌ <b>Manual Payment Rejected</b>\n\nOrder: ${p?.orderNumber}\nCustomer: ${p?.customerName}\nAmount: ${formatPrice(p?.amount || 0)}${reason ? '\nReason: ' + reason : ''}`);
  };

  const addBank = () => {
    const name = prompt('Bank Name:');
    if (!name) return;
    const account = prompt('Account Number:');
    if (!account) return;
    const holder = prompt('Account Holder Name:');
    if (!holder) return;
    const updated = [...bankAccounts, { name, account, holder }];
    saveBankAccounts(updated);
    setBankAccounts(updated);
    toast('✅ Bank added!', 'success');
  };

  const removeBank = (idx: number) => {
    const updated = bankAccounts.filter((_, i) => i !== idx);
    saveBankAccounts(updated);
    setBankAccounts(updated);
    toast('🗑️ Bank removed', 'info');
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
          <input className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <div className="text-[10px]"><span className="text-slate-400">Amount:</span> <span className="font-bold text-emerald-600">{formatPrice(p.amount)}</span>{p.paidAmount ? <span className="text-slate-400 ml-1">(Customer paid: {formatPrice(Number(p.paidAmount))})</span> : ''}</div>
                  <div className="flex gap-3 text-[10px] flex-wrap">
                    <span><span className="text-slate-400">Bank:</span> {p.bankName}</span>
                    <span><span className="text-slate-400">Depositor:</span> <span className="font-mono font-bold">{p.receiptNumber}</span></span>
                  </div>
                  {p.note && <div className="text-[9px] text-slate-500 italic mt-0.5">"{p.note}"</div>}
                </div>
                <div className="text-[8px] text-slate-400 mt-1">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {p.receiptImage && (
                  <div className="relative group">
                    <img src={p.receiptImage} className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer" alt="Receipt" onClick={() => window.open(p.receiptImage, '_blank')} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer" onClick={() => window.open(p.receiptImage, '_blank')}>
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                )}
                {p.status === 'pending' && (
                  <div className="flex gap-1">
                    <button className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:shadow-lg" onClick={() => approve(p.id)} title="Approve"><Check size={11} /></button>
                    <button className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:bg-red-600" onClick={() => reject(p.id)} title="Reject"><X size={11} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Accounts Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><Banknote size={15} className="text-blue-500" /> Bank Accounts for Manual Payments</h3>
          <button className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1" onClick={() => setShowBankEditor(!showBankEditor)}>
            <Edit3 size={11} /> {showBankEditor ? 'Done' : 'Edit Banks'}
          </button>
        </div>
        <div className="space-y-2">
          {bankAccounts.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">No bank accounts configured. Add at least one for customers to use.</p>}
          {bankAccounts.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              {showBankEditor ? (
                <>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={b.name} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], name: e.target.value }; setBankAccounts(updated);
                    }} />
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent font-mono" value={b.account} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], account: e.target.value }; setBankAccounts(updated);
                    }} />
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={b.holder} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], holder: e.target.value }; setBankAccounts(updated);
                    }} />
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" onClick={() => removeBank(i)}><Trash2 size={12} /></button>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">🏦</div>
                  <div className="flex-1">
                    <div className="text-xs font-bold">{b.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{b.account} · {b.holder}</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {showBankEditor && (
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-emerald-200" onClick={addBank}>
              <Plus size={11} /> Add Bank
            </button>
            <button className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-indigo-200" onClick={() => { saveBankAccounts(bankAccounts); setShowBankEditor(false); toast('✅ Bank accounts saved!', 'success'); }}>
              <Save size={11} /> Save All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
