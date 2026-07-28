import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinGroupDeal, shareToTelegram, calculateGroupPrice, parseSerializedName, type GroupDeal } from '@/lib/groupBuying';
import { useStore } from '@/stores/AppStore';
import { ArrowLeft, Users, Share2, Tag, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function GroupDealView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadDeal = () => {
    if (!token) return;
    fetch(`/api/group-deals?token=${token}`)
      .then(r => r.json())
      .then(d => {
        const fetchedDeal = d.deals?.[0] || d.deal || null;
        setDeal(fetchedDeal);
        if (fetchedDeal) {
          // Check if current user is already a member
          const userTelegramId = store.telegramId;
          const userPhone = store.profile?.phone;
          const isMember = fetchedDeal.group_deal_members?.some(
            (m: any) =>
              (userTelegramId && m.telegram_id === userTelegramId) ||
              (userPhone && m.phone === userPhone)
          );
          if (isMember) {
            setJoined(true);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching deal:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDeal();
  }, [token, store.telegramId, store.profile?.phone]);

  const handleJoin = async () => {
    if (!name.trim()) return toast('📍 Please enter your name', 'error');
    if (!phone.trim()) return toast('📞 Please enter your phone number', 'error');
    setJoining(true);
    try {
      const result = await joinGroupDeal({
        token: token!,
        telegramId: store.telegramId || 0,
        fullName: name,
        phone,
      });
      if (result.success) {
        setJoined(true);
        toast('🎉 Successfully joined the group deal!', 'success');
        loadDeal();
      } else {
        toast(result.error || 'Failed to join group deal', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'An error occurred', 'error');
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading Group Buy details...
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center max-w-sm w-full">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800">Deal Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">This group buying campaign might have expired or does not exist.</p>
          <button onClick={() => navigate('/')} className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { name: parsedName, description, color, size } = parseSerializedName(deal.product_name);
  const savings = deal.regular_price - deal.group_price;
  const spotsLeft = Math.max(0, deal.max_members - deal.current_members);
  const progress = Math.round((deal.current_members / deal.max_members) * 100);

  // Progressive discount levels for display
  const tiers = [
    { count: 1, discount: 0, label: 'Start' },
    { count: 2, discount: 5, label: '5% Off' },
    { count: 3, discount: 10, label: '10% Off' },
    { count: 5, discount: 15, label: '15% Off' },
    { count: 10, discount: 25, label: '25% Off' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-slate-50 to-white">
      <div className="max-w-lg mx-auto p-4 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white shadow-sm hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">🤝 ማህበር ግዢ (Group Buy)</h1>
            <p className="text-[10px] text-slate-500">Buy together, save together</p>
          </div>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
          <div className="flex gap-4">
            {deal.product_image && (
              <img src={deal.product_image} alt={parsedName} className="w-20 h-20 rounded-xl object-cover border" />
            )}
            <div className="flex-1">
              <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">🛒 ACTIVE DEAL</span>
              <h2 className="font-bold text-slate-800 text-base mt-1">{parsedName}</h2>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-green-600">Br {deal.group_price.toLocaleString()}</span>
                <span className="text-xs text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
              </div>
              {savings > 0 && (
                <div className="text-xs text-emerald-500 font-semibold mt-1">
                  🎉 Currently saving Br {savings.toLocaleString()} per item!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Description & Preferences */}
        {(description || (color && color !== 'Any') || (size && size !== 'Any')) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              📝 Campaign Details & Preferences
            </h3>
            {description && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2.5 leading-relaxed italic">
                "{description}"
              </p>
            )}
            <div className="flex flex-wrap gap-2.5">
              {color && color !== 'Any' && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold border border-blue-100">
                  🎨 Color: {color}
                </span>
              )}
              {size && size !== 'Any' && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold border border-purple-100">
                  📏 Size: {size}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Discount Stepper Tracker */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            📈 Progressive Discounts (መሃበር ቅናሽ)
          </h3>
          <div className="relative flex justify-between items-center px-1">
            {/* Background progress bar */}
            <div className="absolute left-0 right-0 top-3 h-1 bg-slate-100 -z-0 rounded" />
            <div 
              className="absolute left-0 h-1 bg-gradient-to-r from-green-400 to-green-500 -z-0 rounded" 
              style={{ width: `${Math.min(100, (deal.current_members / 10) * 100)}%` }} 
            />

            {tiers.map((t, idx) => {
              const active = deal.current_members >= t.count;
              return (
                <div key={idx} className="flex flex-col items-center relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm transition-all border-2 ${active ? 'bg-green-500 text-white border-green-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {t.count}
                  </div>
                  <span className={`text-[9px] font-medium mt-1.5 ${active ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-4">
            Current Members: <strong>{deal.current_members}</strong> · More members = bigger discount for everyone!
          </p>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            👥 Group Members ({deal.group_deal_members?.length || 0})
          </h3>
          <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
            {deal.group_deal_members?.map((m: any, idx: number) => {
              const isCreator = m.telegram_id === deal.creator_telegram_id;
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                    {m.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {m.full_name} {isCreator && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.2 rounded font-semibold ml-1">Owner</span>}
                    </p>
                    <p className="text-[9px] text-slate-400">Joined {new Date(m.joined_at || deal.created_at).toLocaleDateString()}</p>
                  </div>
                  {m.paid && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                      ✓ Paid
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Join / Share Action Form */}
        {!joined ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm mb-1.5">🤝 Join This Group Deal</h2>
            <p className="text-[10px] text-slate-400 mb-4">Enter your billing info to join and unlock the group price.</p>
            <div className="space-y-3">
              <input 
                placeholder="Your Full Name (ለማን እንደሚላክ)" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50" 
              />
              <input 
                placeholder="Phone Number (ስልክ ቁጥር)" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50" 
              />
              <button 
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50">
                {joining ? 'Joining Group...' : '🤝 Join Group Buy'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-green-100 shadow-sm text-center">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={22} />
            </div>
            <h3 className="font-bold text-green-800 text-sm">You are in this Group Buy!</h3>
            <p className="text-[10px] text-green-600 mt-1 mb-4">You have joined this Mahiber group. Now share it with friends to drop the price even lower!</p>
            <button 
              onClick={() => shareToTelegram(deal)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <Share2 size={14} /> Invite Friends (Share on Telegram)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
