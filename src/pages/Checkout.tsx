/**
 * World-class Checkout — Beautiful, theme-consistent, no duplicate notifications
 * Step 1: Review + Delivery Step 2: Choose Payment Step 3: Bank Transfer Form
 * Confetti celebration modal with rewards, theme-aware
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, generateOrderNumber, cn } from '@/lib/utils';
import { haptic, burstConfetti } from '@/lib/confetti';
import { createFulfillment, upsertFulfillment } from '@/lib/orderFulfillment';
import { addManualPayment } from '@/components/admin/ManualPaymentReview';
import { toast } from '@/components/Toast';
import {
 ArrowLeft, MapPin, CreditCard, Package, Banknote, Copy, CheckCircle,
 Upload, Lock, Shield, Gift, ChevronRight, Tag, Building2, Camera,
 ChevronDown, PartyPopper, Star, Gem, X, Check, ChevronUp
} from 'lucide-react';

function getBankAccounts() {
 try { const s = localStorage.getItem('ss_bank_accounts'); if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; } } catch {}
 return [
 { name: 'Commercial Bank of Ethiopia', account: '100000XXXXXXX', holder: 'Smart Shop Trading PLC' },
 { name: 'Dashen Bank', account: '0987654321', holder: 'Smart Shop Trading PLC' },
 { name: 'Awash Bank', account: '013005432100', holder: 'Smart Shop Trading PLC' },
 ];
}
const BANK_ACCOUNTS = getBankAccounts();

export default function Checkout() {
 const navigate = useNavigate();
 const store = useStore();
 const { cart, language, getCartTotal, addOrder, clearCart, addLoyaltyPoints, addNotification, profile, settings } = store;
 const total = getCartTotal();

 const [step, setStep] = useState<'review' | 'payment' | 'bank'>('review');
 const [paymentMethod, setPaymentMethod] = useState<'chapa' | 'bank' | null>(null);
 const [loading, setLoading] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [orderNumber, setOrderNumber] = useState('');
 const [rewardPoints, setRewardPoints] = useState(0);

 const [name, setName] = useState(profile.name || '');
 const [phone, setPhone] = useState(profile.phone || '');
 const [city, setCity] = useState('');
 const [address, setAddress] = useState('');
 const [locationDetected, setLocationDetected] = useState(false);

 const [promoCode, setPromoCode] = useState('');
 const [promoApplied, setPromoApplied] = useState(false);
 const [promoDiscount, setPromoDiscount] = useState(0);

 const [selectedBank, setSelectedBank] = useState('');
 const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
 const [depositorName, setDepositorName] = useState('');
 const [paidAmount, setPaidAmount] = useState('');
 const [customerNote, setCustomerNote] = useState('');
 const [receiptImage, setReceiptImage] = useState<string>('');
 const [receiptText, setReceiptText] = useState('');
 const [useTextReceipt, setUseTextReceipt] = useState(false);
 const fileRef = useRef<HTMLInputElement>(null);

 const chapaEnabled = settings?.chapaTestMode !== false;

 useEffect(() => {
 if ('geolocation' in navigator) {
 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 try {
 const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
 const data = await res.json();
 const addr = data.address || {};
 const detectedCity = addr.city || addr.town || addr.county || addr.state || addr.village || '';
 // Normalize city names to match our dropdown
 const normalizedCities: Record<string, string> = {
 'addis ababa': 'Addis Ababa', 'addis': 'Addis Ababa',
 'bahir dar': 'Bahir Dar', 'adar': 'Bahir Dar',
 'nazret': 'Adama', 'nazareth': 'Adama', 'adama': 'Adama',
 'awasa': 'Hawassa', 'awassa': 'Hawassa', 'hawassa': 'Hawassa',
 'gonder': 'Gondar', 'gondar': 'Gondar',
 'mekele': 'Mekelle', 'mekelle': 'Mekelle',
 'dir dawa': 'Dire Dawa', 'dire dawa': 'Dire Dawa',
 'jima': 'Jimma', 'jimma': 'Jimma',
 };
 const key = detectedCity.toLowerCase().trim();
 const finalCity = normalizedCities[key] || detectedCity;
 if (finalCity) {
 setCity(finalCity);
 setLocationDetected(true);
 }
 const full = [addr.road, addr.suburb, addr.city_district, addr.neighbourhood].filter(Boolean).join(', ');
 if (full || detectedCity) {
 const addressStr = full ? full + (detectedCity ? ', ' + detectedCity : '') : detectedCity;
 setAddress(addressStr);
 }
 } catch {}
 }, () => {}, { timeout: 5000 }
 );
 }
 }, []);

 const applyPromo = () => {
 if (promoCode.toUpperCase() === 'WELCOME10') { setPromoApplied(true); setPromoDiscount(Math.round(total * 0.1)); toast('10% off applied!', 'success'); }
 else if (promoCode.toUpperCase() === 'FREE50') { setPromoApplied(true); setPromoDiscount(50); toast('Br 50 off applied!', 'success'); }
 else toast('Invalid promo code', 'error');
 };

 const finalTotal = total - promoDiscount;
 const deliveryFee = finalTotal >= 1000 ? 0 : 80;
 const grandTotal = Math.max(0, finalTotal + deliveryFee);

 const placeOrder = async () => {
 if (!name || !phone || !city) { toast('Please fill delivery info', 'error'); return; }
 if (!paymentMethod) return;
 if (paymentMethod === 'bank' && (!selectedBank || (!depositorName && !receiptText && !receiptImage))) {
 toast('Select bank and provide depositor name', 'error'); return;
 }
 setLoading(true);

 const orderNum = generateOrderNumber();
 setOrderNumber(orderNum);
 const points = Math.floor(grandTotal / 10);
 setRewardPoints(points);

 const order = {
 orderNumber: orderNum,
 status: paymentMethod === 'bank' ? 'pending_approval' : 'confirmed',
 items: cart.map(i => ({ id: i.id, name: i.nameEn, quantity: i.qty, price: i.price, total: i.price * i.qty, vendorId: i.vendorId, vendorName: i.vendorName })),
 total: grandTotal, subtotal: total, discount: promoDiscount, delivery: deliveryFee,
 paymentMethod: paymentMethod === 'chapa' ? 'chapa' : 'manual',
 customer: { name, phone, city, address, notes: '' },
 date: new Date().toLocaleDateString(), createdAt: new Date().toISOString(), currency: 'ETB', language,
 };

 try {
 const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
 const d = await res.json();
 if (d.success) addLoyaltyPoints(points);
 } catch { addLoyaltyPoints(points); }

 const fulfillment = createFulfillment({ orderNumber: orderNum, items: order.items, total: order.total, customer: order.customer, createdAt: order.createdAt });
 upsertFulfillment(fulfillment);
 addOrder(order);

 if (paymentMethod === 'bank') {
 // ALWAYS send depositorName as receiptNumber, receiptText separately
 addManualPayment({
 orderNumber: orderNum, customerName: name, customerPhone: phone,
 amount: grandTotal, bankName: selectedBank,
 receiptNumber: depositorName || 'Not provided',
 paidAmount: paidAmount || String(grandTotal), note: customerNote,
 receiptImage: receiptImage || undefined,
 receiptText: useTextReceipt ? receiptText : undefined,
 });
 // addManualPayment sends Telegram notification
 }

 clearCart();
 setLoading(false);
 setShowConfirm(true);
 haptic('success');
 setTimeout(() => burstConfetti({ count: 60, duration: 4500 }), 300);
 };

 // ===== CONFIRMATION MODAL (theme-aware) =====
 if (showConfirm) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
 <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-8 text-center relative overflow-hidden">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
 <div className="relative z-10">
 <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-3 animate-scaleIn">
 <PartyPopper size={40} className="text-white" />
 </div>
 <h2 className="text-xl font-bold text-white">Order Placed! 🎉</h2>
 <p className="text-sm text-white/80 mt-1">Thank you for shopping!</p>
 <div className="inline-block bg-white/20 backdrop-blur rounded-lg px-3 py-1 mt-3 font-mono text-xs text-white">#{orderNumber}</div>
 </div>
 </div>
 <div className="p-5 space-y-3 bg-white">
 <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2"><Gift size={14} className="text-pink-500" /> You received:</h3>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800/30">
 <Star size={18} className="mx-auto text-amber-500 mb-1" />
 <div className="text-lg font-bold text-amber-700">{rewardPoints}</div>
 <div className="text-[8px] text-amber-600 font-medium">Loyalty Points</div>
 </div>
 <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-3 text-center border border-purple-200 dark:border-purple-800/30">
 <Gem size={18} className="mx-auto text-purple-500 mb-1" />
 <div className="text-lg font-bold text-purple-700">+1</div>
 <div className="text-[8px] text-purple-600 font-medium">Mystery Box</div>
 </div>
 </div>
 <div className={cn('rounded-xl p-3 text-[10px]', paymentMethod === 'bank' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>
 {paymentMethod === 'bank' ? 'Your payment is being reviewed by admin. You will be notified once confirmed.' : 'Your payment has been processed. Your order is being prepared!'}
 </div>
 <div className="flex gap-2">
 <button className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => { window.location.href = '/loyalty'; }}>View Rewards</button>
 <button className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={() => { window.location.href = '/shop'; }}>Back to Shop</button>
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (cart.length === 0 && !showConfirm) { navigate('/cart'); return null; }

 // ===== STEP 1: REVIEW =====
 if (step === 'review') {
 return (
 <div className="min-h-screen bg-background pb-8">
 <div className="max-w-lg mx-auto px-4 pt-4">
 <div className="flex items-center gap-3 mb-5">
 <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => navigate('/cart')}><ArrowLeft size={18} /></button>
 <div><h1 className="text-lg font-bold text-foreground">Checkout</h1><p className="text-[10px] text-muted-foreground">{cart.length} item{cart.length > 1 ? 's' : ''} &middot; Br {grandTotal.toLocaleString()}</p></div>
 </div>
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
 <h3 className="text-xs font-bold text-foreground mb-3"><Package size={14} className="inline mr-1 text-indigo-500" /> Products</h3>
 <div className="space-y-2">{cart.map(i => (
 <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
 <img src={i.image} className="w-12 h-12 rounded-xl object-cover bg-white" alt={i.nameEn} />
 <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-foreground truncate">{i.nameEn}</div><div className="text-[10px] text-muted-foreground mt-0.5">{formatPrice(i.price)} each &times; {i.qty}</div></div>
 <div className="text-sm font-bold text-indigo-600">{formatPrice(i.price * i.qty)}</div>
 </div>
 ))}</div>
 </div>
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
 <div className="flex items-center gap-3"><Tag size={14} className="text-amber-500" /><div className="flex-1">{promoApplied ? (
 <div className="flex items-center gap-2 text-emerald-600"><CheckCircle size={14} /><span className="text-xs font-semibold text-foreground">Promo applied! -{formatPrice(promoDiscount)}</span></div>
 ) : (
 <div className="flex gap-2"><input className="flex-1 p-2 border border-border rounded-lg text-xs bg-transparent text-foreground" placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} /><button className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-50" onClick={applyPromo} disabled={!promoCode}>Apply</button></div>
 )}</div></div>
 </div>
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
 <h3 className="text-xs font-bold text-foreground mb-3"><MapPin size={14} className="inline mr-1 text-emerald-500" /> Delivery Info{locationDetected && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-normal ml-1">Auto-detected</span>}</h3>
 <div className="space-y-2.5">
 <input className="w-full p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
 <input className="w-full p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} />
 <div className="grid grid-cols-2 gap-2">
 <select className="p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" value={city} onChange={e => setCity(e.target.value)}>
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
 <input className="p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
 </div>
 </div>
 </div>
 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-4 shadow-sm mb-4">
 <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3">Price Summary</h3>
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatPrice(total)}</span></div>
 {promoDiscount > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-600">Discount</span><span className="text-emerald-600">-{formatPrice(promoDiscount)}</span></div>}
 <div className="flex justify-between text-xs"><span className="text-muted-foreground">Delivery</span>{deliveryFee === 0 ? <span className="text-emerald-600 font-medium">Free</span> : <span className="text-foreground">{formatPrice(deliveryFee)}</span>}</div>
 {deliveryFee > 0 && <div className="text-[9px] text-muted-foreground">Free delivery on orders over Br 1,000</div>}
 <div className="border-t border-indigo-200 dark:border-indigo-700/30 pt-2 mt-2 flex justify-between text-base font-bold"><span className="text-foreground">Total</span><span className="text-indigo-600">{formatPrice(grandTotal)}</span></div>
 </div>
 </div>
 <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all" onClick={() => setStep('payment')}>
 Continue to Payment &mdash; {formatPrice(grandTotal)}
 </button>
 </div>
 </div>
 );
 }

 // ===== STEP 2: CHOOSE PAYMENT =====
 if (step === 'payment') {
 const options = [
 { id: 'chapa' as const, icon: <CreditCard size={22} className="text-white" />, label: 'Pay with Chapa', desc: 'Pay securely with any bank card, Telebirr, or mobile money.', tags: ['Visa/MC', 'Telebirr', 'CBE Birr'], disabled: !chapaEnabled, badge: chapaEnabled ? null : 'COMING SOON' },
 { id: 'bank' as const, icon: <Banknote size={22} className="text-white" />, label: 'Bank Transfer', desc: 'Transfer the amount to our bank account and upload your receipt.', tags: ['CBE', 'Dashen', 'Awash'], disabled: false, badge: 'RECOMMENDED' },
 ];

 return (
 <div className="min-h-screen bg-background pb-8">
 <div className="max-w-lg mx-auto px-4 pt-4">
 <div className="flex items-center gap-3 mb-6">
 <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setStep('review')}><ArrowLeft size={18} /></button>
 <div><h1 className="text-lg font-bold text-foreground">Choose Payment</h1><p className="text-[10px] text-muted-foreground">Secure payment &middot; {formatPrice(grandTotal)}</p></div>
 </div>
 {options.map(opt => {
 const sel = paymentMethod === opt.id;
 return (
 <div key={opt.id}
 className={cn('relative overflow-hidden rounded-2xl border-2 p-5 mb-3 cursor-pointer transition-all duration-300',
 sel ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-lg scale-[1.01]' : 'border-border bg-card hover:border-indigo-300 hover:shadow-md',
 opt.disabled && !sel ? 'opacity-60' : ''
 )}
 onClick={() => !opt.disabled && setPaymentMethod(opt.id)}>
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl" />
 <div className="flex items-start gap-4 relative z-10">
 <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg', opt.disabled && !sel ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600')}>{opt.disabled && !sel ? <Lock size={18} className="text-white" /> : opt.icon}</div>
 <div className="flex-1">
 <div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-sm text-foreground">{opt.icon.props.className.includes('Banknote') ? 'Bank Transfer' : 'Pay with Chapa'}</h3>{sel && <CheckCircle size={16} className="text-indigo-600" />}{opt.badge && <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-bold', opt.badge === 'RECOMMENDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{opt.badge}</span>}</div>
 <p className="text-[10px] text-muted-foreground mt-1">{opt.desc}</p>
 <div className="flex gap-2 mt-2 flex-wrap">{opt.tags.map((t, i) => <span key={i} className="text-[8px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">{t}</span>)}</div>
 {opt.disabled && <p className="text-[9px] text-amber-600 mt-1">Chapa is being finalized. Please use Bank Transfer.</p>}
 </div>
 <ChevronRight size={18} className={cn('text-muted-foreground/40 transition-transform', sel && 'rotate-90 text-indigo-600')} />
 </div>
 </div>
 );
 })}
 <button className={cn('w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all',
 paymentMethod === 'chapa' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.01]' :
 paymentMethod === 'bank' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl hover:scale-[1.01]' :
 'bg-muted text-muted-foreground cursor-not-allowed'
 )} onClick={() => {
 if (!paymentMethod) return;
 if (paymentMethod === 'chapa') { if (!chapaEnabled) { toast('Chapa coming soon! Use Bank Transfer.', 'info'); return; } placeOrder(); }
 else setStep('bank');
 }} disabled={!paymentMethod}>
 {paymentMethod === 'chapa' ? 'Continue with Chapa' : paymentMethod === 'bank' ? 'Continue with Bank Transfer' : 'Select a payment method'}
 </button>
 <p className="text-center text-[9px] text-muted-foreground mt-4 flex items-center justify-center gap-1"><Shield size={10} /> Secured with encryption</p>
 </div>
 </div>
 );
 }

 // ===== STEP 3: BANK TRANSFER =====
 if (step === 'bank') {
 return (
 <div className="min-h-screen bg-background pb-8">
 <div className="max-w-lg mx-auto px-4 pt-4">
 <div className="flex items-center gap-3 mb-5">
 <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setStep('payment')}><ArrowLeft size={18} /></button>
 <div><h1 className="text-lg font-bold text-foreground">Bank Transfer</h1><p className="text-[10px] text-muted-foreground">Transfer and upload your receipt</p></div>
 </div>
 <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 p-4 mb-4 text-center">
 <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">Amount to Transfer</div>
 <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{formatPrice(grandTotal)}</div>
 </div>

 {/* Custom Bank Dropdown */}
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
 <h3 className="text-xs font-bold text-foreground mb-3"><Building2 size={14} className="inline mr-1 text-blue-500" /> Select Bank</h3>
 <div className="relative">
 <button
 className="w-full p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
 onClick={() => setBankDropdownOpen(!bankDropdownOpen)}>
 <span className={selectedBank ? 'text-foreground' : 'text-muted-foreground'}>{selectedBank || 'Choose your bank'}</span>
 {bankDropdownOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
 </button>
 {bankDropdownOpen && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden animate-fadeUp">
 {BANK_ACCOUNTS.map(b => (
 <button key={b.name}
 className={cn('w-full px-3 py-2.5 text-xs text-left hover:bg-muted transition-colors flex items-center gap-2', selectedBank === b.name ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700' : 'text-foreground')}
 onClick={() => { setSelectedBank(b.name); setBankDropdownOpen(false); }}>
 {selectedBank === b.name && <Check size={12} className="text-emerald-600" />}
 <span>{b.name}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 {selectedBank && (() => {
 const bank = BANK_ACCOUNTS.find(b => b.name === selectedBank);
 if (!bank) return null;
 return (
 <div className="mt-3 animate-fadeUp space-y-2">
 <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
 <div className="text-[9px] text-muted-foreground font-medium">Account Holder</div>
 <div className="text-sm font-bold text-foreground">{bank.holder}</div>
 </div>
 <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30">
 <div className="flex-1"><div className="text-[9px] text-muted-foreground font-medium">Account Number</div><div className="text-sm font-bold font-mono text-foreground">{bank.account}</div></div>
 <button className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm" onClick={() => { navigator.clipboard.writeText(bank.account); toast('Copied!', 'success'); }}><Copy size={16} className="text-blue-600" /></button>
 </div>
 </div>
 );
 })()}
 </div>

 {/* Depositor Details */}
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
 <div className="space-y-2.5">
 <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Depositor Full Name *</label>
 <input className="w-full mt-1 p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Your name on the bank transfer" value={depositorName} onChange={e => setDepositorName(e.target.value)} />
 </div>
 <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Amount Paid (Br)</label>
 <input type="number" className="w-full mt-1 p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder={String(grandTotal)} value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
 <p className="text-[8px] text-muted-foreground mt-0.5">Expected: {formatPrice(grandTotal)}</p>
 </div>
 <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Note (optional)</label>
 <textarea className="w-full mt-1 p-2.5 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none h-16" placeholder="Extra info for admin..." value={customerNote} onChange={e => setCustomerNote(e.target.value)} />
 </div>
 </div>
 </div>

 {/* Receipt Upload */}
 <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-4">
 <h3 className="text-xs font-bold text-foreground mb-3"><Upload size={14} className="inline mr-1 text-amber-500" /> Upload Receipt</h3>
 <div className="flex gap-2 mb-3">
 <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all', !useTextReceipt ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700' : 'border-border text-muted-foreground')} onClick={() => setUseTextReceipt(false)}><Camera size={12} className="inline mr-1" /> Photo</button>
 <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all', useTextReceipt ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700' : 'border-border text-muted-foreground')} onClick={() => setUseTextReceipt(true)}><Copy size={12} className="inline mr-1" /> Paste Receipt</button>
 </div>
 {!useTextReceipt ? (
 <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
 {receiptImage ? (
 <div className="relative inline-block"><img src={receiptImage} className="max-h-40 rounded-lg object-contain" alt="" /><button className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs shadow-lg flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setReceiptImage(''); }}><X size={12} /></button></div>
 ) : (
 <div><div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-2"><Camera size={28} className="text-indigo-400" /></div><p className="text-xs font-semibold text-muted-foreground">Upload receipt photo</p><p className="text-[9px] text-muted-foreground mt-1">PNG, JPG</p></div>
 )}
 <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setReceiptImage(ev.target?.result as string); r.readAsDataURL(f); }}} />
 </div>
 ) : (
 <div><textarea className="w-full p-3 border border-border rounded-xl text-xs bg-transparent text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Paste your SMS receipt or transaction reference..." value={receiptText} onChange={e => setReceiptText(e.target.value)} /></div>
 )}
 <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl"><Copy size={12} className="text-amber-500 flex-shrink-0" /><p className="text-[9px] text-amber-700 dark:text-amber-400"><strong>Tip:</strong> Pasting your transaction reference helps admin verify faster!</p></div>
 </div>

 <button className={cn('w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all', selectedBank ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl hover:scale-[1.01]' : 'bg-muted text-muted-foreground cursor-not-allowed')} onClick={placeOrder} disabled={!selectedBank || loading}>
 {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span> : `Submit Payment &mdash; ${formatPrice(grandTotal)}`}
 </button>
 </div>
 </div>
 );
 }

 return <div className="min-h-screen flex items-center justify-center"><p className="text-xs text-muted-foreground">Loading...</p></div>;
}
