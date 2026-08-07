/**
 * Manual Payment Review — Admin reviews bank transfer receipts
 * Handles both image uploads AND pasted SMS/text receipts
 */
import { useState, useEffect } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { sendAdminTelegram, sendFileToTelegram } from '@/lib/adminNotifier';
import { toast } from '@/components/Toast';
import { useStore } from '@/stores/AppStore';
import { Check, X, Search, RefreshCw, Banknote, Clock, Edit3, Plus, Trash2, Save, ExternalLink, FileText, ImageIcon, Copy } from 'lucide-react';

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
  receiptText?: string; // Pasted SMS/transaction text
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface BankAccount { name: string; account: string; holder: string; }

const STORAGE_KEY = 'ss_manual_payments';
const BANK_KEY = 'ss_bank_accounts';

function getPayments(): ManualPayment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function savePayments(p: ManualPayment[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { console.warn('Failed to save payments'); }
}
const DEFAULT_ETHIOPIAN_BANKS: BankAccount[] = [
  { name: 'Commercial Bank of Ethiopia (CBE)', account: '1000234567890', holder: 'Smart Shop Trading PLC' },
  { name: 'Telebirr', account: '+251911234567', holder: 'Smart Shop Trading PLC' },
  { name: 'Bank of Abyssinia', account: '102938475601', holder: 'Smart Shop Trading PLC' },
  { name: 'Dashen Bank', account: '098765432101', holder: 'Smart Shop Trading PLC' },
  { name: 'Awash Bank', account: '013005432100', holder: 'Smart Shop Trading PLC' },
];

function getBankAccounts(): BankAccount[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BANK_KEY) || '[]');
    if (parsed && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_ETHIOPIAN_BANKS;
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

  sendAdminTelegram(
    `\u{1F3E6} <b>New Manual Payment Submitted</b>\n\nOrder: ${payment.orderNumber}\nCustomer: ${payment.customerName}\nAmount: ${formatPrice(payment.amount)}\nBank: ${payment.bankName}\nDepositor: ${payment.receiptNumber}\n${payment.receiptImage ? '\u{1F4F8} Receipt image attached' : payment.receiptText ? '\u{1F4CB} Receipt text provided' : ''}\n\nReview: https://smartshop-steel.vercel.app/admin-panel`
  );

  if (payment.receiptImage) {
    try {
      sendFileToTelegram(payment.receiptImage, `receipt-${payment.orderNumber}.jpg`, {
        contentType: 'image/jpeg',
        caption: `\u{1F4F8} Receipt for order ${payment.orderNumber} - ${payment.bankName}`,
        silent: true,
      });
    } catch {}
  }
  
  // Send receipt text as a message if present
  if (payment.receiptText && !payment.receiptImage) {
    sendAdminTelegram(
      `\u{1F4CB} <b>Receipt Text for ${payment.orderNumber}</b>\n\n${payment.receiptText}`
    );
  }
}

