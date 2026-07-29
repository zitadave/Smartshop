import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { sendFileToTelegram } from '@/lib/adminNotifier';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import { Bike, CheckCircle, XCircle, Trash2, RefreshCw, Search, Loader, MapPin, Phone, DollarSign, Star, ChevronRight, Clock, Shield } from 'lucide-react';

type SubTab = 'applications' | 'drivers' | 'deliveries' | 'zones';

export default function AdminDeliveryTab() {
  const { profile } = useStore();
  var [subTab, setSubTab] = useState<SubTab>('applications');
  var [applications, setApplications] = useState<any[]>([]);
  var [drivers, setDrivers] = useState<any[]>([]);
  var [deliveries, setDeliveries] = useState<any[]>([]);
  var [zones, setZones] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  var [selectedKYC, setSelectedKYC] = useState<any | null>(null);
  var [mounted, setMounted] = useState(false);
  var [rejectingDriverId, setRejectingDriverId] = useState<number | null>(null);
  var [rejectingDriverName, setRejectingDriverName] = useState<string>('');
  var [rejectionReason, setRejectionReason] = useState<string>('');
  var [zoomImage, setZoomImage] = useState<string | null>(null);
  var [exporting, setExporting] = useState(false);

  const sendDriverDocsToTelegram = async (d: any) => {
    toast('⏳ Sending driver documents to Telegram...', 'info');
    let sentCount = 0;
    if (d.fayda_selfie_url) {
      const ok = await sendFileToTelegram(d.fayda_selfie_url, `driver-selfie-${d.id}.jpg`, {
        contentType: 'image/jpeg',
        caption: `👤 Selfie for Driver Application: ${d.full_name_latin}`,
        silent: true,
      });
      if (ok) sentCount++;
    }
    if (d.fayda_id_front_url) {
      const ok = await sendFileToTelegram(d.fayda_id_front_url, `driver-fayda-front-${d.id}.jpg`, {
        contentType: 'image/jpeg',
        caption: `🆔 Fayda Front for Driver Application: ${d.full_name_latin}`,
        silent: true,
      });
      if (ok) sentCount++;
    }
    if (d.fayda_id_back_url) {
      const ok = await sendFileToTelegram(d.fayda_id_back_url, `driver-fayda-back-${d.id}.jpg`, {
        contentType: 'image/jpeg',
        caption: `🆔 Fayda Back for Driver Application: ${d.full_name_latin}`,
        silent: true,
      });
      if (ok) sentCount++;
    }

    const addrParts = (d.emergency_address || '').split('::');
    const emFront = addrParts[1] || '';
    const emBack = addrParts[2] || '';
    if (emFront) {
      const ok = await sendFileToTelegram(emFront, `driver-emergency-front-${d.id}.jpg`, {
        contentType: 'image/jpeg',
        caption: `🆘 Emergency Front ID for Driver Application: ${d.full_name_latin}`,
        silent: true,
      });
      if (ok) sentCount++;
    }
    if (emBack) {
      const ok = await sendFileToTelegram(emBack, `driver-emergency-back-${d.id}.jpg`, {
        contentType: 'image/jpeg',
        caption: `🆘 Emergency Back ID for Driver Application: ${d.full_name_latin}`,
        silent: true,
      });
      if (ok) sentCount++;
    }

    if (sentCount > 0) {
      toast(`📎 Sent ${sentCount} driver verification documents successfully to your Telegram chat!`, 'success');
    } else {
      toast('❌ No documents found or failed to send.', 'error');
    }
  };

  useEffect(function() {
    setMounted(true);
  }, []);

  function fetchAll() {
    setLoading(true);
    Promise.all([
      fetch('/api/delivery/applications').then(function(r) { return r.json(); }).then(function(d) { if (d.applications) setApplications(d.applications); }).catch(function() {}),
      fetch('/api/delivery/drivers').then(function(r) { return r.json(); }).then(function(d) { if (d.drivers) setDrivers(d.drivers); }).catch(function() {}),
      fetch('/api/delivery/zones').then(function(r) { return r.json(); }).then(function(d) { if (d.zones) setZones(d.zones); }).catch(function() {}),
    ]).then(function() { setLoading(false); }).catch(function() { setLoading(false); });
  }

  useEffect(fetchAll, []);

  function approveDriver(id: any, name: any) {
    fetch('/api/delivery/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, driver_id: id, status: 'approved' })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { 
        toast('✅ ' + name + ' approved!', 'success'); 
        setSelectedKYC(null);
        fetchAll(); 
      }
      else { toast('Error: ' + (d.error || ''), 'error'); }
    }).catch(function(e) { toast('Error: ' + e.message, 'error'); });
  }

  function rejectDriver(id: any, name: any) {
    setRejectingDriverId(id);
    setRejectingDriverName(name);
    setRejectionReason('');
  }

  function submitRejection() {
    if (!rejectingDriverId) return;
    const finalReason = rejectionReason.trim() || 'Application does not meet requirements';
    fetch('/api/delivery/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rejectingDriverId, driver_id: rejectingDriverId, status: 'rejected', reason: finalReason })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { 
        toast('❌ ' + rejectingDriverName + ' rejected.', 'info'); 
        setRejectingDriverId(null);
        setSelectedKYC(null);
        fetchAll(); 
      } else {
        toast('Error: ' + (d.error || ''), 'error');
      }
    }).catch(function(e) { toast('Error: ' + e.message, 'error'); });
  }

  function exportExcel() {
    setExporting(true);
    toast('⏳ Generating and dispatching Fleet report...', 'info');
    fetch('/api/export-drivers?chatId=' + (profile?.telegramId || ''))
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setExporting(false);
        if (d.success) {
          toast('📊 Fleet report sent directly to your Telegram chat!', 'success');
        } else {
          toast('Error: ' + (d.message || 'Could not send report'), 'error');
        }
      })
      .catch(function(e) {
        setExporting(false);
        toast('Error: ' + e.message, 'error');
      });
  }

  function removeDriver(id: any) {
    setDeleteConfirmId(null);
    fetch('/api/delivery/drivers/' + id, { method: 'DELETE' })
      .then(function(r) { return r.json(); }).then(function(d) {
        if (d.success) { toast('🗑️ Driver suspended', 'info'); fetchAll(); }
      }).catch(function(e) { toast('Error: ' + e.message, 'error'); });
  }

  var filtered = drivers.filter(function(d) {
    if (!search) return true;
    var s = search.toLowerCase();
    return d.full_name_latin?.toLowerCase().includes(s) || d.fayda_id?.toLowerCase().includes(s) || d.phone?.includes(s);
  });

  var activeDeliveries = deliveries.filter(function(d) { return d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled'; });
  
  function getVehicleIcon(type: any) {
    var icons: Record<string, string> = { on_foot: '🚶', bicycle: '🚲', motorcycle: '🏍️', bajaj: '🛺' };
    return icons[type] || '🏍️';
  }

  if (loading) {
    return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;
  }

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Bike size={18} className="text-emerald-500" /> Smart Shop Express</h2>
          <p className="text-[10px] text-slate-500">Delivery personnel management</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          {[
            { id: 'applications' as SubTab, label: 'Applications', badge: applications.length },
            { id: 'drivers' as SubTab, label: 'Drivers', badge: drivers.length },
            { id: 'deliveries' as SubTab, label: 'Active' },
            { id: 'zones' as SubTab, label: 'Zones' },
          ].map(function(t) {
            return (
              <button key={t.id} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', subTab === t.id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={function() { setSubTab(t.id); }}>
                {t.label}
                {t.badge !== undefined && t.badge > 0 && <span className="bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded-full">{t.badge}</span>}
              </button>
            );
          })}
        </div>
        <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={fetchAll} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Applications Tab */}
      {subTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <Bike size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No pending applications</p>
              <p className="text-[10px] text-slate-400 mt-1">Driver registrations appear here for verification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(function(a) {
                return (
                  <div key={a.id} 
                    onClick={function() { setSelectedKYC(a); }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-emerald-300 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {a.full_name_latin?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.full_name_latin}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{getVehicleIcon(a.vehicle_type)} {a.vehicle_type} · 📞 {a.phone}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">Pending Review</span>
                        <button 
                          className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-bold shadow hover:bg-indigo-600 transition-all"
                          onClick={function(e) { e.stopPropagation(); setSelectedKYC(a); }}>
                          👁️ Review KYC
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Drivers Tab */}
      {subTab === 'drivers' && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" placeholder="Search drivers..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
            </div>
            <button 
              onClick={exportExcel}
              disabled={exporting}
              className="px-3.5 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold shadow hover:shadow-md disabled:opacity-60 transition-all flex items-center gap-1.5 flex-shrink-0">
              {exporting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  📊 Export XLSX
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-center">
              <div className="text-lg font-bold text-indigo-600">{drivers.length}</div>
              <div className="text-[7px] text-slate-500">Total</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-center">
              <div className="text-lg font-bold text-green-600">{drivers.filter(function(d) { return d.status === 'approved'; }).length}</div>
              <div className="text-[7px] text-slate-500">Approved</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-center">
              <div className="text-lg font-bold text-amber-600">{drivers.filter(function(d) { return d.is_online; }).length}</div>
              <div className="text-[7px] text-slate-500">Online</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-center">
              <div className="text-lg font-bold text-purple-600">{drivers.filter(function(d) { return d.driver_tier === 'gold' || d.driver_tier === 'platinum'; }).length}</div>
              <div className="text-[7px] text-slate-500">Top Tier</div>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No drivers found</p>
            ) : (
              filtered.map(function(d) {
                var statusColor = d.status === 'approved' ? 'bg-green-100 text-green-700' : d.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700';
                var tierBadge = d.driver_tier === 'platinum' ? '💎' : d.driver_tier === 'gold' ? '🥇' : d.driver_tier === 'silver' ? '🥈' : '🥉';
                return (
                  <div key={d.id} 
                    onClick={function() { setSelectedKYC(d); }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:shadow-sm hover:border-emerald-300 cursor-pointer transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{d.full_name_latin?.charAt(0) || '?'}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate">{d.full_name_latin}</span>
                            <span className="text-[9px]">{tierBadge}</span>
                            {d.is_online && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          </div>
                          <div className="flex items-center gap-2 text-[8px] text-slate-400 mt-0.5">
                            <span>{getVehicleIcon(d.vehicle_type)}</span>
                            <span>⭐ {d.rating || '0.0'}</span>
                            <span>📦 {d.total_deliveries || 0}</span>
                            <span>💰 Br {d.total_earnings || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={'px-1.5 py-0.5 rounded text-[8px] font-semibold ' + statusColor}>{d.status}</span>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={function(e) { e.stopPropagation(); setDeleteConfirmId(d.id); }} title="Suspend"><Trash2 size={11} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[8px] text-slate-400">
                      <Shield size={9} /> Fayda: {d.fayda_id}
                      <Phone size={9} className="ml-1" /> {d.phone}
                      {d.emergency_name && <span className="ml-1">🆘 {d.emergency_name}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Deliveries Tab */}
      {subTab === 'deliveries' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <Clock size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Active deliveries will appear here</p>
          <p className="text-[10px] text-slate-400 mt-1">Track and manage all in-progress deliveries</p>
        </div>
      )}

      {/* Zones Tab */}
      {subTab === 'zones' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(zones.length > 0 ? zones : [
            { name: 'Bole', base_fee: 30, per_km_fee: 10, max_distance_km: 10 },
            { name: 'Merkato', base_fee: 25, per_km_fee: 8, max_distance_km: 8 },
            { name: 'Piassa', base_fee: 25, per_km_fee: 8, max_distance_km: 8 },
            { name: 'Summit', base_fee: 35, per_km_fee: 12, max_distance_km: 10 },
            { name: 'Mexico', base_fee: 25, per_km_fee: 8, max_distance_km: 8 },
            { name: 'Kazanchis', base_fee: 30, per_km_fee: 10, max_distance_km: 10 },
          ]).map(function(z) {
            return (
              <div key={z.id || z.name} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">📍 {z.name}</h3>
                  <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                </div>
                <div className="space-y-1 text-[10px] text-slate-500">
                  <div className="flex justify-between"><span>Base fee</span><span className="font-semibold text-slate-800 dark:text-slate-200">Br {z.base_fee || 25}</span></div>
                  <div className="flex justify-between"><span>Per km</span><span className="font-semibold text-slate-800 dark:text-slate-200">Br {z.per_km_fee || 10}</span></div>
                  <div className="flex justify-between"><span>Max distance</span><span className="font-semibold text-slate-800 dark:text-slate-200">{z.max_distance_km || 10} km</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={function() { setDeleteConfirmId(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-sm font-bold mb-2">Suspend Driver?</h3>
              <p className="text-[10px] text-slate-500 mb-4">This driver will no longer receive deliveries.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold" onClick={function() { removeDriver(deleteConfirmId); }}>Suspend</button>
              <button className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-500" onClick={function() { setDeleteConfirmId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Full Detailed Review Modal rendered inside a React Portal to escape any parent CSS overflow / transform clipping */}
      {selectedKYC && mounted && typeof document !== 'undefined' && document.body && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto py-6" onClick={function() { setSelectedKYC(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg mx-auto my-auto shadow-2xl relative" onClick={function(e) { e.stopPropagation(); }}>
            <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm" onClick={function() { setSelectedKYC(null); }}>✕</button>
            
            <div className="text-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">KYC identity verification</span>
              <h3 className="text-base font-black mt-2 text-slate-900 dark:text-white">{selectedKYC.full_name_latin}</h3>
              {selectedKYC.full_name_amharic && <p className="text-xs text-slate-400 mt-0.5">{selectedKYC.full_name_amharic}</p>}
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto scrollbar-none pr-1">
              {/* 1. Identity Previews */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📂 Uploaded Documents (Tap for Full Preview)</h4>
                
                {/* Selfie */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block mb-1">Driver Selfie / Recent Photo</span>
                  {selectedKYC.fayda_selfie_url ? (
                    <div className="relative group w-28 h-28 rounded-xl overflow-hidden border bg-white cursor-pointer shadow-sm" onClick={function(e) { e.stopPropagation(); setZoomImage(selectedKYC.fayda_selfie_url); }}>
                      <img src={selectedKYC.fayda_selfie_url} alt="Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] font-extrabold text-white bg-slate-900/80 px-2 py-1 rounded-full flex items-center gap-1">🔍 Zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center p-2">
                      <Loader size={16} className="text-slate-300 mb-1 animate-pulse" />
                      <span className="text-[8px] font-bold text-slate-400">No Photo Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Fayda Front */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Fayda ID (Front)</span>
                    {selectedKYC.fayda_id_front_url ? (
                      <div className="relative group w-full aspect-[1.6] rounded-xl overflow-hidden border bg-white cursor-pointer shadow-sm" onClick={function(e) { e.stopPropagation(); setZoomImage(selectedKYC.fayda_id_front_url); }}>
                        <img src={selectedKYC.fayda_id_front_url} alt="Fayda Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-extrabold text-white bg-slate-900/80 px-2 py-1 rounded-full flex items-center gap-1">🔍 Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.6] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                        <Shield size={16} className="text-slate-300 mb-1" />
                        <span className="text-[8px] font-bold text-slate-400">Missing Front ID</span>
                      </div>
                    )}
                  </div>
                  {/* Fayda Back */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">Fayda ID (Back)</span>
                    {selectedKYC.fayda_id_back_url ? (
                      <div className="relative group w-full aspect-[1.6] rounded-xl overflow-hidden border bg-white cursor-pointer shadow-sm" onClick={function(e) { e.stopPropagation(); setZoomImage(selectedKYC.fayda_id_back_url); }}>
                        <img src={selectedKYC.fayda_id_back_url} alt="Fayda Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-extrabold text-white bg-slate-900/80 px-2 py-1 rounded-full flex items-center gap-1">🔍 Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.6] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                        <Shield size={16} className="text-slate-300 mb-1" />
                        <span className="text-[8px] font-bold text-slate-400">Missing Back ID</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parse Emergency ID images */}
                {(() => {
                  const addrParts = (selectedKYC.emergency_address || '').split('::');
                  const emFront = addrParts[1] || '';
                  const emBack = addrParts[2] || '';
                  return (
                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-200/50">
                      <span className="text-[9px] font-bold text-slate-400 block">Emergency Contact ID Photos</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[8px] text-slate-400 block mb-0.5">ID Card (Front)</span>
                          {emFront ? (
                            <div className="relative group w-full aspect-[1.6] rounded-xl overflow-hidden border bg-white cursor-pointer shadow-sm" onClick={function(e) { e.stopPropagation(); setZoomImage(emFront); }}>
                              <img src={emFront} alt="Emergency Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-extrabold text-white bg-slate-950/85 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">🔍 Zoom</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-[1.6] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                              <Shield size={14} className="text-slate-300 mb-1" />
                              <span className="text-[8px] font-bold text-slate-400">Not Provided</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block mb-0.5">ID Card (Back)</span>
                          {emBack ? (
                            <div className="relative group w-full aspect-[1.6] rounded-xl overflow-hidden border bg-white cursor-pointer shadow-sm" onClick={function(e) { e.stopPropagation(); setZoomImage(emBack); }}>
                              <img src={emBack} alt="Emergency Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-extrabold text-white bg-slate-950/85 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">🔍 Zoom</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-[1.6] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                              <Shield size={14} className="text-slate-300 mb-1" />
                              <span className="text-[8px] font-bold text-slate-400">Not Provided</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Driver Onboarding Details */}
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📋 Personal & Profile Details</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fayda ID Number:</span>
                  <span className="font-bold">{selectedKYC.fayda_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold">{selectedKYC.phone}</span>
                </div>
                {selectedKYC.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-bold">{selectedKYC.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Type:</span>
                  <span className="font-bold capitalize">{selectedKYC.vehicle_type}</span>
                </div>
                {selectedKYC.license_plate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Plate:</span>
                    <span className="font-bold uppercase">{selectedKYC.license_plate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Zones:</span>
                  <span className="font-bold">
                    {Array.isArray(selectedKYC.service_zones) 
                      ? selectedKYC.service_zones.join(', ') 
                      : (typeof selectedKYC.service_zones === 'string' 
                        ? selectedKYC.service_zones 
                        : 'None')}
                  </span>
                </div>
              </div>

              {/* 3. Emergency Contact */}
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">🆘 Emergency Contact Details</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Person:</span>
                  <span className="font-bold">{selectedKYC.emergency_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Relationship:</span>
                  <span className="font-bold">{selectedKYC.emergency_relationship}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold">{selectedKYC.emergency_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="font-bold">{(selectedKYC.emergency_address || '').split('::')[0]}</span>
                </div>
              </div>

              {/* 4. Payment */}
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">💸 Payment & Financials</h4>
                {selectedKYC.telebirr_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telebirr Number:</span>
                    <span className="font-bold">{selectedKYC.telebirr_number}</span>
                  </div>
                )}
                {selectedKYC.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank Account:</span>
                    <span className="font-bold">{selectedKYC.bank_name} - {selectedKYC.bank_account}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Telegram dispatch document trigger */}
            <div className="mt-3.5 px-1">
              <button
                type="button"
                onClick={() => sendDriverDocsToTelegram(selectedKYC)}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-bold shadow transition-colors flex items-center justify-center gap-1"
              >
                📎 Send Documents to Admin Telegram Chat
              </button>
            </div>

            {/* Action Buttons inside Modal */}
            <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedKYC.status !== 'approved' ? (
                <>
                  <button 
                    onClick={function() { rejectDriver(selectedKYC.id, selectedKYC.full_name_latin); }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow hover:bg-red-600 transition-all flex items-center justify-center gap-1">
                    ✕ Reject Application
                  </button>
                  <button 
                    onClick={function() { approveDriver(selectedKYC.id, selectedKYC.full_name_latin); }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow hover:shadow-lg transition-all flex items-center justify-center gap-1">
                    ✓ Approve & Verify
                  </button>
                </>
              ) : (
                <button 
                  onClick={function() { setDeleteConfirmId(selectedKYC.id); setSelectedKYC(null); }}
                  className="w-full py-3 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-600 transition-all">
                   Suspend Driver Account
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rejection Reason Modal rendered inside a React Portal to escape parent transform overlays */}
      {rejectingDriverId && mounted && typeof document !== 'undefined' && document.body && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={function() { setRejectingDriverId(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-2xl relative" onClick={function(e) { e.stopPropagation(); }}>
            <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm" onClick={function() { setRejectingDriverId(null); }}>✕</button>
            <div className="text-center mb-4">
              <span className="text-[10px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Reject Application</span>
              <h3 className="text-sm font-bold mt-2 text-slate-900 dark:text-white">Rejecting: {rejectingDriverName}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Please provide a reason for rejecting this application.</p>
            </div>
            
            <div className="space-y-3">
              <textarea 
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                rows={3}
                placeholder="Reason (e.g. Invalid photo ID, unclear selfie...)"
                value={rejectionReason}
                onChange={function(e) { setRejectionReason(e.target.value); }}
              />
              
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500" 
                  onClick={function() { setRejectingDriverId(null); }}>
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow hover:bg-red-600 transition-all"
                  onClick={submitRejection}>
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full-Screen Image Zoom Modal rendered inside a React Portal with complete event stopPropagation and NO cropping wrappers */}
      {zoomImage && mounted && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-scaleIn" 
          onClick={function(e) { e.stopPropagation(); setZoomImage(null); }}
        >
          <button 
            className="absolute right-4 top-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-black text-xl shadow-lg transition-all active:scale-90 z-[100000]" 
            onClick={function(e) { e.stopPropagation(); setZoomImage(null); }}
          >
            ✕
          </button>
          
          <img 
            src={zoomImage} 
            alt="Full Preview" 
            className="max-w-full max-h-[90vh] object-contain select-none rounded-lg shadow-2xl" 
            onClick={function(e) { e.stopPropagation(); }}
          />
          
          <div className="mt-5 text-center text-xs text-white/50 font-semibold select-none">
            Tap anywhere outside or click ✕ to close the full preview
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
