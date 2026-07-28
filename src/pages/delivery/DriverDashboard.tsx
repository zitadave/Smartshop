import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { Bike, Bell, DollarSign, Star, Clock, MapPin, Phone, CheckCircle, XCircle, ChevronRight, Activity, Wallet, TrendingUp, RefreshCw, Navigation, Loader } from 'lucide-react';

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

  // Poll driver status directly from database by Telegram ID (solves the stuck-on-register-screen approval bug!)
  function fetchDriverStatus() {
    var tgId = profile?.telegramId;
    if (!tgId) {
      setLoading(false);
      return;
    }

    fetch('/api/delivery/drivers?telegramId=' + tgId)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success && d.driver) {
          setDriver(d.driver);
          setDriverId(d.driver.id);
          setIsOnline(d.driver.is_online || false);
          localStorage.setItem('ss_driver_profile', JSON.stringify(d.driver));
        } else {
          // Fallback to local storage cache if offline or API is down
          try {
            var stored = JSON.parse(localStorage.getItem('ss_driver_profile') || '{}');
            if (stored.id) {
              setDriver(stored);
              setDriverId(stored.id);
              setIsOnline(stored.is_online || false);
            }
          } catch(e) {}
        }
        setLoading(false);
      })
      .catch(function() {
        setLoading(false);
      });
  }

  useEffect(function() {
    fetchDriverStatus();
    // Poll status updates every 10 seconds to detect approval/rejection instantly!
    var interval = setInterval(fetchDriverStatus, 10000);
    return function() { clearInterval(interval); };
  }, [profile?.telegramId]);

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
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  // Handle Unregistered User
  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bike size={28} className="text-white animate-bounce" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Smart Shop Express</h1>
          <p className="text-[10px] text-slate-500 mt-1 mb-5">Register as a delivery driver to start earning</p>
          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { navigate('/driver-register'); }}>
            Register as Driver
          </button>
          <button className="w-full py-3 mt-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" onClick={function() { navigate('/profile'); }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // Handle Pending Review Screen (Solves waiting feedback flow)
  if (driver.status === 'pending_review' || driver.status === 'pending_fayda') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <Clock size={28} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Application Pending Review</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hi, <strong className="text-slate-700 dark:text-slate-200">{driver.full_name_latin}</strong>! Your independent partner application is successfully submitted and under review by our administrators.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 my-4 border dark:border-slate-800 text-left text-xs space-y-2.5 shadow-inner">
            <div className="font-bold text-slate-700 dark:text-slate-300">📋 Verification Checklist:</div>
            <div className="flex items-center gap-2 text-slate-500"><CheckCircle size={14} className="text-emerald-500" /> Fayda ID Verified</div>
            <div className="flex items-center gap-2 text-slate-500"><CheckCircle size={14} className="text-emerald-500" /> Emergency Info Uploaded</div>
            <div className="flex items-center gap-2 text-slate-500"><Loader size={14} className="text-amber-500 animate-spin" /> Admin Document Review</div>
          </div>
          
          <p className="text-[10px] text-slate-400">
            We will verify your documents shortly. You will receive an instant notification in your chat.
          </p>
          
          <button className="w-full py-3 mt-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]" onClick={fetchDriverStatus}>
            🔄 Refresh Status
          </button>
        </div>
      </div>
    );
  }

  // Handle Rejected Screen (Pre-population edit & re-apply trigger)
  if (driver.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <XCircle size={28} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Application Rejected</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hi, <strong className="text-slate-700 dark:text-slate-200">{driver.full_name_latin}</strong>. We are sorry, but your application did not pass our safety standards.
          </p>
          
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 my-4 text-left text-xs space-y-1.5 shadow-inner">
            <div className="font-bold text-red-700 dark:text-red-400">🔴 Rejection Reason:</div>
            <p className="text-red-600 dark:text-red-300 italic leading-relaxed">"{driver.rejection_reason || 'Application documents did not meet requirements.'}"</p>
          </div>
          
          <p className="text-[10px] text-slate-400 mb-4">
            Don't worry! You can easily adjust your documents (e.g. re-upload a clear selfie or ID card photo) and submit a new application.
          </p>
          
          <button className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { navigate('/driver-register'); }}>
            ✏️ Adjust Case & Re-apply
          </button>
          <button className="w-full py-3 mt-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" onClick={function() { navigate('/profile'); }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // Handle Approved Screen (Dashboard)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">{driver?.full_name_latin}</h1>
              <p className="text-[10px] text-white/70">Smart Shop Express Partner</p>
            </div>
            <div className="flex items-center gap-2">
              <button className={'px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 ' + (isOnline ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white/20 text-white')} onClick={toggleOnline}>
                <span className={'w-2 h-2 rounded-full ' + (isOnline ? 'bg-emerald-500' : 'bg-red-400')} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 animate-scaleIn">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
              <div className="text-lg font-bold">{driver?.total_deliveries || 0}</div>
              <div className="text-[8px] text-white/70">Deliveries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
              <div className="text-lg font-bold">{driver?.rating || '0.0'}</div>
              <div className="text-[8px] text-white/70">Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
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
              <button key={t.id} className={cn('flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all', tab === t.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')} onClick={function() { setTab(t.id); }}>
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
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-scaleIn">
                  <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">No deliveries available</p>
                  <p className="text-[10px] text-slate-400 mt-1">Make sure you're online to receive orders</p>
                </div>
              ) : (
                deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; }).map(function(del) {
                  var fee = del.driver_payout || del.fee || 0;
                  return (
                    <div key={del.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all animate-scaleIn">
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
                      <button className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[10px] font-bold shadow hover:shadow-md transition-all" onClick={function() { acceptDelivery(del.id); }}>
                        ✅ Accept Delivery
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'active' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-scaleIn">
              <Clock size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No active deliveries</p>
              <p className="text-[10px] text-slate-400 mt-1">Accept deliveries from the Available tab</p>
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-scaleIn">
              <Activity size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No delivery history yet</p>
            </div>
          )}

          {tab === 'earnings' && (
            <div className="space-y-3 animate-scaleIn">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                  <Wallet size={16} className="mx-auto mb-1 text-emerald-500" />
                  <div className="text-lg font-bold text-emerald-600">Br {earnings?.total_pending || 0}</div>
                  <div className="text-[8px] text-slate-400">Available</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
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
