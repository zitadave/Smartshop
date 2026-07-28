import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroupDeals, parseSerializedName, type GroupDeal } from '@/lib/groupBuying';
import { useStore } from '@/stores/AppStore';
import { ArrowLeft, Users, Tag, Clock, Share2, ChevronRight, Package, Compass, Award } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function MyGroupDeals() {
  const navigate = useNavigate();
  const store = useStore();
  
  const [activeTab, setActiveTab] = useState<'explore' | 'my_deals'>('explore');
  const [myDeals, setMyDeals] = useState<any[]>([]);
  const [exploreDeals, setExploreDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    const tgId = store.telegramId;
    
    // Fetch all group deals on the platform for the Explore tab
    const fetchExplore = fetch('/api/group-deals')
      .then(r => r.json())
      .then(d => {
        const all = d.deals || [];
        // Filter for open or active campaigns
        const openDeals = all.filter((deal: any) => deal.status === 'open' || deal.status === 'active');
        setExploreDeals(openDeals);
      })
      .catch(err => console.error('Error fetching explore deals:', err));

    // Fetch user's joined/created deals if logged in
    const fetchUserDeals = tgId 
      ? getUserGroupDeals(tgId)
          .then(setMyDeals)
          .catch(err => console.error('Error fetching user deals:', err))
      : Promise.resolve();

    Promise.all([fetchExplore, fetchUserDeals]).then(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [store.telegramId]);

  const currentList = activeTab === 'explore' ? exploreDeals : myDeals;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white">
      <div className="max-w-lg mx-auto p-4 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white shadow-sm hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">🤝 ማህበር ግዢ (Group Buying)</h1>
            <p className="text-xs text-slate-400">Buy together with peers & save up to 25%!</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'explore' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            <Compass size={14} /> Explore Groups ({exploreDeals.length})
          </button>
          <button 
            onClick={() => {
              if (!store.telegramId) {
                toast('🚪 Please log in via Telegram first!', 'error');
              } else {
                setActiveTab('my_deals');
              }
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'my_deals' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            <Award size={14} /> My Groups ({myDeals.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading active campaigns...
          </div>
        ) : activeTab === 'my_deals' && !store.telegramId ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <Package size={44} className="mx-auto text-slate-200 mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Login Required</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Please log in to your Telegram profile to view your personal saving groups.</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <Package size={48} className="mx-auto text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">
              {activeTab === 'explore' ? 'No Active Campaigns' : 'No Group Deals Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {activeTab === 'explore' 
                ? 'There are currently no active group buy groups. Be the first to start one on any product detail page!' 
                : 'Explore active deals and start your first saving group to unlock premium group prices!'}
            </p>
            <button onClick={() => navigate('/shop')} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((deal) => {
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
                      <img src={deal.product_image} alt={parseSerializedName(deal.product_name).name} className="w-14 h-14 rounded-lg object-cover border-slate-100 border" />
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
                      <h3 className="font-bold text-slate-800 text-sm mt-1 truncate">{parseSerializedName(deal.product_name).name}</h3>
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
                      <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400">
                    <span>Started by {deal.creator_name || 'Anonymous'}</span>
                    <span className="text-blue-500 font-bold flex items-center gap-1">
                      View Deal Group <ChevronRight size={12} />
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
