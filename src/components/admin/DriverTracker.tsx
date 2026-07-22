/**
 * Smart Shop — Driver Live Tracking Dashboard
 * 
 * Real-time driver location visualization with map simulation.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getFulfillments, transitionFulfillment, upsertFulfillment, FULFILLMENT_STATUSES, type FulfillmentStatus } from '@/lib/orderFulfillment';
import {
  getAllTracking, createDriverTracking, saveTracking, simulateDriverMove,
  getTracking, formatETA, formatDistance, type DriverTracking,
} from '@/lib/driverTracking';
import { useStore } from '@/stores/AppStore';
import { Truck, MapPin, Navigation, Phone, User, Clock, ChevronRight, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function DriverTracker() {
  const [trackings, setTrackings] = useState<Record<string, DriverTracking>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const refresh = useCallback(() => {
    setTrackings(getAllTracking());
  }, []);

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-update all active trackings
      const all = getAllTracking();
      Object.keys(all).forEach(on => simulateDriverMove(on));
      setTrackings(getAllTracking());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const startTracking = (orderNumber: string, city: string) => {
    const tracking = createDriverTracking(orderNumber, city);
    saveTracking(tracking);
    setTrackings(getAllTracking());
    toast(`🚚 Driver assigned to order ${orderNumber}`, 'success');
  };

  const simulateStep = (orderNumber: string) => {
    const updated = simulateDriverMove(orderNumber);
    if (updated) {
      setTrackings(getAllTracking());
      setSelected(orderNumber);
      if (updated.status === 'delivered') {
        toast(`🏠 Order ${orderNumber} has been delivered!`, 'success');
        const f = getFulfillments().find(f => f.orderNumber === orderNumber);
        if (f) {
          const delivered = transitionFulfillment(f, 'delivered' as FulfillmentStatus, 'delivery');
          upsertFulfillment(delivered);
        }
      }
    }
  };

  const fulfillments = getFulfillments().filter(f => f.status === 'in_transit' || f.status === 'out_for_delivery');
  const activeTracking = selected ? trackings[selected] : null;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Truck size={20} className="text-emerald-500" /> Driver Tracking</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{Object.keys(trackings).length} active · Live updates every 5s</p>
        </div>
        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-medium flex items-center gap-1" onClick={refresh}><RefreshCw size={11} /> Refresh</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order List */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {fulfillments.length === 0 && Object.keys(trackings).length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <Truck size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-500 font-semibold">No active deliveries</p>
              <p className="text-[9px] text-slate-400 mt-1">Orders in transit will appear here</p>
            </div>
          )}

          {fulfillments.map(f => {
            const track = trackings[f.orderNumber];
            return (
              <div key={f.orderNumber} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-3 cursor-pointer transition-all hover:shadow-md', selected === f.orderNumber ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-800')} onClick={() => setSelected(f.orderNumber)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono text-indigo-600">{f.orderNumber}</span>
                  {track ? (
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', track.status === 'arrived' || track.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>{track.status.replace(/_/g, ' ')}</span>
                  ) : (
                    <button className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-bold" onClick={e => { e.stopPropagation(); startTracking(f.orderNumber, f.vendors[0]?.vendorName ? 'Addis Ababa' : 'Addis Ababa'); }}>Start Tracking</button>
                  )}
                </div>
                {track && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <User size={9} /> {track.driver.name}
                    <span>·</span>
                    <Navigation size={9} className="text-emerald-500" /> {track.progress}%
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${track.progress}%` }} />
                    </div>
                  </div>
                )}
                {!track && (
                  <div className="text-[9px] text-slate-400 flex items-center gap-1">
                    <MapPin size={9} /> {f.vendors.map(v => v.vendorName).join(', ')}
                  </div>
                )}
              </div>
            );
          })}

          {/* Existing trackings */}
          {Object.entries(trackings).map(([on, t]) => {
            if (fulfillments.find(f => f.orderNumber === on)) return null;
            return (
              <div key={on} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-3 cursor-pointer transition-all hover:shadow-md opacity-70', selected === on ? 'border-emerald-500' : 'border-slate-200')} onClick={() => setSelected(on)}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-indigo-600">{on}</span>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', t.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>{t.status}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">{t.driver.name} · {t.destination.label} · {t.progress}% complete</div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          {activeTracking ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-indigo-600">{activeTracking.orderNumber}</h3>
                <div className="flex gap-1">
                  {activeTracking.status !== 'delivered' && (
                    <button className="px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1" onClick={() => simulateStep(activeTracking.orderNumber)}>
                      <Play size={10} /> Simulate Move
                    </button>
                  )}
                </div>
              </div>

              {/* Map Visualization */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl h-48 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                {/* Destination */}
                <div className="absolute bottom-4 right-4 flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                  <div className="bg-white/90 text-[7px] font-bold px-1.5 py-0.5 rounded text-slate-800 mt-0.5">📍 {activeTracking.destination.label}</div>
                </div>
                {/* Driver */}
                <div className="absolute" style={{ top: `${60 - activeTracking.progress * 0.3}%`, left: `${30 + activeTracking.progress * 0.3}%` }}>
                  <div className="flex flex-col items-center animate-float">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><Truck size={10} className="text-white" /></div>
                    <div className="mt-0.5 bg-emerald-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">🚚 {activeTracking.driver.name}</div>
                  </div>
                </div>
                {/* Route line */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 180">
                  <path d="M 60 120 Q 120 40 220 60" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeDasharray="6 4" />
                  <circle cx="60" cy="120" r="3" fill="#10B981" />
                  <circle cx="220" cy="60" r="3" fill="#EF4444" />
                </svg>
                {/* Progress overlay */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-[9px]">
                  <div className="flex items-center gap-1.5"><Navigation size={10} className="text-emerald-400" /> ETA: {formatETA(activeTracking.estimatedDuration)}</div>
                  <div className="text-[8px] opacity-70">{formatDistance(activeTracking.estimatedDistance)} away</div>
                </div>
              </div>

              {/* Driver Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver</h4>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">{activeTracking.driver.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{activeTracking.driver.name}</div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1"><Phone size={9} /> {activeTracking.driver.phone}</div>
                  </div>
                  <div className="text-right text-[9px]">
                    <div className="font-semibold text-amber-500">★ {activeTracking.driver.rating}</div>
                    <div className="text-slate-400">{activeTracking.driver.totalDeliveries} deliveries</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[9px]">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5"><span className="text-slate-400">Vehicle</span><div className="font-semibold">{activeTracking.driver.vehicleType}</div></div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5"><span className="text-slate-400">Plate</span><div className="font-semibold">{activeTracking.driver.plateNumber}</div></div>
                </div>
              </div>

              {/* Trip Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-[10px]">
                  <div className="text-slate-400">From</div>
                  <div className="font-semibold">{activeTracking.origin.label}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-[10px]">
                  <div className="text-slate-400">To</div>
                  <div className="font-semibold">{activeTracking.destination.label}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-emerald-600">{activeTracking.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500" style={{ width: `${activeTracking.progress}%` }} />
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                  <span>{activeTracking.origin.label}</span>
                  <span>{activeTracking.destination.label}</span>
                </div>
              </div>

              {/* Route Timeline */}
              <details>
                <summary className="text-[9px] font-semibold text-slate-500 cursor-pointer">Route History ({activeTracking.route.length} points)</summary>
                <div className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                  {activeTracking.route.slice(-10).map((p, i) => (
                    <div key={i} className="text-[8px] text-slate-400 flex items-center gap-1">
                      <MapPin size={7} />
                      <span>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
                      <span className="flex-1 text-right">{new Date(p.timestamp).toLocaleTimeString()}</span>
                      {p.speed && <span>{Math.round(p.speed)} km/h</span>}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              <Truck size={32} className="mx-auto mb-2 text-slate-300" />
              Select an order to view live tracking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
