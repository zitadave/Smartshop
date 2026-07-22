import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, generateOrderNumber, cn } from '@/lib/utils';
import { CheckoutSteps } from '@/components/ui/CheckoutSteps';
import { haptic } from '@/lib/confetti';
import { getTelegramUser } from '@/lib/telegram';
import { createFulfillment, upsertFulfillment } from '@/lib/orderFulfillment';
import { addManualPayment } from '@/components/admin/ManualPaymentReview';
import { ArrowLeft, MapPin, CreditCard, Package, Banknote, Copy, CheckCircle, Upload, Image, Lock, Shield } from 'lucide-react';

/** Read bank accounts from admin settings (localStorage) with defaults */
function getBankAccounts(): { name: string; account: string; holder: string }[] {
  try {
    const saved = localStorage.getItem('ss_bank_accounts');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { name: 'Commercial Bank of Ethiopia', account: '100000XXXXXXX', holder: 'Smart Shop Trading PLC' },
    { name: 'Dashen Bank', account: '0987654321', holder: 'Smart Shop Trading PLC' },
  ];
}

/** Check if Chapa test mode is enabled */
function isChapaEnabled(): boolean {
  try {
    const store = JSON.parse(localStorage.getItem('ss_store') || '{}');
    const state = JSON.parse(store.state || '{}');
    return state.settings?.chapaTestMode !== false;
  } catch { return true; }
}

