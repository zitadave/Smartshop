import { useState, useEffect } from 'react';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { Bike, CheckCircle, XCircle, Trash2, RefreshCw, Search, Loader, MapPin, Phone, DollarSign, Star, ChevronRight, Clock, Shield } from 'lucide-react';

type SubTab = 'applications' | 'drivers' | 'deliveries' | 'zones';

export default function AdminDeliveryTab() {
  var [subTab, setSubTab] = useState<SubTab>('applications');
  var [applications, setApplications] = useState<any[]>([]);
  var [drivers, setDrivers] = useState<any[]>([]);
  var [deliveries, setDeliveries] = useState<any[]>([]);
  var [zones, setZones] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  function fetchAll() {
    setLoading(true);
    Promise.all([
      fetch('/api/delivery/applications').then(function(r) { return r.json(); }).then(function(d) { if (d.applications) setApplications(d.applications); }).catch(function() {}),
      fetch('/api/delivery/drivers').then(function(r) { return r.json(); }).then(function(d) { if (d.drivers) setDrivers(d.drivers); }).catch(function() {}),
      fetch('/api/delivery/zones').then(function(r) { return r.json(); }).then(function(d) { if (d.zones) setZones(d.zones); }).catch(function() {}),
    ]).then(function() { setLoading(false); }).catch(function() { setLoading(false); });
  }

  useEffect(fetchAll, []);

  function approveDriver(id, name) {
    fetch('/api/delivery/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: 'approved' })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { toast('✅ ' + name + ' approved!', 'success'); fetchAll(); }
      else { toast('Error: ' + (d.error || ''), 'error'); }
    }).catch(function(e) { toast('Error: ' + e.message, 'error'); });
  }

  function rejectDriver(id, name) {
    fetch('/api/delivery/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: 'rejected', reason: 'Application does not meet requirements' })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) { toast('❌ ' + name + ' rejected.', 'info'); fetchAll(); }
    }).catch(function(e) { toast('Error: ' + e.message, 'error'); });
  }

  function removeDriver(id) {
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
  
  function getVehicleIcon(type) {
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
                  <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                          {a.full_name_latin?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold">{a.full_name_latin}</div>
                          <div className="text-[10px] text-slate-500">{getVehicleIcon(a.vehicle_type)} {a.vehicle_type} · 📍 {a.service_zones?.join(', ') || 'N/A'}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">🆔 {a.fayda_id}</span>
                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">📞 {a.phone}</span>
                          </div>
                          <div className="text-[8px] text-slate-400 mt-1">
                            🆘 Emergency: {a.emergency_name} ({a.emergency_relationship}) · {a.emergency_phone}
                          </div>
                          <div className="text-[8px] text-slate-400">
                            {a.telebirr_number ? '💳 Telebirr: ' + a.telebirr_number : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:shadow-md" onClick={function() { approveDriver(a.id, a.full_name_latin); }}>
                          <CheckCircle size={11} className="inline mr-1" /> Approve
                        </button>
                        <button className="px-3 py-2 bg-red-500 text-white rounded-lg text-[9px] font-bold hover:shadow-md" onClick={function() { rejectDriver(a.id, a.full_name_latin); }}>
                          <XCircle size={11} className="inline mr-1" /> Reject
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
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" placeholder="Search drivers..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
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
                  <div key={d.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:shadow-sm transition-all">
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
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={function() { setDeleteConfirmId(d.id); }} title="Suspend"><Trash2 size={11} /></button>
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
                  <div className="flex justify-between"><span>Base fee</span><span className="font-semibold text-slate-800 dark:text-slate-200">Br {z.base_fee || z.base_fee || 25}</span></div>
                  <div className="flex justify-between"><span>Per km</span><span className="font-semibold text-slate-800 dark:text-slate-200">Br {z.per_km_fee || z.per_km_fee || 10}</span></div>
                  <div className="flex justify-between"><span>Max distance</span><span className="font-semibold text-slate-800 dark:text-slate-200">{z.max_distance_km || z.max_distance_km || 10} km</span></div>
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
    </div>
  );
}
