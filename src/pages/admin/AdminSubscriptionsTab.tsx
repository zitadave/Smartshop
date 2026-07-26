import { useState, useEffect } from 'react';
import { Search, Plus, Package, Users, Edit3, Calendar, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from '@/components/Toast';

interface Plan {
  id: number; name: string; name_amharic: string; emoji: string;
  description: string; category: string; unit: string; unit_label: string;
  daily_price: number; weekly_price: number; monthly_price: number;
  vendor_name: string; tags: string[]; is_active: boolean;
  min_quantity: number; max_quantity: number;
}
interface Subscriber {
  id: number; telegram_id: number; plan_id: number; product_name: string;
  quantity: number; frequency: string; price: number; next_delivery: string;
  status: string; delivery_address: string; total_delivered: number;
}

const CATEGORIES = [
  { id: 'dairy', label: '🥛 Dairy', labelAm: 'ወተት' },
  { id: 'bakery', label: '🍞 Bakery', labelAm: 'ዳቦ' },
  { id: 'drinks', label: '💧 Drinks', labelAm: 'መጠጥ' },
  { id: 'groceries', label: '🛒 Groceries', labelAm: 'ግሮሰሪ' },
  { id: 'general', label: '📦 Other', labelAm: 'ሌላ' },
];

const EMPTY_FORM = { name: '', name_amharic: '', emoji: '📦', description: '', category: 'general', unit: '1', unit_label: 'pc', daily_price: 0, weekly_price: 0, monthly_price: 0, min_quantity: 1, max_quantity: 10, tags: [] as string[] };

export default function AdminSubscriptionsTab() {
  const [tab, setTab] = useState<'plans' | 'subscribers'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch('/api/subscription-plans?active=true'),
        fetch('/api/subscriptions?telegram_id=0'),
      ]);
      const plansData = await plansRes.json();
      const subsData = await subsRes.json();
      setPlans(plansData.plans || []);
      setSubs(subsData.subscriptions || []);
    } catch (e) {
      console.error('Failed to load subscription data', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Plan name is required', 'error'); return; }
    setSaving(true);
    try {
      const url = editPlan ? `/api/subscription-plans/${editPlan.id}` : '/api/subscription-plans';
      const method = editPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          name_amharic: form.name_amharic,
          emoji: form.emoji,
          description: form.description,
          category: form.category,
          unit: form.unit,
          unit_label: form.unit_label,
          daily_price: Number(form.daily_price),
          weekly_price: Number(form.weekly_price),
          monthly_price: Number(form.monthly_price),
          min_quantity: Number(form.min_quantity),
          max_quantity: Number(form.max_quantity),
          tags: form.tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast(editPlan ? '✅ Plan updated!' : '✅ Plan created!', 'success');
      setShowForm(false);
      setEditPlan(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  const toggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      name: plan.name || '',
      name_amharic: plan.name_amharic || '',
      emoji: plan.emoji || '📦',
      description: plan.description || '',
      category: plan.category || 'general',
      unit: plan.unit || '1',
      unit_label: plan.unit_label || 'pc',
      daily_price: plan.daily_price || 0,
      weekly_price: plan.weekly_price || 0,
      monthly_price: plan.monthly_price || 0,
      min_quantity: plan.min_quantity || 1,
      max_quantity: plan.max_quantity || 10,
      tags: plan.tags || [],
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditPlan(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const filteredPlans = plans.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_amharic?.includes(search)
  );

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-600',
    paused: 'bg-yellow-100 text-yellow-600',
    cancelled: 'bg-slate-100 text-slate-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">📦 Subscriptions</h2>
          <p className="text-xs text-slate-400">Manage plans & subscribers</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-blue-600 transition-colors">
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setTab('plans')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
            tab === 'plans' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}>
          <Package size={14} /> Plans ({plans.length})
        </button>
        <button onClick={() => setTab('subscribers')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
            tab === 'subscribers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}>
          <Users size={14} /> Subscribers ({subs.length})
        </button>
        <button onClick={load} className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/50 transition-colors">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder={tab === 'plans' ? 'Search plans...' : 'Search subscribers...'}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* ─── PLANS TAB ─── */}
      {tab === 'plans' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">No plans yet</p>
              <p className="text-xs text-slate-300 mt-1">Create your first subscription plan</p>
              <button onClick={openCreate} className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
                + Create Plan
              </button>
            </div>
          ) : filteredPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-3xl w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex-shrink-0">
                  {plan.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm">
                        {plan.name}
                        {plan.name_amharic && <span className="text-xs text-slate-400 font-normal ml-1">({plan.name_amharic})</span>}
                      </h3>
                      {plan.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{plan.description}</p>}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={plan.is_active} onChange={() => toggleActive(plan)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-checked:bg-green-500 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {plan.daily_price > 0 && <PriceChip label="Daily" price={plan.daily_price} />}
                    {plan.weekly_price > 0 && <PriceChip label="Weekly" price={plan.weekly_price} />}
                    {plan.monthly_price > 0 && <PriceChip label="Monthly" price={plan.monthly_price} />}
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 text-slate-500">{plan.unit}{plan.unit_label}</span>
                  </div>

                  {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {plan.tags.map((t: string, i: number) => (
                        <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full ${
                          t === 'popular' ? 'bg-orange-100 text-orange-600' :
                          t === 'essential' ? 'bg-green-100 text-green-600' :
                          t === 'premium' ? 'bg-purple-100 text-purple-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-100">
                <button onClick={() => openEdit(plan)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── SUBSCRIBERS TAB ─── */}
      {tab === 'subscribers' && (
        <div className="space-y-2">
          {subs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No active subscribers yet</div>
          ) : subs.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{sub.product_name}</h3>
                  <p className="text-xs text-slate-400">User #{sub.telegram_id} · {sub.frequency} · x{sub.quantity}</p>
                  {sub.delivery_address && <p className="text-xs text-slate-400 mt-1">📍 {sub.delivery_address}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyles[sub.status] || 'bg-slate-100'}`}>
                    {sub.status}
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-1">Br {sub.price?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                <span><Calendar size={10} className="inline mr-0.5" /> Next: {sub.next_delivery ? new Date(sub.next_delivery).toLocaleDateString() : '—'}</span>
                <span><CheckCircle size={10} className="inline mr-0.5" /> Delivered: {sub.total_delivered || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE/EDIT MODAL ─── */}
      {showForm && (
        <>
          {/* Dark backdrop */}
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setShowForm(false)} />
          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-bold text-slate-800">
                  {editPlan ? '✏️ Edit Plan' : '✨ New Subscription Plan'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Name (English) *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g. Fresh Cow Milk" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Emoji</label>
                    <input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none text-center text-xl" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Name (Amharic)</label>
                  <input value={form.name_amharic} onChange={e => setForm({ ...form, name_amharic: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="ለምሳሌ የከብት ወተት" />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none bg-white">
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Unit</label>
                    <div className="flex gap-2">
                      <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                        className="w-16 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none text-center" />
                      <input value={form.unit_label} onChange={e => setForm({ ...form, unit_label: e.target.value })}
                        className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-3">💰 Pricing (Birr)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-blue-500 font-medium mb-1 block">Daily</label>
                      <input type="number" min="0" value={form.daily_price}
                        onChange={e => setForm({ ...form, daily_price: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 text-sm border border-blue-200 rounded-xl outline-none bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-blue-500 font-medium mb-1 block">Weekly</label>
                      <input type="number" min="0" value={form.weekly_price}
                        onChange={e => setForm({ ...form, weekly_price: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 text-sm border border-blue-200 rounded-xl outline-none bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-blue-500 font-medium mb-1 block">Monthly</label>
                      <input type="number" min="0" value={form.monthly_price}
                        onChange={e => setForm({ ...form, monthly_price: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-2 text-sm border border-blue-200 rounded-xl outline-none bg-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Min Quantity</label>
                    <input type="number" min="1" value={form.min_quantity}
                      onChange={e => setForm({ ...form, min_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Max Quantity</label>
                    <input type="number" min="1" value={form.max_quantity}
                      onChange={e => setForm({ ...form, max_quantity: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['popular', 'essential', 'premium'].map(tag => (
                      <button key={tag} type="button"
                        onClick={() => setForm({
                          ...form,
                          tags: form.tags.includes(tag)
                            ? form.tags.filter(t => t !== tag)
                            : [...form.tags, tag]
                        })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          form.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-300'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {tag === 'popular' ? '🔥' : tag === 'essential' ? '⚡' : '💎'} {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving || !form.name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? '⏳ Saving...' : editPlan ? '💾 Update Plan' : '✨ Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PriceChip({ label, price }: { label: string; price: number }) {
  return (
    <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium whitespace-nowrap">
      {label}: Br {price.toLocaleString()}
    </span>
  );
}
