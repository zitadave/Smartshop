/**
 * Smart Shop — SLA Monitor Dashboard
 * 
 * Displays active SLA breaches, configurable thresholds,
 * and auto-escalation controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getFulfillments, FULFILLMENT_STATUSES, type OrderFulfillment } from '@/lib/orderFulfillment';
import {
  runSLACheck, resolveSLAAlert, resolveAllSLAAlerts,
  getSLAAlerts, getSLAConfig, saveSLAConfig,
  DEFAULT_SLA_CONFIG, type SLAAlert, type SLAConfig, type Severity,
} from '@/lib/slaMonitor';
import { AlertTriangle, Clock, CheckCircle, Bell, Settings, RefreshCw, ChevronRight, X } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function SLAMonitor() {
  const [alerts, setAlerts] = useState<SLAAlert[]>([]);
  const [config, setConfig] = useState<SLAConfig[]>(getSLAConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [totals, setTotals] = useState({ info: 0, warning: 0, critical: 0 });

  const refresh = useCallback(() => {
    const result = runSLACheck();
    setAlerts(getSLAAlerts());
    setTotals(result.totals);
  }, []);

  useEffect(() => { refresh(); }, []);
  useEffect(() => { const interval = setInterval(refresh, 30000); return () => clearInterval(interval); }, [refresh]);

  const handleResolve = (id: string) => {
    resolveSLAAlert(id);
    setAlerts(getSLAAlerts());
  };

  const handleResolveAll = () => {
    resolveAllSLAAlerts();
    setAlerts(getSLAAlerts());
    toast('✅ All SLA alerts resolved', 'success');
  };

  const updateConfigItem = (idx: number, field: keyof SLAConfig, val: any) => {
    const updated = [...config];
    (updated[idx] as any)[field] = val;
    setConfig(updated);
    saveSLAConfig(updated);
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const severityColors: Record<Severity, string> = { info: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200', warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200', critical: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200' };

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> SLA Monitor</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Auto-escalation engine — monitors order fulfillment times</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-medium flex items-center gap-1" onClick={refresh}><RefreshCw size={11} /> Refresh</button>
          <button className={cn('px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1', showConfig ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800')} onClick={() => setShowConfig(!showConfig)}><Settings size={11} /> SLA Settings</button>
          {activeAlerts.length > 0 && <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-medium flex items-center gap-1" onClick={handleResolveAll}><CheckCircle size={11} /> Resolve All</button>}
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Critical', count: totals.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: AlertTriangle },
          { label: 'Warning', count: totals.warning, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Clock },
          { label: 'Info', count: totals.info, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: Bell },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={cn('rounded-2xl border p-4', s.bg, 'border-current/20')}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={s.color} />
                <span className={cn('text-2xl font-extrabold', s.color)}>{s.count}</span>
              </div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* SLA Config Panel */}
      {showConfig && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-slideDown">
          <h3 className="text-sm font-bold mb-3">SLA Thresholds (hours per status)</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {config.map((sla, i) => (
              <div key={sla.status} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[9px] font-medium flex-1">{sla.label}</span>
                <input type="number" className="w-14 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-center" value={sla.maxHours} onChange={e => updateConfigItem(i, 'maxHours', Number(e.target.value))} min={1} />
                <span className="text-[8px] text-slate-400">h</span>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-slate-400 mt-2">Changes save automatically. Set to 0 to disable monitoring for a status.</p>
        </div>
      )}

      {/* Active Alerts */}
      <div className="space-y-1.5">
        {activeAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p className="text-xs font-semibold text-slate-500">All SLAs are on track</p>
            <p className="text-[9px] text-slate-400 mt-1">No orders have breached their time thresholds</p>
          </div>
        ) : (
          activeAlerts.slice(0, 20).map(alert => (
            <div key={alert.id} className={cn('rounded-2xl border p-3 transition-all', severityColors[alert.severity])}>
              <div className="flex items-start gap-2.5">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', alert.severity === 'critical' ? 'bg-red-100' : alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100')}>
                  {alert.severity === 'critical' ? <AlertTriangle size={14} className="text-red-600" /> : alert.severity === 'warning' ? <Clock size={14} className="text-amber-600" /> : <Bell size={14} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold font-mono text-indigo-600">{alert.orderNumber}</div>
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', alert.severity === 'critical' ? 'bg-red-200 text-red-800' : alert.severity === 'warning' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800')}>{alert.severity.toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] mt-0.5">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                    <span>{FULFILLMENT_STATUSES[alert.status]?.icon} {alert.statusLabel}</span>
                    <span>·</span>
                    <span>{alert.elapsedHours}h elapsed / {alert.maxHours}h max</span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[80px]">
                      <div className={cn('h-full rounded-full', alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500')}
                        style={{ width: `${Math.min(100, (alert.elapsedHours / alert.maxHours) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-white/50 rounded-lg transition-colors" onClick={() => handleResolve(alert.id)}><X size={12} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolved Alerts */}
      {alerts.filter(a => a.resolved).length > 0 && (
        <details className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <summary className="text-[10px] font-semibold cursor-pointer">{alerts.filter(a => a.resolved).length} resolved alerts</summary>
          <div className="mt-2 space-y-1">
            {alerts.filter(a => a.resolved).slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-2 py-1 text-[9px] text-slate-400">
                <CheckCircle size={9} className="text-green-500" />
                <span className="font-mono text-indigo-400">{a.orderNumber}</span>
                <span className="flex-1">{a.message.substring(0, 60)}...</span>
                <span>{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
