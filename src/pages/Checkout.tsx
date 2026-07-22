/**
 * World-class Checkout UI — Step-by-step payment flow
 * Step 1: Review + Delivery    Step 2: Choose Payment    Step 3: Bank Transfer Form
 * Confetti celebration modal with rewards on completion
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, generateOrderNumber, cn } from '@/lib/utils';
import { haptic, burstConfetti } from '@/lib/confetti';
import { getTelegramUser } from '@/lib/telegram';
import { createFulfillment, upsertFulfillment } from '@/lib/orderFulfillment';
import { addManualPayment } from '@/components/admin/ManualPaymentReview';
import { sendAdminTelegram } from '@/lib/adminNotifier';
import { toast } from '@/components/Toast';
import {
  ArrowLeft, MapPin, CreditCard, Package, Banknote, Copy, CheckCircle,
  Upload, Lock, Shield, Gift, Sparkles, ChevronRight, Tag, Percent,
  Building2, Camera, ChevronDown, PartyPopper, Trophy, Star, Gem,
  ExternalLink, Wallet, Ticket, X, Check
} from 'lucide-react';

const BANK_ACCOUNTS = [
  { name: 'Commercial Bank of Ethiopia', account: '100000XXXXXXX', holder: 'Smart Shop Trading PLC' },
  { name: 'Dashen Bank', account: '0987654321', holder: 'Smart Shop Trading PLC' },
  { name: 'Awash Bank', account: '013005432100', holder: 'Smart Shop Trading PLC' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const store = useStore();
  const { cart, language, getCartTotal, addOrder, clearCart, addLoyaltyPoints, addNotification, profile, settings, walletHistory, addToWallet } = store;
  const total = getCartTotal();

  // Steps
  const [step, setStep] = useState<'review' | 'payment' | 'bank' | 'confirm'>('review');
  const [paymentMethod, setPaymentMethod] = useState<'chapa' | 'bank' | null>(null);
  const [loading, setLoading] = useState(false);

  // Delivery form
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [locationDetected, setLocationDetected] = useState(false);

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Bank transfer form
  const [selectedBank, setSelectedBank] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptText, setReceiptText] = useState('');
  const [useTextReceipt, setUseTextReceipt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Confirm modal
  const [orderNumber, setOrderNumber] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const chapaEnabled = settings?.chapaTestMode !== false;

  // Auto-detect location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            );
            const data = await res.json();
            const addr = data.address || {};
            const detectedCity = addr.city || addr.town || addr.county || addr.state || '';
            if (detectedCity) {
              setCity(detectedCity);
              setLocationDetected(true);
            }
            const full = [addr.road, addr.suburb, addr.city_district].filter(Boolean).join(', ');
            if (full) setAddress(full);
          } catch {}
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setPromoApplied(true);
      setPromoDiscount(Math.round(total * 0.1));
      toast('🎉 Promo applied! 10% off!', 'success');
    } else if (promoCode.toUpperCase() === 'FREE50') {
      setPromoApplied(true);
      setPromoDiscount(50);
      toast('🎉 Br 50 discount applied!', 'success');
    } else {
      toast('Invalid promo code', 'error');
    }
  };

  const finalTotal = total - promoDiscount;
  const deliveryFee = finalTotal >= 1000 ? 0 : 80;
  const grandTotal = Math.max(0, finalTotal + deliveryFee);

  const placeOrder = async () => {
    if (!name || !phone || !city) { toast('Please fill delivery info', 'error'); return; }
    if (!paymentMethod) { toast('Select a payment method', 'error'); return; }
    if (paymentMethod === 'bank') {
      if (!selectedBank || (!receiptNumber && !receiptText && !receiptImage)) {
        toast('Select bank and provide receipt', 'error'); return;
      }
    }
    setLoading(true);

    const orderNum = generateOrderNumber();
    setOrderNumber(orderNum);
    const points = Math.floor(grandTotal / 10);
    setRewardPoints(points);

    // Random reward: 30% chance of mystery box
    const mysteryBox = Math.random() < 0.3;
    const wheelPrize = Math.random() < 0.1 ? Math.random() * 100 : 0;

    const order = {
      orderNumber: orderNum,
      status: paymentMethod === 'bank' ? 'pending_approval' : 'confirmed',
      items: cart.map(i => ({ id: i.id, name: i.nameEn, quantity: i.qty, price: i.price, total: i.price * i.qty, vendorId: i.vendorId, vendorName: i.vendorName })),
      total: grandTotal,
      subtotal: total,
      discount: promoDiscount,
      delivery: deliveryFee,
      paymentMethod: paymentMethod === 'chapa' ? 'chapa' : 'manual',
      customer: { name, phone, city, address, notes: '' },
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      currency: 'ETB',
      language,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const d = await res.json();
      if (d.success) addLoyaltyPoints(points);
    } catch { addLoyaltyPoints(points); }

    const fulfillment = createFulfillment({
      orderNumber: orderNum, items: order.items, total: order.total,
      customer: order.customer, createdAt: order.createdAt,
    });
    upsertFulfillment(fulfillment);
    addOrder(order);

    if (paymentMethod === 'bank') {
      const receiptToSend = useTextReceipt ? receiptText : receiptNumber;
      addManualPayment({
        orderNumber: orderNum, customerName: name, customerPhone: phone,
        amount: grandTotal, bankName: selectedBank, receiptNumber: receiptToSend,
        paidAmount: paidAmount || String(grandTotal), note: customerNote,
        receiptImage: receiptImage || undefined,
      });
      sendAdminTelegram(
        `🏦 <b>Manual Payment Submitted</b>\n\nOrder: ${orderNum}\nCustomer: ${name} (${phone})\nAmount: Br ${grandTotal.toLocaleString()}\nBank: ${selectedBank}\nReceipt: ${receiptToSend}`
      );
    }

    clearCart();
    setLoading(false);
    setShowConfirm(true);
    haptic('success');
    setTimeout(() => burstConfetti({ count: 60, duration: 4500 }), 100);
  };

  const backToShop = () => { setShowConfirm(false); navigate('/'); };

  if (cart.length === 0) { navigate('/cart'); return null; }

  /* ====== STEP 1: REVIEW & DELIVERY ====== */
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-8">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-5">
            <button className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigate('/cart')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Checkout</h1>
              <p className="text-[10px] text-slate-500">{cart.length} item{cart.length > 1 ? 's' : ''} · Br {grandTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Package size={14} className="text-indigo-500" /> Products</h3>
            <div className="space-y-2">
              {cart.map(i => (
                <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <img src={i.image} className="w-12 h-12 rounded-xl object-cover bg-white" alt={i.nameEn} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{i.nameEn}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{formatPrice(i.price)} each</span>
                      <span>×</span>
                      <span>{i.qty}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-indigo-600">{formatPrice(i.price * i.qty)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-3">
            <div className="flex items-center gap-3">
              <Tag size={14} className="text-amber-500" />
              <div className="flex-1">
                {promoApplied ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={14} />
                    <span className="text-xs font-semibold">Promo applied! -{formatPrice(promoDiscount)}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
                    <button className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-50" onClick={applyPromo} disabled={!promoCode}>Apply</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" /> Delivery Info
              {locationDetected && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-normal">📍 Auto-detected</span>}
            </h3>
            <div className="space-y-2.5">
              <input className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
              <input className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">City *</option>
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Adama">Adama</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Gondar">Gondar</option>
                  <option value="Mekelle">Mekelle</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                  <option value="Jimma">Jimma</option>
                </select>
                <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-4 shadow-sm mb-4">
            <h3 className="text-xs font-bold mb-3 text-indigo-700 dark:text-indigo-400">💰 Price Summary</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span>{formatPrice(total)}</span></div>
              {promoDiscount > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-600">Discount</span><span className="text-emerald-600">-{formatPrice(promoDiscount)}</span></div>}
              <div className="flex justify-between text-xs"><span className="text-slate-500">Delivery</span>{deliveryFee === 0 ? <span className="text-emerald-600 font-medium">Free</span> : <span>{formatPrice(deliveryFee)}</span>}</div>
              {deliveryFee > 0 && <div className="text-[9px] text-slate-400">Free delivery on orders over Br 1,000</div>}
              <div className="border-t border-indigo-200 dark:border-indigo-700/30 pt-2 mt-2 flex justify-between text-base font-bold"><span>Total</span><span className="text-indigo-600">{formatPrice(grandTotal)}</span></div>
            </div>
          </div>

          <button className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all" onClick={() => setStep('payment')}>
            Continue to Payment — {formatPrice(grandTotal)}
          </button>
        </div>
      </div>
    );
  }

  /* ====== STEP 2: CHOOSE PAYMENT ====== */
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-8">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <button className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setStep('review')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Choose Payment</h1>
              <p className="text-[10px] text-slate-500">Secure payment · {formatPrice(grandTotal)}</p>
            </div>
          </div>

          {/* Chapa Option */}
          <div className={cn(
            'relative overflow-hidden rounded-2xl border-2 p-5 mb-3 cursor-pointer transition-all duration-300',
            paymentMethod === 'chapa' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-lg scale-[1.01]' :
            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 hover:shadow-md'
          )} onClick={() => chapaEnabled && setPaymentMethod('chapa')}>
            {/* Background sparkle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl" />

            <div className="flex items-start gap-4 relative z-10">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-lg', 
                chapaEnabled ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-300 dark:bg-slate-600')}>
                {chapaEnabled ? <CreditCard size={22} className="text-white" /> : <Lock size={18} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">💳 Pay with Chapa</h3>
                  {paymentMethod === 'chapa' && <CheckCircle size={16} className="text-indigo-600" />}
                  {!chapaEnabled && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px] font-bold">COMING SOON</span>}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Pay securely with any bank card, Telebirr, or mobile money through Chapa's encrypted gateway.</p>
                {chapaEnabled && (
                  <div className="flex gap-2 mt-2">
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">💳 Visa/MC</span>
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">📱 Telebirr</span>
                    <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">🏦 CBE Birr</span>
                  </div>
                )}
                {!chapaEnabled && (
                  <p className="text-[9px] text-amber-600 mt-1">⏳ Chapa integration is being finalized. Please use Bank Transfer for now.</p>
                )}
              </div>
              {chapaEnabled && <ChevronRight size={18} className={cn('text-slate-300 transition-transform', paymentMethod === 'chapa' && 'rotate-90 text-indigo-600')} />}
            </div>
          </div>

          {/* Bank Transfer Option */}
          <div className={cn(
            'relative overflow-hidden rounded-2xl border-2 p-5 mb-6 cursor-pointer transition-all duration-300',
            paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg scale-[1.01]' :
            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 hover:shadow-md'
          )} onClick={() => setPaymentMethod('bank')}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-3xl" />

            <div className="flex items-start gap-4 relative z-10">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-lg',
                'bg-gradient-to-br from-emerald-500 to-green-600')}>
                <Banknote size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">🏛️ Bank Transfer</h3>
                  {paymentMethod === 'bank' && <CheckCircle size={16} className="text-emerald-600" />}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-bold">RECOMMENDED</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Transfer the amount to our bank account and upload your receipt. Orders are confirmed within minutes.</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">🏦 CBE</span>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">🏦 Dashen</span>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">🏦 Awash</span>
                </div>
              </div>
              {<ChevronRight size={18} className={cn('text-slate-300 transition-transform', paymentMethod === 'bank' && 'rotate-90 text-emerald-600')} />}
            </div>
          </div>

          {/* Proceed Button */}
          <button className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all',
            paymentMethod === 'chapa' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.01]' :
            paymentMethod === 'bank' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl hover:scale-[1.01]' :
            'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          )} onClick={() => {
            if (paymentMethod === 'chapa') {
              if (!chapaEnabled) { toast('⏳ Chapa coming soon! Use Bank Transfer.', 'info'); return; }
              setStep('review'); placeOrder(); // Will trigger chapa redirect
            } else if (paymentMethod === 'bank') {
              setStep('bank');
            }
          }} disabled={!paymentMethod}>
            {paymentMethod === 'chapa' ? '💳 Continue with Chapa' :
             paymentMethod === 'bank' ? '🏛️ Continue with Bank Transfer' :
             'Select a payment method'}
          </button>

          <p className="text-center text-[9px] text-slate-400 mt-4 flex items-center justify-center gap-1">
            <Shield size={10} /> Secured with encryption · Your data is safe
          </p>
        </div>
      </div>
    );
  }

  /* ====== STEP 3: BANK TRANSFER FORM ====== */
  if (step === 'bank') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-8">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-5">
            <button className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setStep('payment')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Bank Transfer</h1>
              <p className="text-[10px] text-slate-500">Transfer and upload your receipt</p>
            </div>
          </div>

          {/* Amount to Pay */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 p-4 mb-4 text-center">
            <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">Amount to Transfer</div>
            <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{formatPrice(grandTotal)}</div>
            <div className="text-[9px] text-slate-500 mt-1">Transfer this exact amount to any bank below</div>
          </div>

          {/* Bank Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Building2 size={14} className="text-blue-500" /> Select Bank</h3>
            <div className="space-y-2">
              {BANK_ACCOUNTS.map(b => (
                <div key={b.name} className={cn(
                  'p-3 rounded-xl border-2 cursor-pointer transition-all',
                  selectedBank === b.name ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                )} onClick={() => setSelectedBank(b.name)}>
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={selectedBank === b.name} onChange={() => setSelectedBank(b.name)} className="accent-emerald-500" />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{b.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">{b.account}</span>
                        <button className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.account); toast('📋 Copied!', 'success'); }}>
                          <Copy size={10} className="text-slate-400" />
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-400">Account Name: {b.holder}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Upload size={14} className="text-amber-500" /> Upload Receipt</h3>
            
            {/* Toggle between image and text */}
            <div className="flex gap-2 mb-3">
              <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all', !useTextReceipt ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500')} onClick={() => setUseTextReceipt(false)}>
                <Camera size={12} className="inline mr-1" /> Photo
              </button>
              <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all', useTextReceipt ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-500')} onClick={() => setUseTextReceipt(true)}>
                <Copy size={12} className="inline mr-1" /> Paste Receipt
              </button>
            </div>

            {!useTextReceipt ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
                {receiptImage ? (
                  <div className="relative">
                    <img src={receiptImage} className="max-h-40 mx-auto rounded-lg object-contain" alt="Receipt" />
                    <button className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs shadow-lg flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setReceiptImage(''); }}><X size={12} /></button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-2">
                      <Camera size={28} className="text-indigo-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tap to upload receipt photo</p>
                    <p className="text-[9px] text-slate-400 mt-1">PNG, JPG — Max 5MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setReceiptImage(ev.target?.result as string); r.readAsDataURL(f); }
                }} />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9px] text-slate-400">Paste your receipt/transaction number below (recommended — fastest approval):</p>
                <textarea className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Paste your receipt number or transaction reference here..." value={receiptText} onChange={e => setReceiptText(e.target.value)} />
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
              <Copy size={12} className="text-amber-500 flex-shrink-0" />
              <p className="text-[9px] text-amber-700 dark:text-amber-400"><strong>💡 Tip:</strong> Copying your receipt number is faster and helps admin verify your payment quickly!</p>
            </div>
          </div>

          {/* Confirmation fields */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-4">
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Receipt Number *</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="e.g. CBE-20260723-XXXX" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Amount Paid (Br)</label>
                <input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder={String(grandTotal)} value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                <p className="text-[8px] text-slate-400 mt-0.5">Expected amount: {formatPrice(grandTotal)}</p>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Note (optional)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Any message for the admin..." value={customerNote} onChange={e => setCustomerNote(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <button className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all',
            selectedBank ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl hover:scale-[1.01] disabled:opacity-50' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          )} onClick={placeOrder} disabled={!selectedBank || loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
            ) : (
              `📤 Submit Payment — ${formatPrice(grandTotal)}`
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ====== CONFIRMATION MODAL ====== */
  return (
    <>
      {/* Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeUp p-4" onClick={() => {}}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Success Animation */}
            <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-3 animate-scaleIn" style={{ animationDelay: '0.3s' }}>
                  <PartyPopper size={40} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Order Ploved! 🎉</h2>
                <p className="text-sm text-white/80 mt-1">Thank you for shopping!</p>
                <div className="inline-block bg-white/20 backdrop-blur rounded-lg px-3 py-1 mt-3 font-mono text-xs text-white">
                  #{orderNumber}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Gift size={14} className="text-pink-500" /> 🎉 You received:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800/30">
                  <Star size={18} className="mx-auto text-amber-500 mb-1" />
                  <div className="text-lg font-bold text-amber-700">{rewardPoints}</div>
                  <div className="text-[8px] text-amber-600 font-medium">Loyalty Points</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-3 text-center border border-purple-200 dark:border-purple-800/30">
                  <Gem size={18} className="mx-auto text-purple-500 mb-1" />
                  <div className="text-lg font-bold text-purple-700">+1</div>
                  <div className="text-[8px] text-purple-600 font-medium">Mystery Box 🎁</div>
                </div>
              </div>

              {/* Status message */}
              <div className={cn(
                'rounded-xl p-3 text-[10px]',
                paymentMethod === 'bank' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700'
              )}>
                {paymentMethod === 'bank' ? (
                  <span>⏳ Your payment is being reviewed by admin. You'll be notified once confirmed.</span>
                ) : (
                  <span>✅ Your payment has been processed successfully. Your order is being prepared!</span>
                )}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => navigate('/loyalty')}>
                  🎯 View Rewards
                </button>
                <button className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={backToShop}>
                  🛍️ Back to Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for when step is confirm but modal already shown */}
      {!showConfirm && <div className="min-h-screen flex items-center justify-center"><p className="text-xs text-slate-400">Redirecting...</p></div>}
    </>
  );
}
