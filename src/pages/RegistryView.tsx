import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRegistryByToken, purchaseRegistryItem, shareRegistry, getRegistryProgress, type GiftRegistry } from '@/lib/giftRegistry';
import { ArrowLeft, Gift, Share2, CheckCircle, Heart } from 'lucide-react';

export default function RegistryView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [registry, setRegistry] = useState<GiftRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyerName, setBuyerName] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [purchasing, setPurchasing] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    getRegistryByToken(token).then(data => {
      setRegistry(data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!registry) return <div className="p-8 text-center">Registry not found</div>;

  const progress = getRegistryProgress(registry.items);
  const remaining = registry.items.filter(i => i.purchased < i.quantity);

  const handlePurchase = async (itemId: number) => {
    if (!buyerName.trim()) return alert('Please enter your name');
    setPurchasing(itemId);
    await purchaseRegistryItem({
      token: token!,
      itemId,
      quantity: 1,
      buyerName: buyerName.trim(),
      buyerTelegramId: 0,
      message: buyerMessage,
    });
    setPurchasing(null);
    // Refresh
    const updated = await getRegistryByToken(token!);
    setRegistry(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💍</div>
          <h1 className="text-2xl font-bold text-slate-800">{registry.coupleName}</h1>
          <p className="text-slate-500">{new Date(registry.weddingDate).toLocaleDateString()}</p>
          {registry.weddingLocation && <p className="text-slate-400 text-sm">📍 {registry.weddingLocation}</p>}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>🎁 {progress.purchased.toLocaleString()} Br ተገዝቷል</span>
            <span>💰 {progress.total.toLocaleString()} Br</span>
          </div>
          <div className="h-3 bg-pink-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                 style={{ width: `${progress.percentage}%` }} />
          </div>
          <p className="text-center text-xs text-slate-400 mt-1">{progress.percentage}% ተሟልቷል</p>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Gift size={18} /> {remaining.length ? 'Remaining Gifts' : 'All gifts purchased! 🎉'}
          </h2>
          {registry.items.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex gap-3">
                <img src={item.productImage || '/placeholder.svg'} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{item.productName}</h3>
                  <p className="text-blue-600 font-bold">Br {item.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{item.purchased}/{item.quantity} ተገዝቷል</p>
                </div>
              </div>
              {item.purchased < item.quantity && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <input placeholder="Your name (required)" value={buyerName} onChange={e => setBuyerName(e.target.value)}
                         className="w-full p-2 text-sm border rounded-lg mb-2" />
                  <input placeholder="Message to the couple (optional)" value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)}
                         className="w-full p-2 text-sm border rounded-lg mb-2" />
                  <button onClick={() => handlePurchase(item.id)} disabled={purchasing === item.id}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                    {purchasing === item.id ? '⏳ Processing...' : '🎁 Purchase Gift'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Share */}
        <button onClick={() => shareRegistry(registry)} className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl font-medium flex items-center justify-center gap-2">
          <Share2 size={18} /> Share Registry
        </button>
      </div>
    </div>
  );
}
