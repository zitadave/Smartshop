import { useState, useEffect } from 'react';
import { Search, Plus, Package, Users, Trash2, RefreshCw, Edit3, Calendar, DollarSign, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Plan { id: number; name: string; name_amharic: string; emoji: string; description: string; category: string; unit: string; unit_label: string; daily_price: number; weekly_price: number; monthly_price: number; vendor_name: string; tags: string[]; is_active: boolean; min_quantity: number; max_quantity: number; }
interface Subscription { id: number; telegram_id: number; plan_id: number; product_name: string; quantity: number; frequency: string; price: number; next_delivery: string; status: string; delivery_address: string; total_delivered: number; }

const CATEGORIES = [
  { id: 'dairy', label: '🥛 Dairy', labelAm: 'ወተት' },
  { id: 'bakery', label: '🍞 Bakery', labelAm: 'ዳቦ' },
  { id: 'drinks', label: '💧 Drinks', labelAm: 'መጠጥ' },
  { id: 'groceries', label: '🛒 Groceries', labelAm: 'ግሮሰሪ' },
  { id: 'general', label: '📦 Other', labelAm: 'ሌላ' },
];

export default function AdminSubscriptionsTab() {
  const [tab, setTab] = useState<'plans' | 'subscribers'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', name_amharic: '', emoji: '📦', description: '', category: 'general', unit: '1', unit_label: 'pc', daily_price: 0, weekly_price: 0, monthly_price: 0, min_quantity: 1, max_quantity: 10, tags: [] as string[] });

  const loadPlans = () => { fetch('/api/subscription-plans?active=true').then(r => r.json()).then(d => { setPlans(d.plans || []); setLoading(false); }); };
  const loadSubs = () => { fetch('/api/subscriptions?telegram_id=0').then(r => r.json()).then(d => { setSubs(d.subscriptions || []); }); };
  useEffect(() => { loadPlans(); loadSubs(); }, []);

  const handleSave = async () => {
    const res = await fetch(`/api/subscription-plans${editPlan ? '/' + editPlan.id : ''}`, {
      method: editPlan ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: JSON.stringify(form.tags) }),
    });
    if (res.ok) { setShowForm(false); setEditPlan(null); loadPlans(); }
  };

  const toggleActive = async (plan: Plan) => {
    await fetch(`/api/subscription-plans/${plan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !plan.is_active }) });
    loadPlans();
  };

  const filteredPlans = plans.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.name_amharic.includes(search));

  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-600', paused: 'bg-yellow-100 text-yellow-600', cancelled: 'bg-slate-100 text-slate-400' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-800">📦 Subscriptions</h2><p className="text-xs text-slate-400">Manage plans & subscribers</p></div>
        <button onClick={() => { setShowForm(true); setEditPlan(null); setForm({ name: '', name_amharic: '', emoji: '📦', description: '', category: 'general', unit: '1', unit_label: 'pc', daily_price: 0, weekly_price: 0, monthly_price: 0, min_quantity: 1, max_quantity: 10, tags: [] }); }} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Plus size={16} /> New Plan</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setTab('plans')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'plans' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Package size={14} className="inline mr-1" />Plans ({plans.length})</button>
        <button onClick={() => setTab('subscribers')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'subscribers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Users size={14} className="inline mr-1" />Subscribers ({subs.length})</button>
      </div>

      {/* Search */}
      <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder={tab === 'plans' ? 'Search plans...' : 'Search subscribers...'} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none" /></div>

      {/* Plans Tab */}
      {tab === 'plans' && (
        <div className="space-y-2">
          {loading ? <div className="text-center py-8 text-slate-400">Loading...</div> : filteredPlans.length === 0 ? (
            <div className="text-center py-8"><Package size={40} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400">No plans yet</p><button onClick={() => setShowForm(true)} className="text-blue-500 text-sm mt-1">Create your first plan</button></div>
          ) : filteredPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">{plan.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{plan.name} <span className="text-xs text-slate-400 font-normal">{plan.name_amharic}</span></h3>
                      <p className="text-xs text-slate-400">{plan.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={plan.is_active} onChange={() => toggleActive(plan)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-checked:bg-green-500 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" /></label>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {plan.daily_price > 0 && <PriceBadge label="Daily" price={plan.daily_price} />}
                    {plan.weekly_price > 0 && <PriceBadge label="Weekly" price={plan.weekly_price} />}
                    {plan.monthly_price > 0 && <PriceBadge label="Monthly" price={plan.monthly_price} />}
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 text-slate-500">{plan.unit}{plan.unit_label}</span>
                    {plan.tags?.map((t: string, i: number) => <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${t === 'popular' ? 'bg-orange-100 text-orange-600' : t === 'essential' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>{t}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-100">
                <button onClick={() => { setEditPlan(plan); setForm({ name: plan.name, name_amharic: plan.name_amharic, emoji: plan.emoji, description: plan.description, category: plan.category, unit: plan.unit, unit_label: plan.unit_label, daily_price: plan.daily_price, weekly_price: plan.weekly_price, monthly_price: plan.monthly_price, min_quantity: plan.min_quantity, max_quantity: plan.max_quantity, tags: plan.tags || [] }); setShowForm(true); }} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"><Edit3 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscribers Tab */}
      {tab === 'subscribers' && (
        <div className="space-y-2">
          {subs.length === 0 ? <div className="text-center py-8 text-slate-400">No subscribers yet</div> : subs.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{sub.product_name}</h3>
                  <p className="text-xs text-slate-400">User #{sub.telegram_id} · {sub.frequency} · x{sub.quantity}</p>
                  <p className="text-xs text-slate-400 mt-1">📍 {sub.delivery_address || 'No address'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[sub.status] || 'bg-slate-100'}`}>{sub.status}</span>
                  <p className="text-xs text-slate-400 mt-1">Br {sub.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                <span><Calendar size={10} className="inline" /> Next: {new Date(sub.next_delivery).toLocaleDateString()}</span>
                <span><CheckCircle size={10} className="inline" /> Delivered: {sub.total_delivered || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editPlan ? 'Edit Plan' : 'New Subscription Plan'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">Name (English)</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2.5 text-sm border rounded-xl outline-none" placeholder="e.g. Fresh Cow Milk" /></div>
                <div><label className="text-xs text-slate-500 mb-1 block">Emoji</label><input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="w-full p-2.5 text-sm border rounded-xl outline-none text-center" /></div>
              </div>
              <div><label className="text-xs text-slate-500 mb-1 block">Name (Amharic)</label><input value={form.name_amharic} onChange={e => setForm({ ...form, name_amharic: e.target.value })} className="w-full p-2.5 text-sm border rounded-xl outline-none" placeholder="ለምሳሌ የከብት ወተት" /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2.5 text-sm border rounded-xl outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500 mb-1 block">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-2.5 text-sm border rounded-xl outline-none">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                <div><label className="text-xs text-slate-500 mb-1 block">Unit</label><div className="flex gap-1"><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="flex-1 p-2.5 text-sm border rounded-xl outline-none w-16" /><input value={form.unit_label} onChange={e => setForm({ ...form, unit_label: e.target.value })} className="flex-1 p-2.5 text-sm border rounded-xl outline-none" /></div></div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-medium text-blue-700 mb-2">💰 Pricing</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[10px] text-blue-500 mb-1 block">Daily</label><input type="number" value={form.daily_price} onChange={e => setForm({ ...form, daily_price: parseInt(e.target.value) || 0 })} className="w-full p-2 text-sm border rounded-xl outline-none" /></div>
                  <div><label className="text-[10px] text-blue-500 mb-1 block">Weekly</label><input type="number" value={form.weekly_price} onChange={e => setForm({ ...form, weekly_price: parseInt(e.target.value) || 0 })} className="w-full p-2 text-sm border rounded-xl outline-none" /></div>
                  <div><label className="text-[10px] text-blue-500 mb-1 block">Monthly</label><input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: parseInt(e.target.value) || 0 })} className="w-full p-2 text-sm border rounded-xl outline-none" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500 mb-1 block">Min Qty</label><input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: parseInt(e.target.value) || 1 })} className="w-full p-2.5 text-sm border rounded-xl outline-none" /></div>
                <div><label className="text-xs text-slate-500 mb-1 block">Max Qty</label><input type="number" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: parseInt(e.target.value) || 10 })} className="w-full p-2.5 text-sm border rounded-xl outline-none" /></div>
              </div>
              <div><label className="text-xs text-slate-500 mb-1 block">Tags (comma-separated)</label><input value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="w-full p-2.5 text-sm border rounded-xl outline-none" placeholder="popular, essential, premium" /></div>
              <button onClick={handleSave} className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium">{editPlan ? '💾 Update Plan' : '✨ Create Plan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceBadge({ label, price }: { label: string; price: number }) {
  return <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">{label}: Br {price.toLocaleString()}</span>;
}
