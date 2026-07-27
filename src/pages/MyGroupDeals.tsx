import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroupDeals, getActiveDealsForProduct, type GroupDeal } from '@/lib/groupBuying';
import { useStore } from '@/stores/AppStore';
import { ArrowLeft, Users, Tag, Clock, Share2, ChevronRight, Package } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function MyGroupDeals() {
  const navigate = useNavigate();
  const store = useStore();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tgId = store.telegramId;
    if (tgId) {
      getUserGroupDeals(tgId)
        .then(d => {
          setDeals(d || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [store.telegramId]);

  if (!store.telegramId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center max-w-sm w-full">
          <div className="text-5xl mb-3">🚪</div>
          <h2 className="text-base font-bold text-slate-800">Login Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">Please log in to your Telegram profile to view your active Group Buy saving groups.</p>
          <button onClick={() => navigate(-1)} className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white">
      <div className="max-w-lg mx-auto p-4 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white shadow-sm hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">🤝 My Group Buys (ማህበሮቼ)</h1>
            <p className="text-xs text-slate-400">Campaigns you created or joined</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading active deals...
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <Package size={48} className="mx-auto text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Group Deals Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Explore our products and start your first Mahiber group to save up to 25% off!</p>
            <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const progress = Math.round((deal.current_members / deal.max_members) * 100);
              const savings = deal.regular_price - deal.group_price;
              const statusColors: Record<string, string> = {
                open: 'bg-blue-50 text-blue-600 border-blue-100',
                active: 'bg-green-50 text-green-600 border-green-100',
                fulfilled: 'bg-slate-50 text-slate-600 border-slate-100',
                expired: 'bg-red-50 text-red-600 border-red-100'
              };
              return (
                <div key={deal.id} 
                  onClick={() => navigate(`/group-deal/${deal.share_token}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 transition-all cursor-pointer">
                  
                  <div className="flex gap-3">
                    {deal.product_image && (
                      <img src={deal.product_image} alt={deal.product_name} className="w-14 h-14 rounded-lg object-cover border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border capitalize ${statusColors[deal.status] || 'bg-slate-50'}`}>
                          {deal.status}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Expires {new Date(deal.expires_at || Date.now() + 86400000).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-1 truncate">{deal.product_name}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-extrabold text-green-600">Br {deal.group_price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-medium flex items-center gap-1">
                        <Users size={12} /> {deal.current_members} / {deal.max_members} members
                      </span>
                      <span>{progress}% filled</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400">
                    <span>Campaign #{deal.id}</span>
                    <span className="text-blue-500 font-bold flex items-center gap-1">
                      View Campaign <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
