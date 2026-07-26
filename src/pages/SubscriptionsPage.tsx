import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSubscriptions, updateSubscription, cancelSubscription, getDeliveryHistory, formatFrequency, formatNextDelivery, type Subscription, type SubscriptionDelivery } from '@/lib/subscriptions';
import { ArrowLeft, Package, Pause, Play, X, Clock, MapPin, Calendar, ChevronRight, Bell, ShoppingBag, TrendingDown, History } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [tgId, setTgId] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deliveries, setDeliveries] = useState<Record<number, SubscriptionDelivery[]>>({});

  useEffect(() => {
    const stored = localStorage.getItem('ss_profile');
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.telegramId) {
          setTgId(p.telegramId);
          loadSubs(p.telegramId);
          return;
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const loadSubs = async (id: number) => {
    setSubs(await getUserSubscriptions(id));
    setLoading(false);
  };

  const handleToggle = async (sub: Subscription) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    await updateSubscription(sub.id, { status: newStatus } as any);
    toast(newStatus === 'active' ? '▶️ Subscription resumed!' : '⏸️ Subscription paused', 'success');
    loadSubs(tgId);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    await cancelSubscription(id);
    toast('❌ Subscription cancelled', 'success');
    loadSubs(tgId);
  };

  const toggleDetails = async (subId: number) => {
    if (expandedId === subId) { setExpandedId(null); return; }
    setExpandedId(subId);
    if (!deliveries[subId]) {
      const history = await getDeliveryHistory(subId);
      setDeliveries(prev => ({ ...prev, [subId]: history }));
    }
  };

  if (!tgId) return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 text-center">
      <Package size={48} className="mx-auto text-slate-300 mb-3" />
      <p className="text-slate-500">Please log in via Telegram to see your subscriptions</p>
    </div>
  );

  const activeSubs = subs.filter(s => s.status === 'active');
  const pausedSubs = subs.filter(s => s.status === 'paused');
  const cancelledSubs = subs.filter(s => s.status === 'cancelled');
  const totalMonthly = activeSubs.reduce((s, sub) => sub.frequency === 'monthly' ? s + sub.price : s, 0);
  const totalDaily = activeSubs.filter(s => s.frequency === 'daily').reduce((s, sub) => s + sub.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-600"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">📦 My Subscriptions</h1>
              <p className="text-xs text-slate-400">Manage your regular deliveries</p>
            </div>
          </div>
          <button onClick={() => navigate('/subscription-shop')}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-1">
            <ShoppingBag size={16} /> + New
          </button>
        </div>

        {/* Stats Card */}
        {activeSubs.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white mb-4 shadow-lg">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold">{activeSubs.length}</div>
                <div className="text-[10px] opacity-80">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalDaily.toLocaleString()}</div>
                <div className="text-[10px] opacity-80">Daily Br</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMonthly.toLocaleString()}</div>
                <div className="text-[10px] opacity-80">Monthly Br</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : subs.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium mb-1">No subscriptions yet</p>
            <p className="text-sm text-slate-400 mb-4">Subscribe to daily essentials and save!</p>
            <button onClick={() => navigate('/subscription-shop')}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg">
              🛍️ Browse Plans
            </button>
          </div>
        ) : (
          <>
            {/* Active Subscriptions */}
            {activeSubs.length > 0 && <SectionHeader title="🟢 Active" count={activeSubs.length} />}
            {activeSubs.map(sub => <SubCard key={sub.id} sub={sub} onToggle={handleToggle} onCancel={handleCancel} onExpand={toggleDetails} expanded={expandedId === sub.id} deliveries={deliveries[sub.id]} />)}

            {/* Paused Subscriptions */}
            {pausedSubs.length > 0 && <SectionHeader title="🟡 Paused" count={pausedSubs.length} />}
            {pausedSubs.map(sub => <SubCard key={sub.id} sub={sub} onToggle={handleToggle} onCancel={handleCancel} onExpand={toggleDetails} expanded={expandedId === sub.id} deliveries={deliveries[sub.id]} />)}

            {/* Cancelled */}
            {cancelledSubs.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-slate-400 cursor-pointer py-2">Show cancelled ({cancelledSubs.length})</summary>
                <div className="mt-2 space-y-2">
                  {cancelledSubs.map(sub => <SubCard key={sub.id} sub={sub} onToggle={handleToggle} onCancel={handleCancel} cancelled />)}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return <h2 className="font-semibold text-slate-700 mt-4 mb-2 text-sm">{title} ({count})</h2>;
}

function SubCard({ sub, onToggle, onCancel, onExpand, expanded, deliveries, cancelled }: {
  sub: Subscription;
  onToggle: (sub: Subscription) => void;
  onCancel: (id: number) => void;
  onExpand?: (id: number) => void;
  expanded?: boolean;
  deliveries?: SubscriptionDelivery[];
  cancelled?: boolean;
}) {
  const emoji = sub.productImage || '📦';
  const nextLabel = sub.nextDelivery ? formatNextDelivery(sub.nextDelivery) : '—';

  return (
    <div className="bg-white rounded-xl shadow-sm mb-2 overflow-hidden border border-slate-100">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex-shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{sub.productName}</h3>
                <p className="text-xs text-slate-400">{formatFrequency(sub.frequency)} · x{sub.quantity}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">Br {sub.price.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">/ {sub.frequency === 'daily' ? 'day' : sub.frequency === 'weekly' ? 'week' : 'month'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              {sub.status === 'active' && (
                <span className="flex items-center gap-1 text-green-600">
                  <Clock size={12} /> {nextLabel}
                </span>
              )}
              {sub.deliveryAddress && (
                <span className="text-slate-400 truncate flex items-center gap-1">
                  <MapPin size={12} /> {sub.deliveryAddress}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                sub.status === 'active' ? 'bg-green-100 text-green-600' :
                sub.status === 'paused' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {sub.status === 'active' ? '🟢 Active' : sub.status === 'paused' ? '🟡 Paused' : '⚫ Cancelled'}
              </span>
              {sub.totalDelivered > 0 && <span className="text-[10px] text-slate-400">{sub.totalDelivered} delivered</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!cancelled && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button onClick={() => onToggle(sub)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                sub.status === 'active' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
              }`}>
              {sub.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
              {sub.status === 'active' ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => onExpand?.(sub.id)}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 flex items-center justify-center gap-1">
              <History size={14} /> History
            </button>
            <button onClick={() => onCancel(sub.id)}
              className="py-2 px-3 rounded-lg text-xs font-medium bg-red-50 text-red-500 flex items-center justify-center gap-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Delivery History */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">📋 Delivery History</p>
            {!deliveries ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-xs text-slate-400">No deliveries yet. First one coming soon!</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {deliveries.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50">
                    <span>{d.deliveryDate}</span>
                    <span className="text-slate-400">x{d.quantity}</span>
                    <span className={`font-medium ${
                      d.status === 'delivered' ? 'text-green-600' : d.status === 'out_for_delivery' ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {d.status === 'delivered' ? '✅ Delivered' : d.status === 'out_for_delivery' ? '🚚 On way' : d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
