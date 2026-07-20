import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';

export default function GiftCards() {
  const navigate = useNavigate();
  const { addGiftCard } = useStore();
  const [amount, setAmount] = useState(500);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const purchase = () => {
    if (amount < 50 || !phone) return alert('Amount min Br 50 and phone required');
    const code = 'GIFT-' + Date.now().toString(36).toUpperCase();
    addGiftCard({ code, amount, phone, message, from: '', date: new Date().toISOString(), used: false });
    alert('🎁 Gift card purchased! Code: ' + code);
    navigate('/profile');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-md mx-auto text-center">
      <div className="text-6xl mb-3">🎁</div>
      <h2 className="text-lg font-bold mb-1">Digital Gift Cards</h2>
      <p className="text-xs text-muted-foreground mb-6">Give the gift of choice!</p>
      
      <div className="space-y-3 text-left">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground">Amount (Br)</label>
          <input type="number" className="w-full p-2.5 border border-input rounded-lg text-sm bg-card" value={amount} onChange={e => setAmount(Number(e.target.value))} min={50} />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground">Recipient Phone</label>
          <input className="w-full p-2.5 border border-input rounded-lg text-sm bg-card" placeholder="09XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground">Message (optional)</label>
          <textarea className="w-full p-2.5 border border-input rounded-lg text-sm bg-card" rows={2} placeholder="Happy Birthday! 🎂" value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <button className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm font-bold shadow" onClick={purchase}>
          🎁 Purchase Gift Card
        </button>
        <button className="w-full py-2.5 border border-border rounded-lg text-xs" onClick={() => navigate('/profile')}>
          ⬅️ Back
        </button>
      </div>
    </div>
  );
}
