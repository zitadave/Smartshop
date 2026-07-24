import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { toast } from '@/components/Toast';
import { CheckCircle, XCircle, Clock, DollarSign, Tag, Zap, Gift, Percent, TrendingUp, AlertTriangle, Plus, Trash2, Edit3, Eye, Search, Filter, ChevronDown, Star, Package, Store } from 'lucide-react';

interface PromotionRequest {
  id: string; vendorId: number; vendorName: string; productId: number; productName: string;
  type: 'discount' | 'flashdeal' | 'bogo'; discountPercent: number; originalPrice: number;
  startDate: string; endDate: string; status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; adminNote?: string; featuredSlot?: boolean; slotFee?: number;
}

interface PriceFloor { category: string; minPricePct: number; }

interface PromotionSlot { id: string; name: string; price: number; duration: string; active: boolean; }

const STORAGE_KEY = 'ss_promotions_data';

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function AdminPromotions() {
  const store = useStore();
  const { products } = store;
  const [tab, setTab] = useState<'requests' | 'floors' | 'slots'>('requests');
  const [data, setData] = useState<any>(() => loadData());
  const [requests, setRequests] = useState<PromotionRequest[]>(data.requests || []);
  const [priceFloors, setPriceFloors] = useState<PriceFloor[]>(data.priceFloors || [
    { category: 'electronics', minPricePct: 60 }, { category: 'fashion', minPricePct: 50 },
    { category: 'home', minPricePct: 50 }, { category: 'beauty', minPricePct: 55 },
    { category: 'groceries', minPricePct: 40 }, { category: 'books', minPricePct: 45 },
  ]);
  const [slots, setSlots] = useState<PromotionSlot[]>(data.slots || [
    { id: 'slot-1', name: 'Weekend Flash', price: 500, duration: '48 hours', active: true },
    { id: 'slot-2', name: 'Homepage Featured', price: 1200, duration: '7 days', active: true },
    { id: 'slot-3', name: 'Category Banner', price: 800, duration: '3 days', active: true },
  ]);

  const persist = (r: PromotionRequest[], f: PriceFloor[], s: PromotionSlot[]) => {
    saveData({ requests: r, priceFloors: f, slots: s });
  };

  const handleApprove = (reqId: string) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'approved' as const } : r);
    setRequests(updated); persist(updated, priceFloors, slots);
    const req = requests.find(r => r.id === reqId);
    toast('✅ Promotion approved! Commission on original price: ' + formatPrice(req?.originalPrice || 0), 'success');
  };

  const handleReject = (reqId: string) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'rejected' as const } : r);
    setRequests(updated); persist(updated, priceFloors, slots);
    toast('❌ Promotion rejected', 'info');
  };

  const addFloor = () => {
    const cat = prompt('Category name:');
    const pct = prompt('Min price % (e.g. 50 = 50%):');
    if (cat && pct) {
      const updated = [...priceFloors, { category: cat.toLowerCase(), minPricePct: Number(pct) }];
      setPriceFloors(updated); persist(requests, updated, slots);
      toast('✅ Price floor added!', 'success');
    }
  };

  const removeFloor = (idx: number) => {
    const updated = priceFloors.filter((_, i) => i !== idx);
    setPriceFloors(updated); persist(requests, updated, slots);
  };

  const updateFloorPct = (idx: number, val: number) => {
    const updated = [...priceFloors];
    updated[idx] = { ...updated[idx], minPricePct: val };
    setPriceFloors(updated); persist(requests, updated, slots);
  };

  const addSlot = () => {
    const name = prompt('Slot name:');
    const price = prompt('Price (Br):');
    if (name && price) {
      const updated = [...slots, { id: generateId(), name, price: Number(price), duration: '7 days', active: true }];
      setSlots(updated); persist(requests, priceFloors, updated);
      toast('✅ Promotion slot created!', 'success');
    }
  };

  const toggleSlot = (id: string) => {
    const updated = slots.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSlots(updated); persist(requests, priceFloors, updated);
  };

  const deleteSlot = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    setSlots(updated); persist(requests, priceFloors, updated);
    toast('🗑️ Slot removed', 'info');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const activePromos = requests.filter(r => r.status === 'approved' && new Date(r.endDate) > new Date()).length;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">🚀 Promotions Manager</h2>
          <p className="text-[10px] text-slate-500">
            {pendingCount} pending · {activePromos} active promotions
            {requests.filter(r => r.featuredSlot).length} featured slots sold
          </p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          {(['requests', 'floors', 'slots'] as const).map(t => (
            <button key={t} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all', tab === t ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')}
              onClick={() => setTab(t)}>
              {t === 'requests' ? '📋 Requests' : t === 'floors' ? '📏 Price Floors' : '💎 Slots'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requests' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Requests', val: requests.length, color: 'text-indigo-600', icon: Tag },
              { label: 'Pending', val: pendingCount, color: 'text-amber-600', icon: Clock },
              { label: 'Approved', val: requests.filter(r => r.status === 'approved').length, color: 'text-emerald-600', icon: CheckCircle },
              { label: 'Slot Revenue', val: 'Br ' + requests.filter(r => r.featuredSlot).reduce((s, r) => s + (r.slotFee || 0), 0).toLocaleString(), color: 'text-purple-600', icon: DollarSign },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-center">
                  <div className={cn('text-lg font-bold', s.color)}>{s.val}</div>
                  <div className="text-[9px] text-slate-500">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Requests List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold">Vendor Promotion Requests ({requests.length})</h3>
              <span className="text-[9px] text-slate-400">Commission always on original price</span>
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <Tag size={32} className="mx-auto mb-2 text-slate-300" />
                No promotion requests yet. Vendors can submit requests from their dashboard.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...requests].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(req => {
                  const salePrice = Math.round(req.originalPrice * (1 - req.discountPercent / 100));
                  const commission = Math.round(req.originalPrice * 0.1); // 10% of ORIGINAL price
                  return (
                    <div key={req.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold', 
                              req.type === 'discount' ? 'bg-blue-100 text-blue-700' : req.type === 'flashdeal' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700')}>
                              {req.type === 'bogo' ? '🎁 BOGO' : req.type === 'flashdeal' ? '⚡ Flash' : '🏷️ Sale'}
                            </span>
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold',
                              req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                              {req.status}
                            </span>
                            {req.featuredSlot && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">💎 Featured</span>}
                          </div>
                          <h4 className="text-xs font-bold mt-1 text-slate-900 dark:text-white">{req.productName}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-0.5">
                            <Store size={10} /> {req.vendorName}
                            <span>·</span>
                            <span>-{req.discountPercent}% off</span>
                            <span>·</span>
                            <span className="line-through">{formatPrice(req.originalPrice)}</span>
                            <span className="text-emerald-600 font-bold">{formatPrice(salePrice)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[8px] text-slate-400 mt-1">
                            <span>📅 {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}</span>
                            <span>·</span>
                            <span className="text-emerald-600 font-semibold">Your commission: {formatPrice(commission)} (10% of original)</span>
                          </div>
                          {req.adminNote && <p className="text-[8px] text-slate-400 mt-1 italic">Note: {req.adminNote}</p>}
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:shadow-md transition-all" onClick={() => handleApprove(req.id)}>
                              <CheckCircle size={12} className="inline mr-1" /> Approve
                            </button>
                            <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-bold hover:shadow-md transition-all" onClick={() => handleReject(req.id)}>
                              <XCircle size={12} className="inline mr-1" /> Reject
                            </button>
                          </div>
                        )}
                        {req.status === 'approved' && <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />}
                        {req.status === 'rejected' && <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'floors' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">📏 Minimum Price Floors per Category</h3>
            <button className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:shadow-md" onClick={addFloor}><Plus size={11} /> Add Floor</button>
          </div>
          <p className="text-[10px] text-slate-500 mb-4">Vendors cannot discount below this % of original price. Protects your commission.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {priceFloors.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] font-semibold capitalize w-24 text-slate-700 dark:text-slate-300">{f.category}</span>
                <div className="flex-1 flex items-center gap-2">
                  <input type="range" min={10} max={100} value={f.minPricePct}
                    onChange={e => updateFloorPct(i, Number(e.target.value))}
                    className="flex-1 h-1.5 accent-indigo-500" />
                  <span className="text-[9px] font-bold text-indigo-600 w-10 text-right">{f.minPricePct}%</span>
                </div>
                <button className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeFloor(i)}><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'slots' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">💎 Promotion Slots (Vendors Buy These)</h3>
            <button className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:shadow-md" onClick={addSlot}><Plus size={11} /> New Slot</button>
          </div>
          <p className="text-[10px] text-slate-500">Vendors purchase these slots for extra visibility. Pure profit for you.</p>
          {slots.map(slot => (
            <div key={slot.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', slot.active ? 'bg-purple-100' : 'bg-slate-100')}>
                    <DollarSign size={18} className={slot.active ? 'text-purple-600' : 'text-slate-400'} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{slot.name}</h4>
                    <p className="text-[9px] text-slate-400">{slot.duration} · {slot.active ? 'Active' : 'Paused'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-lg font-bold text-emerald-600">Br {slot.price.toLocaleString()}</div>
                  <button className={cn('px-2 py-1 rounded-lg text-[8px] font-semibold', slot.active ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}
                    onClick={() => toggleSlot(slot.id)}>{slot.active ? 'Pause' : 'Activate'}</button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => deleteSlot(slot.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
