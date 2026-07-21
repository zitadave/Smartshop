import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { CreditCard, Plus, Trash2, Check, ChevronLeft, Banknote, Smartphone } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { savedPayments, addSavedPayment } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: 'card', label: '', details: '' });

  const handleSave = () => {
    if (!newPayment.label.trim() || !newPayment.details.trim()) {
      toast('Please fill in all fields', 'error');
      return;
    }
    addSavedPayment({ ...newPayment, id: Date.now() });
    setNewPayment({ type: 'card', label: '', details: '' });
    setShowForm(false);
    toast('✅ Payment method saved!', 'success');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">💳 Payment Methods</h2>
      </div>

      <div className="space-y-2 mb-4">
        {[
          { type: 'telebirr', label: 'Telebirr', icon: '📱', desc: 'Mobile Money' },
          { type: 'cbebirr', label: 'CBE Birr', icon: '🏦', desc: 'Mobile Banking' },
          { type: 'cash', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
        ].map((m, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{m.icon}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold">{m.label}</div>
              <div className="text-[9px] text-muted-foreground">{m.desc}</div>
            </div>
            <Check size={16} className="text-green-500" />
          </div>
        ))}
      </div>

      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saved Cards & Accounts</h3>

      {!showForm && (
        <button className="w-full py-3 mb-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
          onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add Payment Method
        </button>
      )}

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-3 mb-3 animate-slideUp">
          <div className="flex gap-2 mb-3">
            {['card', 'mobile', 'bank'].map(type => (
              <button key={type} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all',
                newPayment.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              )} onClick={() => setNewPayment({ ...newPayment, type })}>
                {type === 'card' ? '💳 Card' : type === 'mobile' ? '📱 Mobile' : '🏦 Bank'}
              </button>
            ))}
          </div>
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-2" placeholder="Account/Card label" value={newPayment.label} onChange={e => setNewPayment({ ...newPayment, label: e.target.value })} />
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-3" placeholder="Account number / details" value={newPayment.details} onChange={e => setNewPayment({ ...newPayment, details: e.target.value })} />
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={handleSave}>💾 Save</button>
            <button className="px-4 py-2.5 border border-border rounded-xl text-xs" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {savedPayments.map((p: any, i: number) => (
          <div key={p.id || i} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-lg">
              {p.type === 'card' ? '💳' : p.type === 'mobile' ? '📱' : '🏦'}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-[9px] text-muted-foreground">{p.details}</div>
            </div>
          </div>
        ))}
        {savedPayments.length === 0 && !showForm && (
          <div className="text-center py-8">
            <CreditCard size={24} className="mx-auto mb-1 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No saved payment methods</p>
          </div>
        )}
      </div>
    </div>
  );
}
