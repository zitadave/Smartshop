import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { Bike, Bell, DollarSign, Star, Clock, MapPin, Phone, CheckCircle, XCircle, ChevronRight, Activity, Wallet, TrendingUp, RefreshCw, Navigation } from 'lucide-react';

type Tab = 'available' | 'active' | 'history' | 'earnings';

export default function DriverDashboard() {
  var navigate = useNavigate();
  var store = useStore();
  var { profile } = store;
  var [tab, setTab] = useState<Tab>('available');
  var [driver, setDriver] = useState<any>(null);
  var [deliveries, setDeliveries] = useState<any[]>([]);
  var [isOnline, setIsOnline] = useState(false);
  var [earnings, setEarnings] = useState<any>(null);
  var [driverId, setDriverId] = useState<number | null>(null);
  var [loading, setLoading] = useState(true);

  // Load driver info from localStorage
  useEffect(function() {
    try {
      var stored = JSON.parse(localStorage.getItem('ss_driver_profile') || '{}');
      if (stored.id) {
        setDriver(stored);
        setDriverId(stored.id);
        setIsOnline(stored.is_online || false);
      }
    } catch(e) {}
    setLoading(false);
  }, []);

  // Fetch available/active deliveries
  useEffect(function() {
    if (!driverId) return;
    var cancelled = false;
    
    function fetchData() {
      fetch('/api/delivery/available')
        .then(function(r) { return r.json(); })
        .then(function(d) { if (!cancelled && d.deliveries) setDeliveries(d.deliveries); })
        .catch(function() {});
      
      fetch('/api/delivery/earnings/' + driverId)
        .then(function(r) { return r.json(); })
        .then(function(d) { if (!cancelled && d) setEarnings(d); })
        .catch(function() {});
    }
    
    fetchData();
    var interval = setInterval(fetchData, 10000);
    return function() { cancelled = true; clearInterval(interval); };
  }, [driverId]);

  function toggleOnline() {
    if (!driverId) { toast('Please register as a driver first', 'error'); return; }
    var newStatus = !isOnline;
    fetch('/api/delivery/online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverId, is_online: newStatus })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        setIsOnline(newStatus);
        var stored = JSON.parse(localStorage.getItem('ss_driver_profile') || '{}');
        stored.is_online = newStatus;
        localStorage.setItem('ss_driver_profile', JSON.stringify(stored));
        toast(newStatus ? '🟢 You are online!' : '🔴 You are offline', 'success');
      }
    }).catch(function() {});
  }

  function acceptDelivery(deliveryId: number) {
    if (!driverId) return;
    fetch('/api/delivery/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deliveryId, driver_id: driverId })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        toast('✅ Delivery accepted!', 'success');
        setDeliveries(deliveries.filter(function(del) { return del.id !== deliveryId; }));
      }
    }).catch(function() {});
  }

  function updateStatus(deliveryId: number, status: string) {
    fetch('/api/delivery/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deliveryId, status: status })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) toast('✅ Status updated: ' + status, 'success');
    }).catch(function() {});
  }

  function getStatusColor(status) {
    var colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      assigned: 'bg-blue-100 text-blue-700',
      accepted: 'bg-indigo-100 text-indigo-700',
      at_vendor: 'bg-purple-100 text-purple-700',
      picked_up: 'bg-cyan-100 text-cyan-700',
      in_transit: 'bg-orange-100 text-orange-700',
      arrived: 'bg-emerald-100 text-emerald-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!driverId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4">
            <Bike size={28} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Smart Shop Express</h1>
          <p className="text-[10px] text-slate-500 mt-1 mb-4">Register as a delivery driver to start earning</p>
          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold" onClick={function() { navigate('/driver-register'); }}>
            Register as Driver
          </button>
          <button className="w-full py-3 mt-2 border border-slate-200 rounded-xl text-xs text-slate-500" onClick={function() { navigate('/profile'); }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">Smart Shop Express</h1>
              <p className="text-[10px] text-white/70">Driver Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <button className={'px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 ' + (isOnline ? 'bg-white text-emerald-700' : 'bg-white/20 text-white')} onClick={toggleOnline}>
                <span className={'w-2 h-2 rounded-full ' + (isOnline ? 'bg-emerald-500' : 'bg-red-400')} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold">{driver?.total_deliveries || 0}</div>
              <div className="text-[8px] text-white/70">Deliveries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold">{driver?.rating || '0.0'}</div>
              <div className="text-[8px] text-white/70">Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold">Br {earnings?.total_pending || 0}</div>
              <div className="text-[8px] text-white/70">Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto -mt-4 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex">
          {[
            { id: 'available' as Tab, icon: Bell, label: 'Available' },
            { id: 'active' as Tab, icon: Clock, label: 'Active' },
            { id: 'history' as Tab, icon: Activity, label: 'History' },
            { id: 'earnings' as Tab, icon: Wallet, label: 'Earnings' },
          ].map(function(t) {
            var Icon = t.icon;
            return (
              <button key={t.id} className={cn('flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all', tab === t.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500')} onClick={function() { setTab(t.id); }}>
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="mt-3 space-y-2">
          {tab === 'available' && (
            <>
              {deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; }).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">No deliveries available</p>
                  <p className="text-[10px] text-slate-400 mt-1">Make sure you're online to receive orders</p>
                </div>
              ) : (
                deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; }).map(function(del) {
                  var fee = del.driver_payout || del.fee || 0;
                  return (
                    <div key={del.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-xs font-bold font-mono text-indigo-600">{del.order_number}</div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                            <MapPin size={9} /> {del.pickup_address || 'Vendor'} → {del.delivery_address || 'Customer'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-600">Br {fee}</div>
                          <div className="text-[8px] text-slate-400">You earn</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        <span>📏 {del.distance_km || '?'} km</span>
                        {del.cod_amount > 0 && <span>💰 COD: Br {del.cod_amount}</span>}
                      </div>
                      <button className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[10px] font-bold" onClick={function() { acceptDelivery(del.id); }}>
                        ✅ Accept Delivery
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'active' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Clock size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No active deliveries</p>
              <p className="text-[10px] text-slate-400 mt-1">Accept deliveries from the Available tab</p>
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Activity size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No delivery history yet</p>
            </div>
          )}

          {tab === 'earnings' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
                  <Wallet size={16} className="mx-auto mb-1 text-emerald-500" />
                  <div className="text-lg font-bold text-emerald-600">Br {earnings?.total_pending || 0}</div>
                  <div className="text-[8px] text-slate-400">Available</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
                  <DollarSign size={16} className="mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold text-blue-600">Br {earnings?.total_paid || 0}</div>
                  <div className="text-[8px] text-slate-400">Paid Out</div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 text-center">Payouts are processed weekly via Telebirr</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
