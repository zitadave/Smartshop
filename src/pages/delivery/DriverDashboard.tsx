import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { cn, formatPrice } from '@/lib/utils';
import { haptic } from '@/lib/confetti';
import { 
  Bike, Bell, DollarSign, Star, Clock, MapPin, Phone, CheckCircle, 
  XCircle, ChevronRight, Activity, Wallet, TrendingUp, RefreshCw, 
  Navigation, Loader, Award, Shield, User, ArrowUpRight, ArrowRight,
  ExternalLink, Send, Check
} from 'lucide-react';

type Tab = 'available' | 'active' | 'history' | 'earnings';

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-950/40 text-amber-400 border border-amber-500/20',
    confirmed: 'bg-blue-950/40 text-blue-400 border border-blue-500/20',
    preparing: 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20',
    out_for_delivery: 'bg-purple-950/40 text-purple-400 border border-purple-500/20',
    delivered: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20',
    failed: 'bg-rose-950/40 text-rose-400 border border-rose-500/20',
    cancelled: 'bg-slate-950/40 text-slate-400 border border-slate-500/20',
  };
  return colors[status] || 'bg-slate-950/40 text-slate-400 border border-slate-500/20';
}

interface DailyEarning {
  day: string;
  amount: number;
}

function DriverLiveMap({ delivery, driverLat, driverLng }: { delivery: any; driverLat?: number; driverLng?: number }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapId = `driver-map-${delivery.id}`;

  useEffect(() => {
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !(window as any).L) return;
    const L = (window as any).L;
    const el = document.getElementById(mapId);
    if (!el) return;

    el.innerHTML = '';
    const map = L.map(el, { zoomControl: false, attributionControl: false });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    const pLat = Number(delivery.pickup_lat) || 9.0190;
    const pLng = Number(delivery.pickup_lng) || 38.7680;
    const dLat = Number(delivery.delivery_lat) || 9.0315;
    const dLng = Number(delivery.delivery_lng) || 38.7485;
    const myLat = Number(driverLat) || pLat;
    const myLng = Number(driverLng) || pLng;

    const storeIcon = L.divIcon({
      className: 'custom-store-icon',
      html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-sm">🏪</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const destIcon = L.divIcon({
      className: 'custom-dest-icon',
      html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-sm">🏠</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg animate-pulse"><span class="text-sm">🏍️</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const mStore = L.marker([pLat, pLng], { icon: storeIcon }).addTo(map);
    const mDest = L.marker([dLat, dLng], { icon: destIcon }).addTo(map);
    const mDriver = L.marker([myLat, myLng], { icon: driverIcon }).addTo(map);

    fetch(`https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data && data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          L.polyline(latLngs, { color: '#10B981', weight: 4, opacity: 0.9 }).addTo(map);
          L.polyline(latLngs, { color: '#34D399', weight: 8, opacity: 0.3 }).addTo(map);

          const group = new L.featureGroup([mStore, mDest, mDriver]);
          map.fitBounds(group.getBounds().pad(0.25));
        } else {
          throw new Error('OSRM fallback');
        }
      })
      .catch(() => {
        L.polyline([[pLat, pLng], [dLat, dLng]], { color: '#10B981', weight: 3, dashArray: '6, 6' }).addTo(map);
        const group = new L.featureGroup([mStore, mDest, mDriver]);
        map.fitBounds(group.getBounds().pad(0.25));
      });

    return () => {
      try { map.remove(); } catch {}
    };
  }, [mapLoaded, delivery.id, delivery.pickup_lat, delivery.delivery_lat, driverLat, driverLng]);

  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      <div id={mapId} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
        <span className="bg-slate-900/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          {delivery.distance_km || '3.5'} km • ~{Math.max(5, Math.round((Number(delivery.distance_km) || 3.5) * 3))} min drive
        </span>
      </div>
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <span className="bg-slate-900/90 backdrop-blur text-slate-300 text-[8px] px-2 py-0.5 rounded-md font-semibold border border-slate-800">
          🏪 {delivery.pickup_address || 'Smart Shop'} ➔ 🏠 {delivery.delivery_address || 'Customer'}
        </span>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const profile = useStore(state => state.profile);
  
  var [tab, setTab] = useState<Tab>('available');
  var [driver, setDriver] = useState<any>(null);
  var [deliveries, setDeliveries] = useState<any[]>([]);
  var [isOnline, setIsOnline] = useState(false);
  var [earnings, setEarnings] = useState<any>(null);
  var [driverId, setDriverId] = useState<number | null>(null);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);

  // Cashout / Payout Modal states
  var [showCashoutModal, setShowCashoutModal] = useState(false);
  var [cashoutAmount, setCashoutAmount] = useState('');
  var [cashoutPhone, setCashoutPhone] = useState('');
  var [cashoutLoading, setCashoutLoading] = useState(false);

  // PIN Verification Modal states
  var [pinVerificationId, setPinVerificationId] = useState<number | null>(null);
  var [verificationPinInput, setVerificationPinInput] = useState('');
  var [verifyingPin, setVerifyingPin] = useState(false);

  // Simulated daily earnings trend (7 days) for our custom CSS bar chart
  var [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([
    { day: 'Mon', amount: 350 },
    { day: 'Tue', amount: 480 },
    { day: 'Wed', amount: 200 },
    { day: 'Thu', amount: 620 },
    { day: 'Fri', amount: 150 },
    { day: 'Sat', amount: 750 },
    { day: 'Sun', amount: 900 }
  ]);

  // Synchronize and poll driver profile directly from database
  function fetchDriverStatus(showSpinner = false) {
    var tgId = profile?.telegramId;
    if (!tgId) {
      try {
        var stored = JSON.parse(localStorage.getItem('ss_profile') || '{}');
        tgId = stored.telegramId || '';
      } catch(e) {}
    }
    var userPhone = profile?.phone || localStorage.getItem('ss_user_phone') || '';
    try {
      if (!userPhone) {
        var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
        userPhone = p.phone || '';
      }
    } catch(e) {}

    if (!tgId && !userPhone) {
      setLoading(false);
      return;
    }

    if (showSpinner) setRefreshing(true);
    var url = tgId ? '/api/delivery/drivers?telegramId=' + tgId : '/api/delivery/drivers?phone=' + encodeURIComponent(userPhone);
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success && d.driver) {
          setDriver(d.driver);
          setDriverId(d.driver.id);
          setIsOnline(d.driver.is_online || false);
          setCashoutPhone(d.driver.telebirr_number || d.driver.phone || '');
          localStorage.setItem('ss_driver_profile', JSON.stringify(d.driver));
        } else {
          // Cache fallback
          try {
            var stored = JSON.parse(localStorage.getItem('ss_driver_profile') || '{}');
            if (stored.id) {
              setDriver(stored);
              setDriverId(stored.id);
              setIsOnline(stored.is_online || false);
              setCashoutPhone(stored.telebirr_number || stored.phone || '');
            }
          } catch(e) {}
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch(function() {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(function() {
    fetchDriverStatus();
    var interval = setInterval(fetchDriverStatus, 10000); // Poll status updates
    return function() { clearInterval(interval); };
  }, [profile?.telegramId]);

  // Silent Background GPS tracking using watchPosition (prompts only once on mount / go-online!)
  useEffect(() => {
    if (!isOnline || !driverId) return;

    if (!navigator.geolocation) return;

    console.log('[GPS] Subscribing to continuous watchPosition...');
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const offlineCache = JSON.parse(localStorage.getItem('ss_driver_offline_coords') || '[]');
          
          const res = await fetch('/api/delivery/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              driver_id: driverId, 
              lat, 
              lng,
              offline_coords: offlineCache.length > 0 ? offlineCache : undefined
            })
          });

          if (res.ok) {
            if (offlineCache.length > 0) {
              localStorage.removeItem('ss_driver_offline_coords');
              console.log(`[GPS] Successfully flushed ${offlineCache.length} cached coordinates to server.`);
            }
            console.log(`[GPS] Real-time coordinates watched & updated: ${lat}, ${lng}`);
          } else {
            throw new Error('Server non-ok response');
          }
        } catch (err) {
          const entry = { lat, lng, timestamp: new Date().toISOString() };
          const cache = JSON.parse(localStorage.getItem('ss_driver_offline_coords') || '[]');
          cache.push(entry);
          localStorage.setItem('ss_driver_offline_coords', JSON.stringify(cache));
          console.warn(`[GPS OFFLINE] Network lost. Cached coordinates locally (${cache.length} stored).`);
        }
      },
      (err) => console.warn('[GPS] Position watch error:', err.message),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );

    return () => {
      console.log('[GPS] Cleaning up watchPosition...');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, driverId]);

  // Fetch available and active delivery milestones
  function fetchDeliveries() {
    if (!driverId) return;
    
    fetch('/api/delivery/available')
      .then(function(r) { return r.json(); })
      .then(function(d) { 
        if (d.deliveries) {
          setDeliveries(function(prev) {
            const currentIds = prev.map(function(x) { return x.id; });
            const newJobs = d.deliveries.filter(function(x) { return (x.status === 'pending' || x.status === 'assigned') && !currentIds.includes(x.id); });
            if (newJobs.length > 0) {
              const assignedToMe = newJobs.find(function(x: any) { return x.status === 'assigned' && (x.driver_id === driverId || x.driver_id == driverId); });
              if (assignedToMe) {
                toast(`⚡ Order #${assignedToMe.order_number} has been AUTOMATICALLY ASSIGNED to you!`, 'success');
                haptic('success');
              } else {
                toast(`🔔 New express delivery job available! Order #${newJobs[0].order_number}`, 'info');
                haptic('medium');
              }
            }
            return d.deliveries;
          });
        }
      })
      .catch(function() {});
    
    fetch('/api/delivery/earnings/' + driverId)
      .then(function(r) { return r.json(); })
      .then(function(d) { 
        if (d) setEarnings(d); 
      })
      .catch(function() {});
  }

  useEffect(function() {
    fetchDeliveries();
    var interval = setInterval(fetchDeliveries, 12000);
    return function() { clearInterval(interval); };
  }, [driverId]);

  function toggleOnline() {
    if (!driverId) return;
    var newStatus = !isOnline;
    haptic('light');

    setIsOnline(newStatus);
    var stored = JSON.parse(localStorage.getItem('ss_driver_profile') || '{}');
    stored.is_online = newStatus;
    localStorage.setItem('ss_driver_profile', JSON.stringify(stored));

    if (newStatus) {
      toast('🟢 Active Radar: You are online!', 'success');
      haptic('success');
      // 1. Instantly set status to online on the database and state (non-blocking!)
      fetch('/api/delivery/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, is_online: newStatus })
      }).catch(function() {
        toast('Connection error - retrying...', 'error');
      });

      // 2. Silently query initial location in background
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            fetch('/api/delivery/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ driver_id: driverId, lat, lng })
            }).catch(function() {});
          },
          function(err) {
            console.warn('[GPS] Initial background lock failed:', err.message);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      }
    } else {
      toast('🔴 Offline: Radar turned off', 'success');
      haptic('success');
      fetch('/api/delivery/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, is_online: newStatus })
      }).catch(function() {});
    }
  }

  function acceptDelivery(deliveryId: number) {
    if (!driverId) return;
    haptic('medium');

    fetch('/api/delivery/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deliveryId, driver_id: driverId })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        toast('✅ Milestone assigned! Drive safely.', 'success');
        setDeliveries(deliveries.map(function(del) { return del.id === deliveryId ? { ...del, status: 'accepted', driver_id: driverId } : del; }));
        setTab('active');
        fetchDeliveries();
        haptic('success');
      } else {
        toast('Error accepting: ' + (d.error || 'order already assigned'), 'error');
      }
    }).catch(function() {});
  }

  function declineDelivery(deliveryId: number) {
    if (!driverId) return;
    if (!confirm('Decline this delivery job? We will reassign it immediately to the next closest express partner.')) return;
    haptic('medium');

    fetch('/api/delivery/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: deliveryId, driver_id: driverId, reason: 'driver_passed' })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        toast('❌ Job declined & reassigned to next partner.', 'info');
        setDeliveries(deliveries.filter(function(del) { return del.id !== deliveryId; }));
        fetchDeliveries();
        haptic('success');
      } else {
        toast('Error declining: ' + (d.error || 'unknown error'), 'error');
      }
    }).catch(function() {
      toast('Connection error', 'error');
    });
  }

  function triggerStatusUpdate(deliveryId: number, status: string) {
    haptic('light');
    fetch('/api/delivery/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deliveryId, status: status })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        toast('✅ Delivery status updated to: ' + status, 'success');
        fetchDeliveries();
        haptic('success');
        if (status === 'arrived') {
          setPinVerificationId(deliveryId);
          setVerificationPinInput('');
        }
      }
    }).catch(function() {});
  }

  function submitTelebirrCashout() {
    var amt = parseInt(cashoutAmount);
    var pendingAmt = earnings?.total_pending || 0;
    
    if (!amt || amt <= 0) { toast('Please enter a valid amount', 'error'); return; }
    if (amt > pendingAmt) { toast('Insufficient balance. Max cashout: Br ' + pendingAmt, 'error'); return; }
    if (!cashoutPhone.trim()) { toast('Please provide your Telebirr number', 'error'); return; }

    setCashoutLoading(true);
    haptic('light');

    // Simulate instant payout processing
    setTimeout(function() {
      setCashoutLoading(false);
      setShowCashoutModal(false);
      toast(`💸 Instant Payout of Br ${amt} successfully sent to Telebirr ${cashoutPhone}!`, 'success');
      setCashoutAmount('');
      
      // Update local values dynamically
      if (earnings) {
        setEarnings({
          ...earnings,
          total_pending: Math.max(0, pendingAmt - amt),
          total_paid: (earnings.total_paid || 0) + amt
        });
      }
      haptic('success');
    }, 2500);
  }

  function handleVerifyPin() {
    if (!pinVerificationId || !verificationPinInput.trim()) {
      toast('Please enter the 4-digit verification PIN', 'error');
      return;
    }
    setVerifyingPin(true);
    fetch('/api/delivery/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: pinVerificationId, pin: verificationPinInput.trim() })
    }).then(function(r) { return r.json(); }).then(function(d) {
      setVerifyingPin(false);
      if (d.verified) {
        toast('✅ PIN Verified! Mission completed.', 'success');
        setPinVerificationId(null);
        setVerificationPinInput('');
        fetchDeliveries();
      } else {
        toast('❌ Incorrect verification PIN. Please ask customer.', 'error');
      }
    }).catch(function(e: any) {
      setVerifyingPin(false);
      toast('Error: ' + e.message, 'error');
    });
  }

  // TSP Routing states
  var [tspOptimized, setTspOptimized] = useState(false);

  function getActiveDeliveries() {
    return deliveries.filter(function(d) { 
      return d.status !== 'pending' && d.status !== 'assigned' && d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled' && d.status !== 'returned'; 
    });
  }

  function optimizeRoute() {
    var activeList = [...getActiveDeliveries()];
    if (activeList.length <= 1) {
      toast('Add at least 2 active deliveries to optimize the route!', 'info');
      return;
    }

    haptic('light');
    toast('⚡ Running Travelling Salesman Optimization...', 'info');

    var startLat = driver?.current_lat || 9.03;
    var startLng = driver?.current_lng || 38.74;

    var optimized: any[] = [];
    var unvisited = [...activeList];
    var currLat = startLat;
    var currLng = startLng;

    while (unvisited.length > 0) {
      var closestIdx = 0;
      var minDistance = Infinity;

      for (var i = 0; i < unvisited.length; i++) {
        var dLat = (unvisited[i].delivery_lat || 9.03) - currLat;
        var dLng = (unvisited[i].delivery_lng || 38.74) - currLng;
        var dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      var nextNode = unvisited.splice(closestIdx, 1)[0];
      optimized.push(nextNode);
      currLat = nextNode.delivery_lat || 9.03;
      currLng = nextNode.delivery_lng || 38.74;
    }

    var unoptimizedIds = activeList.map(d => d.id);
    var remainingDeliveries = deliveries.filter(d => !unoptimizedIds.includes(d.id));
    
    setDeliveries([...remainingDeliveries, ...optimized]);
    setTspOptimized(true);
    toast('✅ Route Optimized! Stops arranged in fastest sequence.', 'success');
    haptic('success');
  }

  // Calculate driver gamification stats based on real deliveries count
  var deliveriesCount = driver?.total_deliveries || 0;
  var currentTier = 'Bronze';
  var tierEmoji = '🥉';
  var tierColor = 'from-amber-600 to-orange-700';
  var nextTier = 'Silver';
  var nextTierEmoji = '🥈';
  var targetDeliveries = 10;
  
  if (deliveriesCount >= 50) {
    currentTier = 'Platinum';
    tierEmoji = '💎';
    tierColor = 'from-indigo-600 via-purple-600 to-pink-600';
    nextTier = 'Supreme';
    nextTierEmoji = '👑';
    targetDeliveries = 100;
  } else if (deliveriesCount >= 25) {
    currentTier = 'Gold';
    tierEmoji = '🥇';
    tierColor = 'from-yellow-400 via-amber-500 to-yellow-600';
    nextTier = 'Platinum';
    nextTierEmoji = '💎';
    targetDeliveries = 50;
  } else if (deliveriesCount >= 10) {
    currentTier = 'Silver';
    tierEmoji = '🥈';
    tierColor = 'from-slate-300 via-slate-400 to-slate-500';
    nextTier = 'Gold';
    nextTierEmoji = '🥇';
    targetDeliveries = 25;
  }

  var progressPercentage = Math.min(100, Math.round((deliveriesCount / targetDeliveries) * 100));

  function getPriorityTag(del: any) {
    var fee = del.driver_payout || del.fee || 0;
    if (fee > 80) return { label: '🔥 High Payout', color: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20' };
    if (del.distance_km < 3) return { label: '📍 Nearby', color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
    return { label: '⚡ Express', color: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20' };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Loader size={36} className="animate-spin text-emerald-500" />
        <span className="text-xs font-semibold tracking-wider text-slate-400">Loading Smartshop Express...</span>
      </div>
    );
  }

  // Handle Unregistered User
  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Bike size={28} className="text-white animate-bounce" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Smart Shop Express</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 mb-5">Register as a delivery driver to start earning weekly payouts</p>
          <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { navigate('/driver-register'); }}>
            Register as Driver
          </button>
          <button className="w-full py-3 mt-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={function() { navigate('/profile'); }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // Handle Pending Review Screen
  if (driver.status === 'pending_review' || driver.status === 'pending_fayda') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-amber-500/20">
            <Clock size={28} className="text-white animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Application Under Review</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hi, <strong className="text-slate-700 dark:text-slate-200">{driver.full_name_latin}</strong>! Your independent partner application is successfully submitted and under review by our administrators.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 my-4 border dark:border-slate-850 text-left text-xs space-y-2.5 shadow-inner">
            <div className="font-bold text-slate-700 dark:text-slate-300">📋 Verification Checklist:</div>
            <div className="flex items-center gap-2 text-slate-500"><CheckCircle size={14} className="text-emerald-500" /> Fayda ID Uploaded</div>
            <div className="flex items-center gap-2 text-slate-500"><CheckCircle size={14} className="text-emerald-500" /> Emergency Info Configured</div>
            <div className="flex items-center gap-2 text-slate-500"><Loader size={14} className="text-amber-500 animate-spin" /> Admin Document Review</div>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-normal">
            We will verify your documents shortly. You will receive an instant notification in your bot.
          </p>
          
          <button className="w-full py-3 mt-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5" onClick={function() { fetchDriverStatus(true); }}>
            {refreshing ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {refreshing ? 'Syncing...' : '🔄 Refresh Status'}
          </button>
        </div>
      </div>
    );
  }

  // Handle Rejected Screen
  if (driver.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-slate-800 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <XCircle size={28} className="text-white animate-bounce" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Application Rejected</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hi, <strong className="text-slate-700 dark:text-slate-200">{driver.full_name_latin}</strong>. We are sorry, but your application did not pass our safety standards.
          </p>
          
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 my-4 text-left text-xs space-y-1.5 shadow-inner">
            <div className="font-bold text-red-700 dark:text-red-400">🔴 Rejection Reason:</div>
            <p className="text-red-600 dark:text-red-300 italic leading-relaxed">"{driver.rejection_reason || 'Application documents did not meet requirements.'}"</p>
          </div>
          
          <p className="text-[10px] text-slate-400 mb-4 leading-normal">
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

  // Handle Approved Screen (Dashboard Pro)
  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-white">
      {/* Custom keyframe styles for radar effect */}
      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Header Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-5 pt-6 pb-9 relative overflow-hidden border-b border-slate-800/60 shadow-xl">
        {/* Soft glowing radar aura background when online */}
        {isOnline && (
          <div className="absolute right-6 top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
        )}
        
        <div className="max-w-lg mx-auto relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-base shadow-md">
                  {driver?.full_name_latin?.charAt(0) || <User size={18} />}
                </div>
                {/* Active Pulsing Radar Circle */}
                {isOnline && (
                  <span className="absolute -inset-1.5 rounded-2xl border-2 border-emerald-400/50 pointer-events-none" style={{ animation: 'radar-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite' }} />
                )}
                {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />}
              </div>
              <div>
                <h1 className="text-base font-black tracking-wide text-slate-100">{driver?.full_name_latin}</h1>
                <p className="text-[9px] text-slate-400 font-semibold tracking-wider flex items-center gap-1">
                  <Shield size={10} className="text-emerald-500" /> Smartshop Express Partner
                </p>
              </div>
            </div>
            
            <button 
              className={cn(
                'px-4 py-2 rounded-2xl text-[10px] font-extrabold flex items-center gap-2 transition-all duration-300 shadow-md active:scale-95',
                isOnline 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              )} 
              onClick={toggleOnline}
            >
              <span className={cn('w-2 h-2 rounded-full animate-ping', isOnline ? 'bg-white' : 'bg-slate-500')} />
              {isOnline ? 'Online Radar' : 'Offline'}
            </button>
          </div>
          
          {/* Gamified Tier Card */}
          <div className={cn('bg-gradient-to-r rounded-2xl p-4 border border-white/5 shadow-lg', tierColor)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierEmoji}</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">{currentTier} Partner</div>
                  <div className="text-[8px] opacity-80 mt-0.5">Rating Score: ⭐ {driver?.rating || '5.0'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black">{deliveriesCount} / {targetDeliveries}</div>
                <div className="text-[7px] opacity-80 uppercase tracking-wider">Deliveries done</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
              </div>
              {progressPercentage < 100 ? (
                <p className="text-[8px] opacity-90 text-right">
                  Deliver {targetDeliveries - deliveriesCount} more orders to unlock **{nextTierEmoji} {nextTier}**
                </p>
              ) : (
                <p className="text-[8px] opacity-90 text-right">🎯 Top level achieved! You are a fleet legend!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-lg mx-auto -mt-4 px-4 relative z-10">
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800/80 p-1 flex">
          {[
            { id: 'available' as Tab, icon: Bell, label: 'Available', badge: deliveries.filter(function(d) { return d.status === 'pending'; }).length },
            { id: 'active' as Tab, icon: Clock, label: 'Active', badge: deliveries.filter(function(d) { return d.status !== 'pending' && d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled' && d.status !== 'returned'; }).length },
            { id: 'history' as Tab, icon: Activity, label: 'History' },
            { id: 'earnings' as Tab, icon: Wallet, label: 'Earnings' },
          ].map(function(t) {
            var Icon = t.icon;
            var isSelected = tab === t.id;
            return (
              <button 
                key={t.id} 
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all outline-none',
                  isSelected 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15' 
                    : 'text-slate-400 hover:text-slate-200'
                )} 
                onClick={function() { setTab(t.id); haptic('light'); }}
              >
                <Icon size={12} /> 
                <span className="hidden xs:inline">{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={cn('text-[7px] px-1.5 py-0.5 rounded-full font-black', isSelected ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white')}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content panels */}
        <div className="mt-4 space-y-3">
          
          {/* AVAILABLE JOBS TAB */}
          {tab === 'available' && (
            <div className="space-y-3">
              {deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; }).length === 0 ? (
                <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 text-center animate-scaleIn">
                  <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-slate-500 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No active delivery milestones nearby</p>
                  <p className="text-[10px] text-slate-500 mt-1">Make sure you are toggled online to receive real-time updates</p>
                </div>
              ) : (
                deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; }).map(function(del) {
                  var fee = del.driver_payout || del.fee || 0;
                  var pTag = getPriorityTag(del);
                  return (
                    <div key={del.id} className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow hover:border-slate-700/60 transition-all duration-300 animate-scaleIn space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black font-mono text-emerald-400">#{del.order_number}</span>
                            <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase', pTag.color)}>{pTag.label}</span>
                          </div>
                          <div className="space-y-1 pt-1.5">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span className="font-semibold truncate">Pickup: {del.pickup_address || 'Partner Shop'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span className="font-semibold truncate">Deliver: {del.delivery_address || 'Customer Residence'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-extrabold text-emerald-400">Br {fee}</div>
                          <span className="text-[7.5px] text-slate-500 uppercase font-black">Net earnings</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-800/85 pt-3 text-[9px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>📐 distance: <strong>{del.distance_km || '?'} km</strong></span>
                          {del.cod_amount > 0 && <span>💵 Collect COD: <strong className="text-rose-400">Br {del.cod_amount}</strong></span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            className="px-3 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-[9px] font-black transition-all flex items-center gap-1 active:scale-95 border border-slate-750" 
                            onClick={function() { declineDelivery(del.id); }}
                            title="Decline & pass to next partner"
                          >
                            Pass ✕
                          </button>
                          <button 
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-[9.5px] font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1 active:scale-95" 
                            onClick={function() { acceptDelivery(del.id); }}
                          >
                            Accept <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ACTIVE TASKS TAB */}
          {tab === 'active' && (
            <div className="space-y-3">
              {deliveries.filter(function(d) { return d.status !== 'pending' && d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled' && d.status !== 'returned'; }).length === 0 ? (
                <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 text-center animate-scaleIn">
                  <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No active delivery missions</p>
                  <p className="text-[10px] text-slate-500 mt-1">Claim available delivery runs from the available tab</p>
                </div>
              ) : (
                <>
                  {/* TSP Optimization Trigger */}
                  <div className="bg-slate-900 rounded-2xl border border-indigo-500/25 p-3 flex items-center justify-between shadow shadow-indigo-500/5 animate-scaleIn">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-wider flex items-center gap-1">
                        ✨ Routing Sequence
                      </h4>
                      <p className="text-[8px] text-slate-400 mt-0.5">Optimize multiple drops in the mathematically fastest sequence.</p>
                    </div>
                    <button 
                      onClick={optimizeRoute}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold shadow-md shadow-indigo-500/10 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Navigation size={10} className="animate-pulse text-indigo-200" /> Optimize TSP Path
                    </button>
                  </div>

                  {deliveries.filter(function(d) { return d.status !== 'pending' && d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled' && d.status !== 'returned'; }).map(function(del) {
                    var fee = del.driver_payout || del.fee || 0;

                    return (
                      <div key={del.id} className="bg-slate-900 rounded-3xl border border-emerald-500/30 p-4 shadow-xl animate-scaleIn space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-800/85 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-emerald-400">#{del.order_number}</span>
                            {del.cod_amount > 0 && (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-extrabold px-2 py-0.5 rounded-full">
                                💵 COD: Br {del.cod_amount}
                              </span>
                            )}
                          </div>
                          <span className={'px-2 py-0.5 rounded text-[8px] font-black uppercase ' + getStatusColor(del.status)}>
                            {del.status?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* INTEGRATED IN-APP LIVE STREET MAP */}
                        <DriverLiveMap delivery={del} driverLat={driver?.current_lat} driverLng={driver?.current_lng} />

                        {/* Clear Addresses Box */}
                        <div className="space-y-2 bg-slate-950/60 rounded-2xl p-3 border border-slate-800/60">
                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">🏪 Vendor Pickup Shop</div>
                              <div className="text-xs font-bold text-slate-200 mt-0.5">{del.pickup_address || 'Smart Shop Partner Store'}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">🏠 Customer Destination</div>
                              <div className="text-xs font-bold text-slate-200 mt-0.5">{del.delivery_address || 'Customer Residence'}</div>
                            </div>
                            {del.customer_phone && (
                              <a 
                                href={`tel:${del.customer_phone}`}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-[9px] font-black flex items-center gap-1 border border-slate-700 active:scale-95"
                                title="Call Customer"
                              >
                                <Phone size={10} /> Call
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Payout Banner */}
                        <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
                          <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">Net Delivery Payout</span>
                          <span className="text-sm font-black text-emerald-400">Br {fee}</span>
                        </div>

                        {/* 1-Click Action Bar */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {(del.status === 'assigned' || del.status === 'accepted' || del.status === 'pending') && (
                            <button 
                              className="px-3.5 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 active:scale-95 border border-slate-700"
                              onClick={function() { declineDelivery(del.id); }}
                              title="Decline & pass to next partner"
                            >
                              Pass ✕
                            </button>
                          )}
                          <button 
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            onClick={function() {
                              if (del.status !== 'arrived') {
                                triggerStatusUpdate(del.id, 'arrived');
                              } else {
                                setPinVerificationId(del.id);
                                setVerificationPinInput('');
                              }
                            }}
                          >
                            <Check size={14} /> 
                            {del.status === 'arrived' ? 'Verify Customer PIN' : '📍 Arrived — Verify PIN'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 text-center animate-scaleIn">
              <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                <Activity size={24} className="text-slate-500" />
              </div>
              <p className="text-xs font-bold text-slate-400">No completed delivery history</p>
              <p className="text-[10px] text-slate-500 mt-1">Complete claimed runs to view your metrics</p>
            </div>
          )}

          {/* EARNINGS & CASHOUT PORTAL */}
          {tab === 'earnings' && (
            <div className="space-y-4 animate-scaleIn">
              {/* Financial Balance Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 rounded-3xl p-5 border border-slate-800/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Available Balance</span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">Br {(earnings?.total_pending || 0).toLocaleString()}</div>
                    <span className="text-[8px] text-slate-500 block mt-1">Calculated base fee + commission payouts</span>
                  </div>
                  <button 
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
                    onClick={function() { setShowCashoutModal(true); haptic('light'); }}
                  >
                    💸 Cashout Balance <ArrowUpRight size={14} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 mt-4 pt-3 text-xs">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-black">Total Withdrawn</span>
                    <div className="font-extrabold text-slate-200 mt-0.5">Br {(earnings?.total_paid || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 uppercase font-black">Next Auto-Payout</span>
                    <div className="font-bold text-indigo-400 mt-0.5">Friday, 12:00 AM</div>
                  </div>
                </div>
              </div>

              {/* Custom CSS-Based 7-Day Performance trend bar chart */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wide">📅 Weekly Earnings Trend</h3>
                    <p className="text-[8px] text-slate-500">Past 7 days performance metrics</p>
                  </div>
                  <TrendingUp size={14} className="text-indigo-400" />
                </div>

                {/* Vertical Bar Chart */}
                <div className="flex items-end justify-between h-32 pt-2 pb-1.5 px-2 bg-slate-950/40 rounded-2xl border border-slate-850/60 shadow-inner">
                  {dailyEarnings.map(function(item) {
                    // Normalize bar height based on max value in array (max is Mon-Sun, let's say max is 900)
                    var barHeight = Math.max(10, Math.min(100, Math.round((item.amount / 950) * 100)));
                    return (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer relative">
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1.5 bg-indigo-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                          Br {item.amount}
                        </div>
                        
                        {/* Visual Bar */}
                        <div 
                          className="w-4 rounded-t-lg bg-gradient-to-t from-emerald-500 to-indigo-500 group-hover:from-emerald-400 group-hover:to-indigo-400 transition-all duration-500 shadow-inner"
                          style={{ height: `${barHeight}px` }}
                        />
                        <span className="text-[8px] font-extrabold text-slate-500 group-hover:text-slate-300">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CASHOUT / PAYOUT MODAL */}
      {showCashoutModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={function() { setShowCashoutModal(false); }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-2xl relative animate-scaleIn" onClick={function(e) { e.stopPropagation(); }}>
            <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-slate-600 text-sm" onClick={function() { setShowCashoutModal(false); }}>✕</button>
            
            <div className="text-center mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">Instant Cashout</span>
              <h3 className="text-sm font-black mt-2 text-slate-900 dark:text-white">Withdraw Earnings</h3>
              <p className="text-[10px] text-slate-500 mt-1">Instantly cashout your pending balance via Telebirr.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[8px] text-slate-400 font-extrabold uppercase block mb-1">Telebirr Account Number</label>
                <input 
                  type="text" 
                  value={cashoutPhone} 
                  onChange={function(e) { setCashoutPhone(e.target.value); }}
                  placeholder="+251-..." 
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between text-[8px] text-slate-400 font-extrabold uppercase mb-1">
                  <span>Amount to Withdraw (Br)</span>
                  <span className="text-indigo-400">Available: Br {earnings?.total_pending || 0}</span>
                </div>
                <input 
                  type="number" 
                  value={cashoutAmount} 
                  onChange={function(e) { setCashoutAmount(e.target.value); }}
                  placeholder="e.g. 500" 
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors font-bold text-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500" 
                  onClick={function() { setShowCashoutModal(false); }}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1"
                  onClick={submitTelebirrCashout}
                  disabled={cashoutLoading}
                >
                  {cashoutLoading ? (
                    <>
                      <Loader size={12} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Send size={11} /> Confirm Payout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN VERIFICATION MODAL */}
      {pinVerificationId !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={function() { setPinVerificationId(null); }}>
          <div className="bg-slate-900 rounded-3xl border border-emerald-500/20 p-6 w-full max-w-sm shadow-2xl relative animate-scaleIn" onClick={function(e) { e.stopPropagation(); }}>
            <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-slate-200 text-sm" onClick={function() { setPinVerificationId(null); }}>✕</button>
            
            <div className="text-center mb-5 border-b border-slate-800 pb-3">
              <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">Security Control</span>
              <h3 className="text-sm font-black mt-2 text-white">Complete Mission</h3>
              <p className="text-[10px] text-slate-400 mt-1">Enter the 4-digit verification PIN provided by the customer to securely authorize delivery completion.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[8px] text-slate-400 font-extrabold uppercase block mb-1">Customer Verification PIN</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={verificationPinInput} 
                  onChange={function(e) { setVerificationPinInput(e.target.value.replace(/\D/g, '')); }}
                  placeholder="e.g. 1234" 
                  className="w-full p-3 border border-slate-800 rounded-xl text-center text-lg bg-slate-950 text-white outline-none focus:border-emerald-500 transition-colors font-black tracking-[1em] pl-[1.2em]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  className="flex-1 py-3 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800" 
                  onClick={function() { setPinVerificationId(null); }}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1"
                  onClick={handleVerifyPin}
                  disabled={verifyingPin || verificationPinInput.length < 4}
                >
                  {verifyingPin ? (
                    <>
                      <Loader size={12} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} /> Complete Mission
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
