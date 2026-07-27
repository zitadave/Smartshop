import { useState, useEffect } from 'react';
import { Search, Users, Tag, Clock, CheckCircle, XCircle, Eye, Trash2, RefreshCw, ChevronRight, Share2 } from 'lucide-react';

interface GroupDeal {
  id: number; product_name: string; regular_price: number; group_price: number;
  current_members: number; max_members: number; min_members: number;
  status: string; creator_name: string; share_token: string;
  created_at: string; expires_at: string;
}

export default function AdminGroupBuyTab() {
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setLoading(true);
    fetch('/api/group-deals').then(r => r.json()).then(d => {
      setDeals(d.deals || []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = deals.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !d.product_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-600', active: 'bg-green-100 text-green-600', fulfilled: 'bg-slate-100 text-slate-600', expired: 'bg-red-100 text-red-600' };
  const statusLabels: Record<string, string> = { open: '🔵 Open', active: '🟢 Active', fulfilled: '✅ Fulfilled', expired: '🔴 Expired' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-800">🤝 Group Buying (ማህበር ግዢ)</h2><p className="text-xs text-slate-400">Manage all group deal campaigns</p></div>
        <button onClick={load} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none bg-white">
          <option value="all">All Status</option><option value="open">Open</option><option value="active">Active</option><option value="fulfilled">Fulfilled</option><option value="expired">Expired</option>
        </select>
      </div>

      {loading ? <div className="text-center py-8 text-slate-400">Loading...</div> : filtered.length === 0 ? (
        <div className="text-center py-8"><p className="text-slate-400">No group deals found</p><p className="text-xs text-slate-300 mt-1">Create deals from product pages</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deal => {
            const progress = Math.round((deal.current_members / deal.max_members) * 100);
            const savings = deal.regular_price - deal.group_price;
            return (
              <div key={deal.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{deal.product_name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[deal.status] || 'bg-slate-100'}`}>{statusLabels[deal.status] || deal.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>By {deal.creator_name || 'Anonymous'}</span>
                      <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">Br {(deal.group_price || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 line-through">Br {(deal.regular_price || 0).toLocaleString()}</div>
                    {savings > 0 && <div className="text-[10px] text-green-500 font-medium">-{Math.round((savings/(deal.regular_price || 1))*100)}%</div>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span><Users size={12} className="inline" /> {deal.current_members}/{deal.max_members}</span><span>{progress}% filled</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: `${progress}%` }} /></div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400"><Clock size={10} className="inline" /> Expires {new Date(deal.expires_at).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    <button onClick={() => navigator.clipboard.writeText(`https://t.me/smart_shopping_et_bot?start=group_${deal.share_token}`)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"><Share2 size={14} /></button>
                    <button onClick={() => { if (confirm('Delete this group deal?')) fetch(`/api/group-deals/${deal.id}`, { method: 'DELETE' }).then(load); }} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
