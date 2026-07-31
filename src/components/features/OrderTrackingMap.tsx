import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
import { MapPin, Truck, Package, CheckCircle, Clock, Navigation, Phone, Map as MapIcon, ChevronDown, ChevronUp, Loader } from 'lucide-react';

interface OrderTrackingMapProps {
  orderNumber: string;
  compact?: boolean;
}

interface TimelineStep {
  label: string;
  time: string;
  completed: boolean;
  location?: string;
  icon: string;
}

const DEFAULT_TIMELINE: TimelineStep[] = [
  { label: 'Order Placed', time: 'Today, 10:30 AM', completed: true, icon: '📋' },
  { label: 'Processing', time: 'Today, 2:15 PM', completed: true, icon: '📦' },
  { label: 'In Transit', time: 'Tomorrow, 8:00 AM', completed: false, icon: '🚚' },
  { label: 'Out for Delivery', time: 'Tomorrow, 2:00 PM', completed: false, icon: '🚚' },
  { label: 'Delivered', time: 'Tomorrow, 6:00 PM', completed: false, icon: '🏠' },
];

export default function OrderTrackingMap({ orderNumber, compact }: OrderTrackingMapProps) {
  const { orders, orderTracking } = useStore();
  const order = orders.find(o => o.orderNumber === orderNumber);
  const [expanded, setExpanded] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [delivery, setDelivery] = useState<any>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const verifyPinCustomer = async () => {
    if (!delivery || !pinInput) return;
    try {
      const res = await fetch('/api/delivery/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: delivery.id, pin: pinInput }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        alert('🎉 PIN Verified! Your delivery is complete and escrow payment has been released.');
        window.location.reload();
      } else {
        alert('❌ Incorrect PIN. Please try again.');
      }
    } catch {
      alert('Error verifying PIN.');
    }
  };

  // Dynamic CDN loader for Leaflet
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

  // Poll real-time backend driver coordinates & status
  useEffect(() => {
    if (!orderNumber) return;

    const fetchLiveTracking = () => {
      fetch(`/api/delivery/tracking/${orderNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.delivery) {
            setDelivery(data.delivery);
          }
          setLoadingLive(false);
        })
        .catch(() => {
          setLoadingLive(false);
        });
    };

    fetchLiveTracking();
    const interval = setInterval(fetchLiveTracking, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [orderNumber]);

  // Fallback simulated status loop
  useEffect(() => {
    if (delivery) return; // Use actual db status if available
    const statuses = ['Order received', 'Preparing your order', 'Quality check', 'Handed to courier', 'In transit', 'Arrived at sorting center', 'Out for delivery'];
    let idx = 0;
    const interval = setInterval(() => {
      setLiveStatus(statuses[idx % statuses.length]);
      idx++;
    }, 15000);
    return () => clearInterval(interval);
  }, [delivery]);

  // Dynamic Map renderer
  useEffect(() => {
    if (!mapLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    const cLat = delivery?.delivery_lat || 9.0315;
    const cLng = delivery?.delivery_lng || 38.7485;

    const container = L.DomUtil.get('leaflet-map');
    if (container) {
      container._leaflet_id = null;
    }

    try {
      const map = L.map('leaflet-map', {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      const homeIcon = L.divIcon({
        className: 'custom-home-icon',
        html: `<div class="w-8 h-8 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-sm">📍</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const customerMarker = L.marker([cLat, cLng], { icon: homeIcon }).addTo(map);

      const hasDriver = !!(delivery?.driver);
      if (hasDriver) {
        const dLat = Number(delivery.driver.current_lat) || 9.03;
        const dLng = Number(delivery.driver.current_lng) || 38.74;

        const isHeadingToPickup = ['assigned', 'accepted', 'at_vendor'].includes(delivery.status);
        const destLat = isHeadingToPickup ? (Number(delivery.pickup_lat) || 9.0315) : cLat;
        const destLng = isHeadingToPickup ? (Number(delivery.pickup_lng) || 38.7485) : cLng;

        // Render storefront marker if heading to pickup
        let storeMarker: any = null;
        if (isHeadingToPickup) {
          const storeIcon = L.divIcon({
            className: 'custom-store-icon',
            html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-sm">🏪</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          storeMarker = L.marker([destLat, destLng], { icon: storeIcon }).addTo(map);
        }

        const motorIcon = L.divIcon({
          className: 'custom-motor-icon',
          html: `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-sm">🏍️</span></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const driverMarker = L.marker([dLat, dLng], { icon: motorIcon }).addTo(map);

        // Fetch high-accuracy street routing path from OSRM
        fetch(`https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${destLng},${destLat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data && data.routes && data.routes[0]) {
              const coordinates = data.routes[0].geometry.coordinates;
              const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
              
              // Draw solid route line
              const routeLine = L.polyline(latLngs, {
                color: '#6366F1',
                weight: 4,
                opacity: 0.95
              }).addTo(map);

              // Draw pulsing glow line overlay
              L.polyline(latLngs, {
                color: '#818CF8',
                weight: 8,
                opacity: 0.35
              }).addTo(map);

              const markers = [driverMarker, customerMarker];
              if (storeMarker) markers.push(storeMarker);
              const group = new L.featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.15));
            } else {
              throw new Error('No OSRM route found');
            }
          })
          .catch(() => {
            // Graceful fallback to straight line
            const routeLine = L.polyline([[dLat, dLng], [destLat, destLng]], {
              color: '#6366F1',
              weight: 3,
              opacity: 0.85,
              dashArray: '8, 8'
            }).addTo(map);

            const markers = [driverMarker, customerMarker];
            if (storeMarker) markers.push(storeMarker);
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
          });
      } else {
        map.setView([cLat, cLng], 15);
      }

      return () => {
        map.remove();
      };
    } catch {}
  }, [mapLoaded, delivery]);

  if (!order) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground bg-card rounded-xl border border-border p-4">
        <MapIcon size={24} className="mx-auto mb-1 opacity-40 text-muted-foreground animate-pulse" />
        Order not found
      </div>
    );
  }

  // Dynamic Driver Information
  const hasLiveDriver = !!(delivery?.driver);
  const driverName = delivery?.driver?.full_name_latin || 'Abebe K.';
  const driverPhone = delivery?.driver?.phone || '+251-911-123456';
  const vehicleType = delivery?.driver?.vehicle_type || 'Motorcycle';
  const licensePlate = delivery?.driver?.license_plate || 'AA-1234';

  // Live map coordinates (use real driver coordinates if available, else simulate)
  const driverLat = delivery?.driver?.current_lat || 9.0320 + (Math.sin(Date.now() / 15000) * 0.015);
  const driverLng = delivery?.driver?.current_lng || 38.7469 + (Math.cos(Date.now() / 15000) * 0.015);

  const statusLabels: Record<string, string> = {
    pending: 'Searching for an express driver...',
    assigned: 'Driver assigned, preparing pickup',
    accepted: 'Driver is heading to the store',
    at_vendor: 'Driver is at the store picking up items',
    picked_up: 'Order picked up from vendor',
    in_transit: 'Driver is on their way to you',
    arrived: 'Driver has arrived at your location!',
    delivered: 'Delivered successfully! Thank you.',
    failed: 'Delivery failed',
    cancelled: 'Delivery cancelled'
  };

  const statusText = delivery ? (statusLabels[delivery.status] || delivery.status) : (
    order?.status === 'pending_approval' ? 'Awaiting manual payment approval' :
    order?.status === 'pending_payment' ? 'Awaiting payment transfer details' :
    order?.status === 'confirmed' ? 'Payment confirmed, processing order' :
    order?.status === 'processing' ? 'Order being prepared' :
    'Order received'
  );

  // Dynamically map timeline steps based on backend DB status or order status
  const getDynamicTimeline = (): TimelineStep[] => {
    const isPlaced = true;
    const isAwaitingApproval = order?.status === 'pending_approval';
    const isAwaitingPayment = order?.status === 'pending_payment';
    const isConfirmed = order?.status === 'confirmed' || order?.status === 'processing' || order?.status === 'shipped' || order?.status === 'delivered' || order?.status === 'completed';
    const isProcessing = order?.status === 'processing' || order?.status === 'shipped' || order?.status === 'delivered' || order?.status === 'completed';
    const isInTransit = order?.status === 'shipped' || order?.status === 'delivered' || order?.status === 'completed';
    const isDelivered = order?.status === 'delivered' || order?.status === 'completed';

    const formatTime = (isoString?: string) => {
      if (!isoString) return 'Pending';
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const placedTime = order?.createdAt ? formatTime(order.createdAt) : 'Today';

    return [
      { label: 'Order Placed', time: placedTime, completed: true, icon: '📋' },
      { label: isAwaitingApproval ? 'Payment Review' : isAwaitingPayment ? 'Awaiting Payment' : 'Confirmed', time: isConfirmed ? 'Completed' : isAwaitingApproval ? 'Reviewing' : 'Pending', completed: isConfirmed, icon: '💳' },
      { label: 'Processing', time: isProcessing ? 'Completed' : 'Pending', completed: isProcessing, icon: '📦' },
      { label: 'In Transit', time: isInTransit ? 'Shipped' : 'Pending', completed: isInTransit, icon: '🚚' },
      { label: 'Delivered', time: isDelivered ? 'Delivered' : 'Pending', completed: isDelivered, icon: '🏠' },
    ];
  };

  const timeline = getDynamicTimeline();

  const content = (
    <div className="space-y-3 animate-fadeUp">
      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-xl p-3 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Truck size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold flex items-center gap-1.5">
              Live Express Delivery
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-ping" />
            </div>
            <div className="text-[10px] opacity-90 mt-0.5 truncate capitalize">{statusText}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[9px] opacity-85">ETA</div>
            <div className="text-xs font-bold">{delivery?.status === 'delivered' ? 'Arrived' : (delivery ? '30 mins' : 'Tomorrow')}</div>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative rounded-2xl overflow-hidden h-52 border border-slate-800 shadow-inner bg-slate-950">
        {/* Real Leaflet Map Container */}
        <div id="leaflet-map" style={{ height: '100%', width: '100%', borderRadius: '1rem' }} />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-400 gap-2 z-10 rounded-2xl">
            <Loader className="animate-spin text-indigo-500" size={16} />
            <span>Loading high-precision street map...</span>
          </div>
        )}

        {/* Driver overlay card */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-white flex items-center justify-between shadow-lg z-[1000]">
          {hasLiveDriver ? (
            <>
              <div>
                <div className="flex items-center gap-1.5">
                  <Navigation size={11} className="text-indigo-400 animate-pulse" />
                  <span className="font-extrabold text-[10px] text-slate-100">{driverName}</span>
                  <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold uppercase">{vehicleType}</span>
                </div>
                <div className="text-[8px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>Plate: <strong className="text-slate-200">{licensePlate}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[8px] text-emerald-400 font-bold">GPS Linked</span>
                </div>
              </div>
              <a 
                href={`tel:${driverPhone}`}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-[0.95]"
              >
                <Phone size={10} /> Call
              </a>
            </>
          ) : (
            <div className="w-full text-center py-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-200">
                <Loader className="animate-spin text-indigo-400" size={10} />
                {order?.status === 'pending_approval' ? (
                  <span>Awaiting Payment Approval</span>
                ) : order?.status === 'pending_payment' ? (
                  <span>Awaiting Payment Submission</span>
                ) : order?.status === 'processing' ? (
                  <span>Vendor Preparing Package</span>
                ) : (
                  <span>Securing Express Courier...</span>
                )}
              </div>
              <p className="text-[8px] text-slate-400 mt-1">
                {order?.status === 'pending_approval' ? (
                  "Your manual bank transfer is currently being verified by our finance team."
                ) : order?.status === 'pending_payment' ? (
                  "Please submit your payment receipt details in the Manual Payment section."
                ) : order?.status === 'processing' ? (
                  "The store is packaging your items. We will assign a driver shortly."
                ) : (
                  "We are searching for the nearest online express delivery partner."
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline steps */}
      <div className="bg-card rounded-2xl border border-border p-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Package size={12} className="text-indigo-500" /> Delivery Milestone Status
        </h4>
        <div className="space-y-0 pl-1.5">
          {timeline.map((step, i) => {
            const isCompleted = step.completed;
            const isCurrent = !step.completed && (i === 0 || timeline[i - 1].completed);
            return (
              <div key={i} className="flex gap-3 pb-3 relative last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 border-2',
                    isCompleted && 'bg-emerald-50 border-emerald-400 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800',
                    isCurrent && 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800 animate-pulse',
                    !isCompleted && !isCurrent && 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                  )}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-full mt-1',
                      isCompleted ? 'bg-emerald-400 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-800'
                    )} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className={cn(
                    'text-[10px] font-bold',
                    isCompleted && 'text-emerald-700 dark:text-emerald-400',
                    isCurrent && 'text-indigo-700 dark:text-indigo-400',
                    !isCompleted && !isCurrent && 'text-slate-400 dark:text-slate-600'
                  )}>
                    {step.label}
                  </div>
                  <div className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.time}
                    {step.location && ` · ${step.location}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security PIN Card */}
      {delivery?.delivery_pin && delivery?.status !== 'delivered' && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-500/30 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              🔐 Escrow Delivery Security PIN
            </span>
            <span className="font-mono text-sm font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg shadow-sm">
              {delivery.delivery_pin}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Provide this 4-digit PIN to your driver upon arrival to confirm package receipt and release escrow payment to the courier & seller.
          </p>
        </div>
      )}

      {/* Interactive Customer PIN Confirmation */}
      {delivery?.delivery_pin && delivery?.status !== 'delivered' && (
        <div className="bg-card rounded-2xl border-2 border-indigo-500/30 p-4 shadow-md space-y-2.5">
          <div className="text-xs font-black text-foreground flex items-center gap-1.5">
            <span>🛡️ Confirm Package Receipt</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Enter your 4-digit security PIN (<code className="font-mono font-bold text-indigo-500">{delivery.delivery_pin}</code>) below to confirm receipt of your items and release escrow payment:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              placeholder="PIN (4 digits)"
              className="w-28 p-2 text-center font-mono font-black text-sm bg-background border border-border rounded-xl outline-none focus:border-indigo-500"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button
              className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
              onClick={verifyPinCustomer}
            >
              ✔️ Confirm Receipt & Release Payout
            </button>
          </div>
        </div>
      )}

      {/* Technical Delivery Logistics */}
      <div className="bg-card rounded-2xl border border-border p-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Logistic Carrier</div>
            <div className="font-extrabold text-foreground mt-0.5">{delivery ? 'Smartshop Express Fleet' : 'Ethio Express'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Waybill Tracking #</div>
            <div className="font-mono font-extrabold text-foreground mt-0.5">{delivery?.order_number || orderNumber}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Service Zone</div>
            <div className="font-extrabold text-foreground mt-0.5">{order.customer?.city || 'Addis Ababa'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Waybill Contact</div>
            <div className="font-extrabold text-foreground mt-0.5">{order.customer?.phone || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-1.5">
            <MapIcon size={14} className="text-indigo-500" /> Express Live Tracking
          </span>
          <span className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full font-bold">
            {delivery ? (statusLabels[delivery.status] || delivery.status) : 'Simulated'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {expanded && <div className="px-3.5 pb-3.5">{content}</div>}
      </div>
    );
  }

  return content;
}

/** Simple progress bar for order tracking */
export function OrderProgressBar({ status }: { status: string }) {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
  const currentIdx = steps.indexOf(status);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / steps.length) * 100 : 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground font-bold">{Math.round(progress)}%</span>
    </div>
  );
}