export default function ManualPaymentReview() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [showBankEditor, setShowBankEditor] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const refresh = () => setPayments(getPayments());
  useEffect(() => { 
    refresh(); 
    fetch('/api/bank-accounts')
      .then(r => r.json())
      .then(d => {
        if (d && d.bank_accounts && d.bank_accounts.length > 0) {
          const mapped = d.bank_accounts.map((b: any) => ({
            id: b.id,
            name: b.bank_name,
            account: b.account_number,
            holder: b.account_name || b.account_holder
          }));
          setBankAccounts(mapped);
          saveBankAccounts(mapped);
        } else {
          const fb = getBankAccounts();
          setBankAccounts(fb);
          saveBankAccounts(fb);
        }
      })
      .catch(() => {
        const fb = getBankAccounts();
        setBankAccounts(fb);
        saveBankAccounts(fb);
      });
  }, []);

  const filtered = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.orderNumber.toLowerCase().includes(search.toLowerCase()) && !p.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approve = async (id: string) => {
    const updated = payments.map(p => p.id === id ? { ...p, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin' } : p);
    savePayments(updated);
    setPayments(updated);
    const p = updated.find(x => x.id === id);
    if (!p) return;

    toast(`✅ Payment approved for ${p.orderNumber}!`, 'success');
    sendAdminTelegram(`✅ <b>Manual Payment Approved</b>\n\nOrder: ${p.orderNumber}\nCustomer: ${p.customerName}\nAmount: ${formatPrice(p.amount || 0)}\nThe order has been confirmed.`);

    // 1. Update the order's status to 'confirmed' inside Supabase!
    fetch(`/api/orders/${p.orderNumber}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' })
    }).catch(err => console.error('Failed to sync order approval with backend:', err));

    // 2. Update the local ss_orders array so changes reflect instantly for customer & admin
    try {
      const storedOrders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
      const updatedOrders = storedOrders.map((o: any) => o.orderNumber === p.orderNumber ? { ...o, status: 'confirmed' } : o);
      localStorage.setItem('ss_orders', JSON.stringify(updatedOrders));
      
      // Update local React AppStore state
      const { orders, setProducts } = useStore.getState();
      const storeOrder = orders.find((o: any) => o.orderNumber === p.orderNumber);
      if (storeOrder) {
        storeOrder.status = 'confirmed';
      }
    } catch (e: any) {
      console.error('Local orders sync failed:', e.message);
    }

    // 3. Update the local ss_fulfillments status to 'confirmed'
    try {
      const storedFulfillments = JSON.parse(localStorage.getItem('ss_fulfillments') || '[]');
      const updatedFulfillments = storedFulfillments.map((f: any) => {
        if (f.orderNumber === p.orderNumber) {
          const event = {
            id: Math.random().toString(36).substring(2),
            status: 'confirmed',
            label: 'Confirmed',
            timestamp: new Date().toISOString(),
            actor: 'admin',
            note: 'Manual bank transfer verified and approved by admin'
          };
          return {
            ...f,
            status: 'confirmed',
            events: [...f.events, event]
          };
        }
        return f;
      });
      localStorage.setItem('ss_fulfillments', JSON.stringify(updatedFulfillments));
    } catch (e: any) {
      console.error('Fulfillment sync failed:', e.message);
    }

    // 4. Send Telegram notification to the customer chat!
    try {
      const storedOrders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
      const targetOrder = storedOrders.find((o: any) => o.orderNumber === p.orderNumber);
      const tid = targetOrder?.customer?.telegram_id || targetOrder?.customer?.telegramId || targetOrder?.telegramId || targetOrder?.telegram_id;
      if (tid) {
        fetch('/api/vendor/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: String(tid),
            type: 'order',
            message: `Your payment of Br ${p.amount} for order #${p.orderNumber} has been approved by admin! We are preparing your order.`
          })
        }).catch(() => {});
      }
    } catch {}
  };

  const reject = (id: string) => {
    const reason = prompt('Reason for rejection:');
    const updated = payments.map(p => p.id === id ? { ...p, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'admin' } : p);
    savePayments(updated);
    setPayments(updated);
    const p = updated.find(x => x.id === id);
    if (!p) return;

    toast(`❌ Payment rejected for ${p.orderNumber}`, 'info');
    sendAdminTelegram(`❌ <b>Manual Payment Rejected</b>\n\nOrder: ${p.orderNumber}\nCustomer: ${p.customerName}\nAmount: ${formatPrice(p.amount || 0)}${reason ? '\nReason: ' + reason : ''}`);

    // 1. Update the order's status to 'cancelled' inside Supabase!
    fetch(`/api/orders/${p.orderNumber}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    }).catch(err => console.error('Failed to sync order rejection with backend:', err));

    // 2. Update local ss_orders array
    try {
      const storedOrders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
      const updatedOrders = storedOrders.map((o: any) => o.orderNumber === p.orderNumber ? { ...o, status: 'cancelled' } : o);
      localStorage.setItem('ss_orders', JSON.stringify(updatedOrders));
      
      const { orders } = useStore.getState();
      const storeOrder = orders.find((o: any) => o.orderNumber === p.orderNumber);
      if (storeOrder) {
        storeOrder.status = 'cancelled';
      }
    } catch {}

    // 3. Update local ss_fulfillments status to 'cancelled'
    try {
      const storedFulfillments = JSON.parse(localStorage.getItem('ss_fulfillments') || '[]');
      const updatedFulfillments = storedFulfillments.map((f: any) => {
        if (f.orderNumber === p.orderNumber) {
          const event = {
            id: Math.random().toString(36).substring(2),
            status: 'cancelled',
            label: 'Cancelled',
            timestamp: new Date().toISOString(),
            actor: 'admin',
            note: 'Manual bank transfer rejected by admin' + (reason ? ': ' + reason : '')
          };
          return {
            ...f,
            status: 'cancelled',
            events: [...f.events, event]
          };
        }
        return f;
      });
      localStorage.setItem('ss_fulfillments', JSON.stringify(updatedFulfillments));
    } catch {}

    // 4. Send Telegram notification to the customer chat!
    try {
      const storedOrders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
      const targetOrder = storedOrders.find((o: any) => o.orderNumber === p.orderNumber);
      const tid = targetOrder?.customer?.telegram_id || targetOrder?.customer?.telegramId || targetOrder?.telegramId || targetOrder?.telegram_id;
      if (tid) {
        fetch('/api/vendor/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: String(tid),
            type: 'order',
            message: `Your payment for order #${p.orderNumber} has been rejected by admin.${reason ? ' Reason: ' + reason : ''}`
          })
        }).catch(() => {});
      }
    } catch {}
  };

  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newBankHolder, setNewBankHolder] = useState('');

  const handleAddBankConfirm = () => {
    if (!newBankName.trim() || !newBankAccount.trim() || !newBankHolder.trim()) {
      toast('Please fill in all bank details!', 'error');
      return;
    }
    const newBank = { name: newBankName.trim(), account: newBankAccount.trim(), holder: newBankHolder.trim() };
    const updated = [...bankAccounts, newBank];
    setBankAccounts(updated);
    saveBankAccounts(updated);
    
    setNewBankName('');
    setNewBankAccount('');
    setNewBankHolder('');
    setShowAddBankModal(false);
    toast('✅ Bank account added to list! Click Save All to sync.', 'success');
  };

  const removeBank = (idx: number) => {
    const target = bankAccounts[idx];
    if (target && (target as any).id) {
      fetch(`/api/bank-accounts/${(target as any).id}`, { method: 'DELETE' }).catch(() => {});
    }
    const updated = bankAccounts.filter((_, i) => i !== idx);
    saveBankAccounts(updated); setBankAccounts(updated);
    toast('🗑️ Bank removed from list! Click Save All to sync.', 'info');
  };

  const handleSaveAllBanks = async () => {
    toast('⏳ Saving all bank accounts to database...', 'info');
    try {
      const res = await fetch('/api/bank-accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_accounts: bankAccounts })
      });
      const d = await res.json();
      if (d.success) {
        toast('✅ Bank accounts successfully saved and synced with database!', 'success');
        setShowBankEditor(false);
        // Reload list
        fetch('/api/bank-accounts')
          .then(r => r.json())
          .then(data => {
            if (data && data.bank_accounts) {
              const mapped = data.bank_accounts.map((b: any) => ({
                id: b.id,
                name: b.bank_name,
                account: b.account_number,
                holder: b.account_holder
              }));
              setBankAccounts(mapped);
              saveBankAccounts(mapped);
            }
          });
      } else {
        toast('Failed to save: ' + (d.error || 'Server error'), 'error');
      }
    } catch (err: any) {
      toast('Error saving: ' + err.message, 'error');
    }
  };

  const pending = payments.filter(p => p.status === 'pending').length;

  // Image preview modal
  if (expandedImage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
        <img src={expandedImage} className="max-w-full max-h-full object-contain" alt="Receipt" />
        <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full text-white text-lg" onClick={() => setExpandedImage(null)}>✕</button>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Banknote size={20} className="text-emerald-500" /> Manual Payment Review</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Review bank transfer receipts submitted by customers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-semibold">{pending} pending</span>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" onClick={refresh}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button key={f} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all', filter === f ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({payments.filter(p => f === 'all' || p.status === f).length})
          </button>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Banknote size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No manual payments to review</p>
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{p.orderNumber}</span>
                    <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', p.status === 'pending' ? 'bg-amber-100 text-amber-700' : p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{p.status.toUpperCase()}</span>
                  </div>
                  <div className="text-[8px] text-slate-400 dark:text-slate-500">{new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-2">
                  {/* Left: Customer Info */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-700 dark:text-slate-300"><span className="text-slate-400 dark:text-slate-500">Customer:</span> <span className="font-medium">{p.customerName}</span> <span className="text-slate-400">·</span> {p.customerPhone}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-300"><span className="text-slate-400 dark:text-slate-500">Amount:</span> <span className="font-bold text-emerald-600">{formatPrice(p.amount)}</span>{p.paidAmount && p.paidAmount !== String(p.amount) ? <span className="text-slate-400 ml-1">(Paid: {formatPrice(Number(p.paidAmount))})</span> : ''}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-300"><span className="text-slate-400 dark:text-slate-500">Bank:</span> {p.bankName}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-300"><span className="text-slate-400 dark:text-slate-500">Depositor:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.receiptNumber}</span></div>
                    {p.note && <div className="text-[9px] text-slate-500 dark:text-slate-400 italic mt-1">"{p.note}"</div>}
                  </div>
                  {/* Right: Receipt (Image or Text) */}
                  <div>
                    {p.receiptImage ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md cursor-pointer group h-36" onClick={() => setExpandedImage(p.receiptImage || null)}>
                        <img src={p.receiptImage} className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800" alt="Receipt screenshot" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <ExternalLink size={24} className="text-white" />
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">Click to zoom</div>
                      </div>
                    ) : p.receiptText ? (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2.5 h-36 overflow-y-auto">
                        <div className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                          <FileText size={12} /> SMS Receipt / Transaction Reference
                        </div>
                        <pre className="text-[9px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{p.receiptText}</pre>
                      </div>
                    ) : p.receiptNumber ? (
                      <div className="h-36 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-center">
                          <Copy size={20} className="mx-auto text-slate-400 mb-1" />
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">Depositor name provided</span>
                          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">{p.receiptNumber}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-[9px] text-slate-400">No receipt provided</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Approve/Reject Buttons */}
                {p.status === 'pending' && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => approve(p.id)}>
                      <Check size={16} /> Approve Payment
                    </button>
                    <button className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => reject(p.id)}>
                      <X size={16} /> Reject Payment
                    </button>
                  </div>
                )}
                {p.reviewedAt && (
                  <div className="mt-2 text-[8px] text-slate-400 dark:text-slate-500 text-right">
                    Reviewed {new Date(p.reviewedAt).toLocaleString()} by {p.reviewedBy || 'admin'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Accounts Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 overflow-x-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Banknote size={15} className="text-blue-500" /> Bank Accounts for Manual Payments</h3>
          <button className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-semibold flex items-center gap-1" onClick={() => setShowBankEditor(!showBankEditor)}>
            <Edit3 size={11} /> {showBankEditor ? 'Done' : 'Edit Banks'}
          </button>
        </div>
        <div className="space-y-2">
          {bankAccounts.length === 0 && <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">No bank accounts configured. Add at least one for customers to use.</p>}
          {bankAccounts.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              {showBankEditor ? (
                <>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-slate-800 dark:text-slate-200" value={b.name} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], name: e.target.value }; setBankAccounts(updated);
                    }} />
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent font-mono text-slate-800 dark:text-slate-200" value={b.account} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], account: e.target.value }; setBankAccounts(updated);
                    }} />
                    <input className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-slate-800 dark:text-slate-200" value={b.holder} onChange={e => {
                      const updated = [...bankAccounts]; updated[i] = { ...updated[i], holder: e.target.value }; setBankAccounts(updated);
                    }} />
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" onClick={() => removeBank(i)}><Trash2 size={12} /></button>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">🏦</div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{b.name}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{b.account} · {b.holder}</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {showBankEditor && (
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-emerald-200" onClick={() => setShowAddBankModal(true)}><Plus size={11} /> Add Bank</button>
            <button className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-indigo-200" onClick={handleSaveAllBanks}><Save size={11} /> Save All</button>
          </div>
        )}
      </div>

      {/* In-App Add Bank Modal (No Native Popups!) */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAddBankModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-2xl relative text-left text-foreground" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black mb-3 text-slate-900 dark:text-white flex items-center gap-1.5">🏦 Add Bank Account</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Bank Name</label>
                <input className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-foreground" placeholder="e.g. Commercial Bank of Ethiopia" value={newBankName} onChange={e => setNewBankName(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Account Number</label>
                <input className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-foreground font-mono" placeholder="e.g. 1000123456" value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Account Holder Name</label>
                <input className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-foreground" placeholder="e.g. Smart Shop Trading PLC" value={newBankHolder} onChange={e => setNewBankHolder(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50" onClick={() => setShowAddBankModal(false)}>Cancel</button>
              <button className="flex-[1.5] py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold" onClick={handleAddBankConfirm}>Confirm Add Bank</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
