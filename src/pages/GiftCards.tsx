import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { Check, X, Gift } from 'lucide-react';

export default function GiftCards() {
  const navigate = useNavigate();
  const { addGiftCard } = useStore();
  const [amount, setAmount] = useState(500);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const purchase = () => {
    if (amount < 50 || !phone) { toast('Amount min Br 50 and phone required', 'error'); return; }
    const code = 'GIFT-' + Date.now().toString(36).toUpperCase();
    addGiftCard({
      code, balance: amount, initialBalance: amount, active: true,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    setShowConfirm(true);
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
        <button className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm font-bold shadow hover:shadow-lg transition-all" onClick={purchase}>
          🎁 Purchase Gift Card
        </button>
        <button className="w-full py-2.5 border border-border rounded-lg text-xs" onClick={() => navigate('/profile')}>
          ⬅️ Back
        </button>
      </div>

      {/* Success Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-bounce-in text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-3">
              <Gift size={28} className="text-green-500" />
            </div>
            <h3 className="text-base font-bold mb-1">🎉 Gift Card Purchased!</h3>
            <p className="text-xs text-muted-foreground mb-3">Share this code with your recipient</p>
            <div className="bg-muted/50 rounded-xl p-3 mb-3">
              <p className="text-[9px] text-muted-foreground mb-1">Gift Code</p>
              <p className="text-sm font-bold font-mono text-primary">GIFT-{Date.now().toString(36).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => { navigator.clipboard.writeText('GIFT-' + Date.now().toString(36).toUpperCase()); toast('Code copied!', 'success'); }}>
                📋 Copy Code
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-xs font-bold" onClick={() => { setShowConfirm(false); navigate('/profile'); }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
