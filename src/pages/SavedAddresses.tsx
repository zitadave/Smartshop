import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Trash2, Edit3, Home, Briefcase, ChevronLeft } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function SavedAddresses() {
  const navigate = useNavigate();
  const { savedAddresses, addAddress, removeAddress } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', city: '', address: '', phone: '' });

  const handleSave = () => {
    if (!newAddr.city.trim() || !newAddr.address.trim()) {
      toast('City and address required', 'error');
      return;
    }
    addAddress({ ...newAddr, id: Date.now() });
    setNewAddr({ label: 'Home', city: '', address: '', phone: '' });
    setShowForm(false);
    toast('✅ Address saved!', 'success');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">📍 Saved Addresses</h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{savedAddresses.length}</span>
      </div>

      {!showForm && (
        <button className="w-full py-3 mb-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
          onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add New Address
        </button>
      )}

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-3 mb-3 animate-slideUp">
          <div className="flex gap-2 mb-3">
            {['Home', 'Work', 'Other'].map(label => (
              <button key={label} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all',
                newAddr.label === label ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              )} onClick={() => setNewAddr({ ...newAddr, label })}>
                {label === 'Home' ? '🏠' : label === 'Work' ? '💼' : '📍'} {label}
              </button>
            ))}
          </div>
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-2" placeholder="City" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} />
          <textarea className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-2 resize-none h-16" placeholder="Full address" value={newAddr.address} onChange={e => setNewAddr({ ...newAddr, address: e.target.value })} />
          <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-3" placeholder="Phone (optional)" value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} />
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={handleSave}>💾 Save Address</button>
            <button className="px-4 py-2.5 border border-border rounded-xl text-xs" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {savedAddresses.map((addr: any, i: number) => (
          <div key={addr.id || i} className="bg-card rounded-xl border border-border p-3 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                <div>
                  <div className="text-xs font-semibold">{addr.label}</div>
                  <div className="text-[10px] text-muted-foreground">{addr.city}</div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" onClick={() => { removeAddress(i); toast('Removed address', 'info'); }}>
                <Trash2 size={12} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ml-8">{addr.address}</p>
            {addr.phone && <p className="text-[9px] text-muted-foreground ml-8 mt-0.5">📞 {addr.phone}</p>}
          </div>
        ))}
        {savedAddresses.length === 0 && !showForm && (
          <div className="text-center py-12">
            <MapPin size={32} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No addresses saved yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