export default function Checkout() {
  const navigate = useNavigate();
  const store = useStore();
  const { cart, language, getCartTotal, addOrder, clearCart, addLoyaltyPoints, addNotification, profile, savedPayments, addSavedPayment, settings } = store;
  const total = getCartTotal();

  const tgUser = getTelegramUser();
  const cachedAuth = (() => {
    try { return JSON.parse(localStorage.getItem('ss_telegram_auth') || 'null'); } catch { return null; }
  })();
  const authUser = cachedAuth?.user;

  const [name, setName] = useState(profile.name || authUser?.fullName || authUser?.firstName || tgUser?.first_name || '');
  const [phone, setPhone] = useState(profile.phone || authUser?.phone || '');
  const [city, setCity] = useState(authUser?.city || '');
  const [payment, setPayment] = useState('telebirr');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');

  // Manual payment fields
  const [manualBank, setManualBank] = useState('');
  const [manualReceipt, setManualReceipt] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [manualReceiptImage, setManualReceiptImage] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const BANK_ACCOUNTS = getBankAccounts();
  const chapaEnabled = settings?.chapaTestMode !== false;

  const copyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    store.addNotification('📋', 'Account number copied!');
  };

  const placeOrder = async () => {
    if (!name || !phone || !city) { alert('Please fill all fields'); return; }

    if (payment === 'manual') {
      if (!manualBank || !manualReceipt) {
        alert('Please select your bank and enter the receipt number');
        return;
      }
      setManualSubmitted(true);
    }

    setLoading(true);
    haptic('medium');

    const orderNumber = generateOrderNumber();
    const order = {
      orderNumber,
      status: payment === 'chapa' ? 'pending_payment' : 'pending_approval',
      items: cart.map(i => ({ id: i.id, name: i.nameEn, quantity: i.qty, price: i.price, total: i.price * i.qty, vendorId: i.vendorId, vendorName: i.vendorName })),
      total,
      subtotal: total,
      discount: 0,
      delivery: 0,
      paymentMethod: payment,
      customer: { name, phone, city, address: '', notes: '' },
      date: new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      currency: 'ETB',
      language,
    };

    addSavedPayment({ type: payment, icon: payment === 'telebirr' ? '📱' : payment === 'cbebirr' ? '🏦' : payment === 'chapa' ? '💳' : payment === 'manual' ? '🏦' : '💵', name: payment, number: phone });

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const data = await res.json();
      if (data.success) {
        order.orderNumber = data.order.orderNumber || orderNumber;
        addLoyaltyPoints(Math.floor((data.order?.total || total) / 10));
      }
    } catch (e) {
      addLoyaltyPoints(Math.floor(total / 10));
    }

    const fulfillment = createFulfillment({
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
      customer: order.customer,
      createdAt: order.createdAt,
    });
    upsertFulfillment(fulfillment);

    addOrder(order);
    addNotification('📦', 'Order placed! #' + order.orderNumber);
    addNotification('🏪', 'Vendor has been notified about your order #' + order.orderNumber);

    if (payment === 'manual') {
      addManualPayment({
        orderNumber: order.orderNumber,
        customerName: name,
        customerPhone: phone,
        amount: total,
        bankName: manualBank,
        receiptNumber: manualReceipt,
        paidAmount: manualAmount,
        note: manualNote,
        receiptImage: manualReceiptImage || undefined,
      });
      clearCart();
      setLoading(false);
      haptic('success');
      navigate('/confirmation/' + order.orderNumber);
      return;
    }

    clearCart();
    setLoading(false);
    haptic('success');

    if (payment === 'chapa') {
      try {
        const chapaRes = await fetch('/api/payment/initiate-chapa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            email: phone + '@smartshop.et',
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ') || '',
            phone,
            txRef: 'TXN-' + order.orderNumber,
            orderNumber: order.orderNumber,
          }),
        });
        const chapaData = await chapaRes.json();
        if (chapaData.checkout_url) {
          window.location.href = chapaData.checkout_url;
          return;
        }
      } catch {}
    } else if (payment === 'telebirr') {
      alert('📱 Dial *847#' + total + '#' + order.orderNumber + ' to complete payment using Telebirr');
    }

    navigate('/confirmation/' + order.orderNumber);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const paymentOptions = [
    { id: 'telebirr', icon: '📱', label: 'Telebirr', desc: 'Pay with mobile money' },
    { id: 'cbebirr', icon: '🏦', label: 'CBE Birr', desc: 'Pay from CBE account' },
    { id: 'chapa', icon: '💳', label: 'Chapa (Bank/Card)', desc: chapaEnabled ? 'Credit/Debit card online' : '⏳ Coming soon - use Bank Transfer instead', disabled: !chapaEnabled },
    { id: 'manual', icon: '🏛️', label: 'Bank Transfer', desc: 'Pay via bank & upload receipt', highlight: !chapaEnabled },
  ];

  return (
    <div className="px-4 pt-4 pb-10 max-w-lg mx-auto animate-fadeUp">
      <div className="flex items-center gap-3 mb-4">
        <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => navigate('/cart')}><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-bold">{t('checkout', language)}</h2>
      </div>
      <CheckoutSteps current={step} className="mb-4" />
      
      {step === 'delivery' && (
        <div className="space-y-3 animate-fadeUp">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><MapPin size={14} /> Delivery Info</h3>
            <div className="space-y-2.5">
              <input className="w-full p-3 border border-border/60 rounded-xl text-sm bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
              <input className="w-full p-3 border border-border/60 rounded-xl text-sm bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
              <select className="w-full p-3 border border-border/60 rounded-xl text-sm bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Select City</option>
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Adama">Adama</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Gondar">Gondar</option>
                <option value="Mekelle">Mekelle</option>
                <option value="Dire Dawa">Dire Dawa</option>
                <option value="Jimma">Jimma</option>
              </select>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><Package size={14} /> Items</h3>
            {cart.slice(0, 3).map(i => (
              <div key={i.id} className="flex justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{i.nameEn} × {i.qty}</span>
                <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
            {cart.length > 3 && <p className="text-xs text-muted-foreground/60 mt-1">+{cart.length - 3} more items</p>}
          </div>
          <button className="w-full py-3.5 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200" onClick={() => setStep('payment')}>Continue to Payment →</button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-3 animate-fadeUp">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"><CreditCard size={14} /> Choose Payment Method</h3>
            {savedPayments.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] text-muted-foreground/60 mb-1.5 font-medium">Saved</div>
                {savedPayments.slice(-3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-muted/50 rounded-xl mb-1.5 cursor-pointer text-xs border border-border/60 hover:border-primary/30 transition-all" onClick={() => setPayment(p.type)}>
                    <span className="text-base">{p.icon}</span><span>{p.name} • {p.number?.slice(-4)}</span>
                    {payment === p.type && <span className="ml-auto text-primary text-sm">✓</span>}
                  </div>
                ))}
              </div>
            )}
            {paymentOptions.map(p => {
              const selected = payment === p.id;
              return (
                <div key={p.id}
                  className={cn('flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 text-xs border transition-all',
                    p.highlight && !selected ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 
                    p.disabled ? 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 opacity-70 cursor-not-allowed' :
                    selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/30 cursor-pointer'
                  )}
                  onClick={() => !p.disabled && setPayment(p.id)}>
                  <span className="text-base">{p.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium">{p.label}</span>
                    <div className="text-[9px] text-muted-foreground">{p.desc}</div>
                  </div>
                  {p.disabled && <Lock size={12} className="text-slate-400" />}
                  {selected && !p.disabled && <span className="text-primary font-bold">✓</span>}
                </div>
              );
            })}
          </div>

          {/* Manual Payment Form */}
          {payment === 'manual' && !manualSubmitted && (
            <div className="bg-card rounded-2xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm animate-fadeUp">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Banknote size={14} className="text-amber-600" /> Bank Transfer Details</h3>
              
              {/* Bank Selection */}
              <div className="space-y-2 mb-3">
                <p className="text-[9px] text-muted-foreground font-medium mb-1">Select your bank and transfer the exact amount to:</p>
                {BANK_ACCOUNTS.map((b, i) => (
                  <div key={i} className={cn('p-2.5 rounded-xl border text-[10px] cursor-pointer transition-all', manualBank === b.name ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30')} onClick={() => setManualBank(b.name)}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">🏦 {b.name}</span>
                      {manualBank === b.name && <CheckCircle size={12} className="text-primary ml-auto" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-muted-foreground font-mono">{b.account}</span>
                      <button className="p-0.5 hover:bg-slate-100 rounded" onClick={(e) => { e.stopPropagation(); copyAccount(b.account); }}><Copy size={10} className="text-slate-400" /></button>
                    </div>
                    <div className="text-muted-foreground">Account Name: {b.holder}</div>
                  </div>
                ))}
              </div>

              {/* Receipt Upload */}
              <div className="mb-3">
                <p className="text-[9px] font-medium text-muted-foreground mb-1">📸 Upload Receipt Photo (optional but recommended)</p>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
                  {manualReceiptImage ? (
                    <div className="relative">
                      <img src={manualReceiptImage} className="max-h-32 mx-auto rounded-lg object-contain" alt="Receipt preview" />
                      <button className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px]" onClick={() => setManualReceiptImage('')}>✕</button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} className="mx-auto text-slate-400" />
                      <p className="text-[10px] text-slate-500 mt-1">Tap to upload receipt image</p>
                      <p className="text-[8px] text-slate-400">PNG, JPG, WebP</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setManualReceiptImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>

              <div className="space-y-2">
                <input className="w-full p-2.5 border border-border/60 rounded-xl text-xs bg-transparent" placeholder="Receipt / Transaction Number *" value={manualReceipt} onChange={e => setManualReceipt(e.target.value)} />
                <input type="number" className="w-full p-2.5 border border-border/60 rounded-xl text-xs bg-transparent" placeholder={`Amount You Paid (Br) — should be ${formatPrice(total)}`} value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
                <textarea className="w-full p-2.5 border border-border/60 rounded-xl text-xs bg-transparent resize-none h-16" placeholder="Optional note for admin..." value={manualNote} onChange={e => setManualNote(e.target.value)} />
              </div>
              <p className="text-[9px] text-amber-600 mt-2">After submitting, admin will review your payment. You'll be notified once confirmed.</p>
            </div>
          )}

          {/* Manual submitted confirmation */}
          {payment === 'manual' && manualSubmitted && (
            <div className="bg-card rounded-2xl border border-emerald-200 p-4 shadow-sm animate-fadeUp">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle size={18} />
                <span className="text-xs font-bold">Payment Receipt Submitted!</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Bank: {manualBank} · Receipt: {manualReceipt}</p>
              {manualReceiptImage && <img src={manualReceiptImage} className="max-h-20 mt-2 rounded-lg object-contain" alt="Receipt" />}
              <p className="text-[9px] text-amber-600 mt-1">⏳ Order pending admin approval. You'll be notified once confirmed.</p>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Delivery</span><span className="text-green-600 font-medium">Free</span></div>
            <div className="border-t border-border/60 pt-2 flex justify-between text-base font-bold mt-2"><span>Total</span><span className="text-primary text-xl">{formatPrice(total)}</span></div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3 border border-border/60 rounded-2xl text-xs font-medium hover:bg-muted transition-colors" onClick={() => setStep('delivery')}>← Back</button>
            <button className="flex-[2] py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50" onClick={placeOrder} disabled={loading}>
              {loading ? '⏳ Processing...' : payment === 'manual' ? '📤 Submit Payment Proof' : `✅ Pay ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
