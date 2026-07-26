import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createGroupDeal, joinGroupDeal, generateShareMessage, shareToTelegram, calculateGroupPrice } from '@/lib/groupBuying';
import { ArrowLeft, Users, Share2, Tag, Clock } from 'lucide-react';

export default function GroupDealView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/group-deals?token=${token}`).then(r => r.json()).then(d => {
      setDeal(d.deals?.[0] || null);
      setLoading(false);
    });
  }, [token]);

  const handleJoin = async () => {
    if (!name.trim() || !phone.trim()) return alert('Name and phone required');
    const result = await joinGroupDeal({ token: token!, telegramId: 0, fullName: name, phone });
    if (result.success) {
      setJoined(true);
      if (result.deal) setDeal(result.deal);
    } else {
      alert(result.error || 'Failed to join');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!deal) return <div className="p-8 text-center">Deal not found or expired</div>;

  const savings = deal.regular_price - deal.group_price;
  const spotsLeft = deal.max_members - deal.current_members;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
          <div className="text-5xl mb-3">🛍️</div>
          <h1 className="text-xl font-bold text-slate-800">{deal.product_name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-3xl font-bold text-green-600">Br {deal.group_price.toLocaleString()}</span>
            <span className="text-lg text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
          </div>
          {savings > 0 && <p className="text-green-500 font-medium mt-1">💰 Save Br {savings.toLocaleString()}!</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Users size={20} className="mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{deal.current_members}/{deal.max_members}</p>
            <p className="text-xs text-slate-400">Members</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Tag size={20} className="mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{deal.min_members}+</p>
            <p className="text-xs text-slate-400">Min to activate</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Clock size={20} className="mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold">{spotsLeft}</p>
            <p className="text-xs text-slate-400">Spots left</p>
          </div>
        </div>

        {!joined ? (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Join this group deal!</h2>
            <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                   className="w-full p-3 border rounded-lg mb-2 text-sm" />
            <input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}
                   className="w-full p-3 border rounded-lg mb-3 text-sm" />
            <button onClick={handleJoin}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              🤝 Join Group Deal
            </button>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <p className="text-green-700 font-semibold">🎉 You joined! Share to get more people!</p>
          </div>
        )}

        <button onClick={() => shareToTelegram(deal)}
                className="w-full mt-3 py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
          <Share2 size={18} /> Share with Friends
        </button>
      </div>
    </div>
  );
}
