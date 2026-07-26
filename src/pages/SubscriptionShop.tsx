import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlans, createSubscription, getUserSubscriptions, formatFrequency, getDiscountPercent, getPlanPrice, type SubscriptionPlan, type Subscription, type SubscriptionFrequency } from '@/lib/subscriptions';
import { ArrowLeft, ShoppingCart, Check, Plus, Minus, Calendar, MapPin, Clock, CreditCard, ChevronRight, Bell, Package, TrendingDown } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function SubscriptionShop() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [tgId, setTgId] = useState(0);
  const [mySubs, setMySubs] = useState<Subscription[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ss_profile');
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.telegramId) setTgId(p.telegramId);
      } catch {}
    }
    fetchPlans().then(d => { setPlans(d); setLoading(false); });
    if (tgId) getUserSubscriptions(tgId).then(setMySubs);
  }, [tgId]);

  const filteredPlans = category === 'all' ? plans : plans.filter(p => p.category === category);
  const grouped = plans.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, SubscriptionPlan[]>);

  const handleSubscribe = async () => {
    if (!selectedPlan || !address.trim()) return toast('📍 Please enter delivery address', 'error');
    if (!tgId) return toast('Please log in first', 'error');
    setSubscribing(true);
    try {
      await createSubscription({
        telegramId: tgId,
        planId: selectedPlan.id,
        frequency,
        quantity,
        deliveryAddress: address,
      });
      toast('✅ Subscribed! First delivery coming soon!', 'success');
      setSelectedPlan(null);
      setAddress('');
      setQuantity(1);
      setMySubs(await getUserSubscriptions(tgId));
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setSubscribing(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading plans...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">📦 Subscriptions</h1>
            <p className="text-sm text-slate-500">Daily, weekly & monthly deliveries</p>
          </div>
          {mySubs.length > 0 && (
            <button onClick={() => navigate('/subscriptions')}
              className="text-xs bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-medium">
              My Subs ({mySubs.length})
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          <button onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm'}`}>
            🎯 All
          </button>
          {Object.keys(grouped).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === cat ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm'}`}>
              {cat === 'dairy' ? '🥛' : cat === 'bakery' ? '🍞' : cat === 'drinks' ? '💧' : '📦'} {cat}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-3">
          {filteredPlans.map(plan => {
            const isSubscribed = mySubs.some(s => s.planId === plan.id && s.status === 'active');
            return (
              <div key={plan.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${isSubscribed ? 'border-green-300' : 'border-transparent'}`}
                onClick={() => { setSelectedPlan(plan); setQuantity(plan.minQuantity); }}>
                <div className="flex gap-4 items-start">
                  <div className="text-4xl w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                    {plan.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">{plan.name} <span className="text-xs text-slate-400 font-normal">{plan.nameAmharic}</span></h3>
                        <p className="text-xs text-slate-400">{plan.description}</p>
                      </div>
                      {isSubscribed && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">✅ Active</span>}
                    </div>
                    <div className="flex gap-3 mt-2">
                      {plan.dailyPrice > 0 && <PriceChip label="Daily" price={plan.dailyPrice} unit={plan.unitLabel} />}
                      {plan.weeklyPrice > 0 && <PriceChip label="Weekly" price={plan.weeklyPrice} unit={plan.unitLabel} />}
                      {plan.monthlyPrice > 0 && <PriceChip label="Monthly" price={plan.monthlyPrice} unit={plan.unitLabel} />}
                    </div>
                    {plan.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {plan.tags.map((t, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${t === 'popular' ? 'bg-orange-100 text-orange-600' : t === 'essential' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                            {t === 'popular' ? '🔥 Popular' : t === 'essential' ? '⚡ Essential' : t === 'premium' ? '💎 Premium' : t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscribe Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
               onClick={() => setSelectedPlan(null)}>
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPlan.emoji}</span>
                  <div>
                    <h2 className="text-xl font-bold">{selectedPlan.name}</h2>
                    <p className="text-xs text-slate-400">{selectedPlan.description}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPlan(null)} className="text-slate-400 p-2">✕</button>
              </div>

              {/* Frequency Selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['daily', 'weekly', 'monthly'] as SubscriptionFrequency[]).map(f => {
                  const price = getPlanPrice(selectedPlan, f, quantity);
                  const disc = getDiscountPercent(f);
                  const isActive = frequency === f;
                  const disabled = f === 'daily' ? selectedPlan.dailyPrice <= 0 : f === 'weekly' ? selectedPlan.weeklyPrice <= 0 : selectedPlan.monthlyPrice <= 0;
                  return (
                    <button key={f} disabled={disabled}
                      onClick={() => setFrequency(f)}
                      className={`p-3 rounded-xl text-center transition-all ${isActive ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' : disabled ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-700 hover:bg-blue-50'}`}>
                      <div className="text-xs font-bold capitalize">{f === 'daily' ? '🗓 Daily' : f === 'weekly' ? '📅 Weekly' : '📆 Monthly'}</div>
                      {!disabled && <div className="text-lg font-bold mt-1">Br {price.toLocaleString()}</div>}
                      {disc > 0 && <div className="text-[10px] mt-1 font-medium text-green-500">-{disc}% off</div>}
                    </button>
                  );
                })}
              </div>

              {/* Quantity Selector */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Quantity</span>
                  <span className="text-sm text-slate-400">{selectedPlan.unit} × {selectedPlan.unitLabel}</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setQuantity(Math.max(selectedPlan.minQuantity, quantity - 1))}
                    disabled={quantity <= selectedPlan.minQuantity}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center disabled:opacity-30">
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedPlan.maxQuantity, quantity + 1))}
                    disabled={quantity >= selectedPlan.maxQuantity}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center disabled:opacity-30">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Total {formatFrequency(frequency)}:</span>
                  <span className="text-2xl font-bold">Br {getPlanPrice(selectedPlan, frequency, quantity).toLocaleString()}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  ×{quantity} {selectedPlan.unit}{selectedPlan.unitLabel} · Deliveries every {frequency === 'daily' ? 'morning' : frequency === 'weekly' ? 'week' : 'month'}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-slate-700 border p-3 rounded-xl">
                  <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                  <input placeholder="Delivery address (required)" value={address} onChange={e => setAddress(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent" />
                </div>
                <div className="flex items-center gap-2 text-slate-400 border p-3 rounded-xl">
                  <Clock size={16} className="text-slate-400 flex-shrink-0" />
                  <select className="flex-1 text-sm outline-none bg-transparent text-slate-600">
                    <option>07:00 - 09:00 Morning</option>
                    <option>09:00 - 12:00 Late Morning</option>
                    <option>14:00 - 17:00 Afternoon</option>
                    <option>17:00 - 20:00 Evening</option>
                  </select>
                </div>
              </div>

              {/* Subscribe Button */}
              <button onClick={handleSubscribe} disabled={subscribing || !address.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {subscribing ? '⏳ Subscribing...' : `✅ Subscribe Now`}
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">First delivery tomorrow morning. Cancel anytime.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceChip({ label, price, unit }: { label: string; price: number; unit: string }) {
  return (
    <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
      <div className="text-[10px] text-blue-500 font-medium">{label}</div>
      <div className="text-sm font-bold text-slate-800">Br {price.toLocaleString()}</div>
      <div className="text-[9px] text-slate-400">/{unit}</div>
    </div>
  );
}
