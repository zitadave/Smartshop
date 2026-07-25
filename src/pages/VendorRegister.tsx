import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { ArrowLeft, Store, Save, Smartphone, Mail, FileText, Store as StoreIcon } from 'lucide-react';

export default function VendorRegister() {
  var nav = useNavigate();
  var store = useStore();
  var { darkMode } = store;
  var [storeName, setStoreName] = useState('');
  var [storePhone, setStorePhone] = useState('');
  var [storeEmail, setStoreEmail] = useState('');
  var [storeDesc, setStoreDesc] = useState('');
  var [submitting, setSubmitting] = useState(false);

  // Auto-fill phone from Telegram (read-only)
  useEffect(function() {
    try {
      var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      var phone = p.phone || localStorage.getItem('ss_user_phone') || '';
      if (phone) setStorePhone(phone);
    } catch(e) {}
  }, []);

  async function submit() {
    if (!storeName.trim()) { toast('Store name is required', 'error'); return; }
    if (!storePhone.trim()) { toast('Phone number is required', 'error'); return; }
    setSubmitting(true);
    
    var ls = {};
    try { ls = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    var tgId = ls.telegramId || '';
    
    try {
      var res = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName.trim(), phone: storePhone.trim(), email: storeEmail.trim(), description: storeDesc.trim(), status: 'pending', telegram_id: tgId || '' })
      });
      var d = await res.json();
      if (d && d.vendor && d.vendor.id) {
        localStorage.setItem('ss_vendor_app_id', String(d.vendor.id));
      }
      localStorage.setItem('ss_vendor_status', 'pending');
      toast('Application submitted! Admin will review.', 'success');
      setTimeout(function() { nav('/profile'); }, 1500);
    } catch(e) {
      toast('Error submitting: ' + e.message, 'error');
      setSubmitting(false);
    }
  }

  return (
    <div className={'min-h-screen p-4 ' + (darkMode ? 'dark bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100')}>
      <div className="max-w-md mx-auto space-y-4">
        <button className={'flex items-center gap-2 text-sm ' + (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')} onClick={function() { nav('/profile'); }}>
          <ArrowLeft size={16} /> Back
        </button>
        
        <div className={'rounded-2xl border p-6 shadow-sm ' + (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/20">
              <Store size={26} />
            </div>
            <div>
              <h1 className={'text-xl font-bold ' + (darkMode ? 'text-white' : 'text-slate-900')}>Become a Vendor</h1>
              <p className={'text-[10px] ' + (darkMode ? 'text-slate-400' : 'text-slate-500')}>Register your store to start selling on Smart Shop</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className={'text-[10px] font-bold uppercase tracking-wider ' + (darkMode ? 'text-slate-400' : 'text-slate-500')}>
                <StoreIcon size={12} className="inline mr-1" />Store Name *
              </label>
              <input className={'w-full mt-1.5 p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white border-slate-200 text-slate-900')}
                placeholder="e.g. Selam Electronics" value={storeName} onChange={function(e) { setStoreName(e.target.value); }} />
            </div>

            <div>
              <label className={'text-[10px] font-bold uppercase tracking-wider ' + (darkMode ? 'text-slate-400' : 'text-slate-500')}>
                <Smartphone size={12} className="inline mr-1" />Phone Number *
              </label>
              <div className={'w-full mt-1.5 p-3 border rounded-xl text-sm flex items-center gap-2 ' + (darkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                <Smartphone size={14} className="text-emerald-500" />
                <span>{storePhone || 'Auto-filled from Telegram'}</span>
                <span className="ml-auto text-[8px] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">✓ Telegram</span>
              </div>
            </div>

            <div>
              <label className={'text-[10px] font-bold uppercase tracking-wider ' + (darkMode ? 'text-slate-400' : 'text-slate-500')}>
                <Mail size={12} className="inline mr-1" />Email (optional)
              </label>
              <input className={'w-full mt-1.5 p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white border-slate-200 text-slate-900')}
                placeholder="vendor@email.com" value={storeEmail} onChange={function(e) { setStoreEmail(e.target.value); }} />
            </div>

            <div>
              <label className={'text-[10px] font-bold uppercase tracking-wider ' + (darkMode ? 'text-slate-400' : 'text-slate-500')}>
                <FileText size={12} className="inline mr-1" />Store Description
              </label>
              <textarea className={'w-full mt-1.5 p-3 border rounded-xl text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white border-slate-200 text-slate-900')}
                placeholder="Tell us about your store and what you plan to sell..." value={storeDesc} onChange={function(e) { setStoreDesc(e.target.value); }} />
            </div>

            <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              onClick={submit} disabled={submitting}>
              <Save size={16} /> {submitting ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className={'text-[9px] text-center ' + (darkMode ? 'text-slate-500' : 'text-slate-400')}>
              Your application will be reviewed by our team. You'll be notified once approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
