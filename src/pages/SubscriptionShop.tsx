import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    fetchPlans('all', true).then(d => { setPlans(d); setLoading(false); });
    if (tgId) getUserSubscriptions(tgId).then(setMySubs);
  }, [tgId]);

  // Handle ?plan=ID from URL (homepage links)
  const [searchParams] = useSearchParams();
  const planIdParam = searchParams.get('plan');
  useEffect(() => {
    if (planIdParam && plans.length > 0) {
      const plan = plans.find(p => p.id === parseInt(planIdParam));
      if (plan) {
        setSelectedPlan(plan);
        setQuantity(plan.minQuantity);
      }
    }
  }, [planIdParam, plans]);

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

  if (loading) return <div className="p-8 text-center text-muted-foreground bg-background min-h-screen flex items-center justify-center">Loading plans...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors font-semibold text-sm">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground">📦 Subscriptions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Daily, weekly & monthly deliveries</p>
          </div>
          {mySubs.length > 0 && (
            <button onClick={() => navigate('/subscriptions')}
              className="text-xs bg-primary/10 text-primary px-3 py-2 rounded-xl font-bold border border-primary/20 shadow-sm hover:bg-primary/20 transition-all">
              My Subs ({mySubs.length})
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          <button onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${category === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-card text-muted-foreground border border-border/60 hover:text-foreground'}`}>
            🎯 All
          </button>
          {Object.keys(grouped).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${category === cat ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-card text-muted-foreground border border-border/60 hover:text-foreground'}`}>
              {cat === 'dairy' ? '🥛' : cat === 'bakery' ? '🍞' : cat === 'drinks' ? '💧' : '📦'} {cat}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPlans.map(plan => {
            const isSubscribed = mySubs.some(s => s.planId === plan.id && s.status === 'active');
            return (
              <div key={plan.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 active:scale-[0.99] relative flex flex-col gap-4 ${
                  isSubscribed 
                    ? 'border-emerald-500 dark:border-emerald-500 shadow-md shadow-emerald-500/5 bg-emerald-50/5 dark:bg-emerald-950/5' 
                    : 'border-slate-200/80 dark:border-slate-800/80 shadow-sm'
                }`}
                onClick={() => { setSelectedPlan(plan); setQuantity(plan.minQuantity); }}>
                
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-850 flex items-center justify-center shadow-inner">
                    {plan.image ? (
                      <img src={plan.image} className="w-full h-full object-cover" alt={plan.name} />
                    ) : (
                      <span className="text-4xl">{plan.emoji}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">{plan.category}</span>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-1.5 flex items-baseline gap-1.5 truncate">
                          {plan.name}
                          {plan.nameAmharic && <span className="text-xs text-slate-400 font-normal truncate">({plan.nameAmharic})</span>}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">{plan.description}</p>
                      </div>
                      
                      {isSubscribed && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold flex-shrink-0 border border-emerald-200/50">
                          🟢 Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100/80 dark:border-slate-800/60 pt-3 flex flex-wrap gap-2.5 items-center justify-between">
                  <div className="flex gap-2.5 flex-wrap">
                    {plan.dailyPrice > 0 && <PriceChip label="Daily" price={plan.dailyPrice} unit={plan.unitLabel} />}
                    {plan.weeklyPrice > 0 && <PriceChip label="Weekly" price={plan.weeklyPrice} unit={plan.unitLabel} />}
                    {plan.biweeklyPrice !== undefined && plan.biweeklyPrice > 0 && <PriceChip label="Bi-weekly" price={plan.biweeklyPrice} unit={plan.unitLabel} />}
                    {plan.monthlyPrice > 0 && <PriceChip label="Monthly" price={plan.monthlyPrice} unit={plan.unitLabel} />}
                  </div>

                  {plan.tags.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0">
                      {plan.tags.map((t, i) => (
                        <span key={i} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          t === 'popular' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/50' :
                          t === 'essential' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50' :
                          'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/50'
                        }`}>
                          {t === 'popular' ? '🔥 Popular' : t === 'essential' ? '⚡ Essential' : t}
                        </span>
                      ))}
                    </div>
                  )}
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
              
              {/* Cover Banner if available */}
              {selectedPlan.image && (
                <div className="mb-4 aspect-[1.8] rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
                  <img src={selectedPlan.image} className="w-full h-full object-cover" alt="Plan Cover" />
                </div>
              )}

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
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['daily', 'weekly', 'biweekly', 'monthly'] as SubscriptionFrequency[]).map(f => {
                  const price = getPlanPrice(selectedPlan, f, quantity);
                  const disc = getDiscountPercent(f);
                  const isActive = frequency === f;
                  const disabled = f === 'daily' ? selectedPlan.dailyPrice <= 0 : f === 'weekly' ? selectedPlan.weeklyPrice <= 0 : f === 'biweekly' ? (selectedPlan.biweeklyPrice || 0) <= 0 : selectedPlan.monthlyPrice <= 0;
                  return (
                    <button key={f} disabled={disabled}
                      onClick={() => setFrequency(f)}
                      className={`p-3 rounded-xl text-center transition-all border ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/10' : disabled ? 'bg-muted/40 text-muted-foreground/30 border-transparent' : 'bg-card text-foreground border-border/60 hover:bg-muted/30'}`}>
                      <div className="text-xs font-bold capitalize">{f === 'daily' ? '🗓 Daily' : f === 'weekly' ? '📅 Weekly' : f === 'biweekly' ? '📅 Bi-weekly' : '📆 Monthly'}</div>
                      {!disabled && <div className="text-sm font-black mt-1">Br {price.toLocaleString()}</div>}
                      {disc > 0 && <div className="text-[9px] mt-1 font-bold text-emerald-500 dark:text-emerald-400">-{disc}% off</div>}
                    </button>
                  );
                })}
              </div>

              {/* Quantity Selector */}
              <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">Quantity</span>
                  <span className="text-xs text-muted-foreground">{selectedPlan.unit} × {selectedPlan.unitLabel}</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setQuantity(Math.max(selectedPlan.minQuantity, quantity - 1))}
                    disabled={quantity <= selectedPlan.minQuantity}
                    className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted/50 active:scale-95 transition-all text-foreground shadow-sm">
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-black w-12 text-center text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedPlan.maxQuantity, quantity + 1))}
                    disabled={quantity >= selectedPlan.maxQuantity}
                    className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted/50 active:scale-95 transition-all text-foreground shadow-sm">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gradient-to-br from-primary to-primary/95 text-primary-foreground rounded-2xl p-4 mb-4 shadow-lg shadow-primary/15 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-90 font-bold uppercase tracking-wider">Total {formatFrequency(frequency)}:</span>
                  <span className="text-2xl font-black">Br {getPlanPrice(selectedPlan, frequency, quantity).toLocaleString()}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  ×{quantity} {selectedPlan.unit}{selectedPlan.unitLabel} · Deliveries every {frequency === 'daily' ? 'morning' : frequency === 'weekly' ? 'week' : 'month'}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 bg-card border border-border/80 p-3 rounded-xl">
                  <MapPin size={16} className="text-primary flex-shrink-0" />
                  <input placeholder="Delivery address (required)" value={address} onChange={e => setAddress(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60" />
                </div>
                <div className="flex items-center gap-2 bg-card border border-border/80 p-3 rounded-xl">
                  <Clock size={16} className="text-muted-foreground flex-shrink-0" />
                  <select className="flex-1 text-sm outline-none bg-transparent text-foreground">
                    <option>07:00 - 09:00 Morning</option>
                    <option>09:00 - 12:00 Late Morning</option>
                    <option>14:00 - 17:00 Afternoon</option>
                    <option>17:00 - 20:00 Evening</option>
                  </select>
                </div>
              </div>

              {/* Subscribe Button */}
              <button onClick={handleSubscribe} disabled={subscribing || !address.trim()}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {subscribing ? '⏳ Subscribing...' : `✅ Subscribe Now`}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">First delivery tomorrow morning. Cancel anytime.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceChip({ label, price, unit }: { label: string; price: number; unit: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl px-3 py-1.5 text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-850 flex flex-col justify-center min-w-[75px]">
      <span className="text-[7.5px] uppercase tracking-widest text-slate-400 font-extrabold">{label}</span>
      <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">Br {price.toLocaleString()}</span>
      <span className="text-[8px] text-slate-400">/{unit}</span>
    </div>
  );
}
