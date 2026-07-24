import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/Toast';
import { ArrowLeft, Store, Save } from 'lucide-react';

export default function VendorRegister() {
  const nav = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = function() {
    if (!storeName.trim()) { toast('Store name is required', 'error'); return; }
    if (!storePhone.trim()) { toast('Phone number is required', 'error'); return; }
    setSubmitting(true);
    var apps = [];
    try { apps = JSON.parse(localStorage.getItem('ss_vendor_applications') || '[]'); } catch(e) {}
    apps.push({
      id: Date.now(),
      name: storeName.trim(),
      phone: storePhone.trim(),
      email: storeEmail.trim(),
      description: storeDesc.trim(),
      telegramId: '',
      appliedAt: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('ss_vendor_applications', JSON.stringify(apps));
    localStorage.setItem('ss_vendor_status', 'pending');
    // Send to API so admin can see it
    try {
      fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName.trim(), phone: storePhone.trim(), email: storeEmail.trim(), description: storeDesc.trim(), status: 'pending', appliedAt: new Date().toISOString() })
      }).catch(function() {});
    } catch(e) {}
    toast('Application submitted! Admin will review.', 'success');
    setTimeout(function() { nav('/profile'); }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700" onClick={() => nav('/profile')}>
          <ArrowLeft size={16} /> Back
        </button>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xl shadow-md">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Become a Vendor</h1>
              <p className="text-[10px] text-slate-500">Register your store to start selling</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Store Name *</label>
              <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" 
                placeholder="e.g. Selam Electronics" value={storeName} onChange={e => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Phone Number *</label>
              <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" 
                placeholder="+251-911-XXXXXX" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email (optional)</label>
              <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" 
                placeholder="vendor@email.com" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Store Description</label>
              <textarea className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none h-24" 
                placeholder="Tell us about your store and what you plan to sell..." value={storeDesc} onChange={e => setStoreDesc(e.target.value)} />
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={submit} disabled={submitting}>
              <Save size={16} /> {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
