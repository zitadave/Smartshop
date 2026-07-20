import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, generateOrderNumber } from '@/lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const store = useStore();
  const { cart, language, getCartTotal, addOrder, clearCart, addLoyaltyPoints, addNotification, profile, savedPayments, addSavedPayment } = store;
  const total = getCartTotal();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState('');
  const [payment, setPayment] = useState('telebirr');
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (!name || !phone || !city) { alert('Please fill all fields'); return; }
    setLoading(true);

    const order = {
      orderNumber: generateOrderNumber(),
      status: 'confirmed' as const,
      items: cart.map(i => ({ id: i.id, name: i.nameEn, quantity: i.qty, price: i.price, total: i.price * i.qty })),
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

    // Save payment method
    addSavedPayment({ type: payment, icon: payment === 'telebirr' ? '📱' : payment === 'cbebirr' ? '🏦' : '💵', name: payment, number: phone });

    // Try server
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const data = await res.json();
      if (data.success) {
        order.orderNumber = data.order.orderNumber;
        addLoyaltyPoints(Math.floor(data.order.total / 10));
      }
    } catch (e) {
      addLoyaltyPoints(Math.floor(total / 10));
    }

    addOrder(order);
    addNotification('📦', 'Order placed! #' + order.orderNumber);
    clearCart();
    setLoading(false);
    navigate('/confirmation/' + order.orderNumber);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">📋 {t('checkout', language)}</h2>

      {/* Items */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">📦 Items</h3>
        {cart.map(i => (
          <div key={i.id} className="flex justify-between py-1 text-xs">
            <span>{i.nameEn} × {i.qty}</span>
            <span className="font-semibold">{formatPrice(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-2 border-t border-border font-bold text-sm">
          <span>{t('total', language)}</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">📍 Delivery Info</h3>
        <div className="space-y-2">
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <select className="w-full p-2.5 border border-input rounded-lg text-xs bg-card" value={city} onChange={e => setCity(e.target.value)}>
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

      {/* Payment */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">💳 Payment</h3>

        {/* Saved payments */}
        {savedPayments.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] text-muted-foreground mb-1">Saved</div>
            {savedPayments.slice(-3).map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-lg mb-1 cursor-pointer text-xs border border-border" onClick={() => setPayment(p.type)}>
                <span>{p.icon}</span>
                <span>{p.name} - {p.number.slice(-4)}</span>
              </div>
            ))}
          </div>
        )}

        {[
          { id: 'telebirr', icon: '📱', label: 'Telebirr' },
          { id: 'cbebirr', icon: '🏦', label: 'CBE Birr' },
          { id: 'cash', icon: '💵', label: 'Cash on Delivery' },
        ].map(p => (
          <div key={p.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer text-xs border transition-all ${payment === p.id ? 'border-primary bg-primary/5' : 'border-border'}`} onClick={() => setPayment(p.id)}>
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {payment === p.id && <span className="ml-auto text-primary">✓</span>}
          </div>
        ))}
      </div>

      {/* Place Order */}
      <button
        className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl active:scale-98 transition-all disabled:opacity-50"
        onClick={placeOrder}
        disabled={loading}
      >
        {loading ? '⏳ Placing Order...' : `✅ ${t('placeOrder', language)} — ${formatPrice(total)}`}
      </button>
    </div>
  );
}
