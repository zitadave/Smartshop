import { useState, useEffect } from 'react';
import { getUserSubscriptions, createSubscription, updateSubscription, formatFrequency, SUBSCRIPTION_TEMPLATES, type Subscription, type SubscriptionFrequency } from '@/lib/subscriptions';
import { Calendar, Plus, Pause, Play, X, Package } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ quantity: 1, frequency: 'daily' as SubscriptionFrequency, deliveryAddress: '' });

  useEffect(() => {
    getUserSubscriptions(0).then(setSubs);
  }, []);

  const handleCreate = async () => {
    if (!formData.deliveryAddress) return alert('Delivery address required');
    await createSubscription({
      telegramId: 0, productId: 0, quantity: formData.quantity,
      frequency: formData.frequency, deliveryAddress: formData.deliveryAddress,
    });
    setShowCreate(false);
    setSubs(await getUserSubscriptions(0));
  };

  const handleToggle = async (sub: Subscription) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    await updateSubscription(sub.id, { status: newStatus });
    setSubs(await getUserSubscriptions(0));
  };

  const handleCancel = async (id: number) => {
    await updateSubscription(id, { status: 'cancelled' });
    setSubs(await getUserSubscriptions(0));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">📦 Subscriptions</h1>
            <p className="text-sm text-slate-500">Daily, weekly & monthly deliveries</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-blue-500 text-white p-3 rounded-xl">
            <Plus size={20} />
          </button>
        </div>

        {SUBSCRIPTION_TEMPLATES.slice(0, 4).map((t, i) => (
          <div key={i} className="bg-white rounded-xl p-4 mb-2 shadow-sm flex items-center gap-3">
            <span className="text-2xl">{t.emoji}</span>
            <div className="flex-1">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-slate-400">{t.unit} · {formatFrequency(t.freq)}</p>
            </div>
            <span className="text-green-500 text-sm font-medium">-{t.freq === 'daily' ? 15 : t.freq === 'weekly' ? 10 : 5}%</span>
          </div>
        ))}

        <h2 className="font-semibold text-slate-700 mt-6 mb-3">Your Subscriptions</h2>
        {subs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Package size={40} className="mx-auto mb-2 opacity-50" />
            <p>No subscriptions yet</p>
          </div>
        ) : subs.map(sub => (
          <div key={sub.id} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{sub.productName || 'Product'}</p>
                <p className="text-sm text-slate-400">{formatFrequency(sub.frequency)} · x{sub.quantity}</p>
                <p className="text-xs text-slate-400">Next: {new Date(sub.nextDelivery).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(sub)} className={`p-2 rounded-lg ${sub.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {sub.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => handleCancel(sub.id)} className="p-2 rounded-lg bg-red-100 text-red-500">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${sub.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              {sub.status === 'active' ? '🟢 Active' : sub.status === 'paused' ? '🟡 Paused' : '⚫ Cancelled'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
