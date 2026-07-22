/**
 * Smart Shop — SLA Monitor & Auto-Escalation Engine
 * 
 * Monitors order fulfillment time against configurable SLAs.
 * Auto-escalates when thresholds are breached.
 * Generates alerts for admin + vendor notifications.
 */

import { getFulfillments, upsertFulfillment, FULFILLMENT_STATUSES, type OrderFulfillment, type FulfillmentStatus } from './orderFulfillment';
import { generateId } from './utils';

// ============================================================
// Types
// ============================================================

export type Severity = 'info' | 'warning' | 'critical';

export interface SLAConfig {
  /** Status this SLA applies to */
  status: FulfillmentStatus;
  /** Maximum hours allowed in this status */
  maxHours: number;
  /** Label for display */
  label: string;
  /** Severity when breached */
  severity: Severity;
}

export interface SLAAlert {
  id: string;
  orderNumber: string;
  status: FulfillmentStatus;
  statusLabel: string;
  message: string;
  severity: Severity;
  elapsedHours: number;
  maxHours: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

// ============================================================
// Default SLA Configuration
// ============================================================

export const DEFAULT_SLA_CONFIG: SLAConfig[] = [
  { status: 'awaiting_vendor',   maxHours: 24, label: 'Vendor Confirmation', severity: 'warning' },
  { status: 'vendor_accepted',   maxHours: 48, label: 'Vendor Preparation',  severity: 'warning' },
  { status: 'vendor_shipped',    maxHours: 72, label: 'Shipping to Hub',     severity: 'info' },
  { status: 'quality_check',     maxHours: 12, label: 'Quality Check',       severity: 'info' },
  { status: 'in_transit',        maxHours: 72, label: 'In Transit',          severity: 'warning' },
  { status: 'out_for_delivery',  maxHours: 8,  label: 'Last Mile Delivery',  severity: 'critical' },
  { status: 'pending_payment',   maxHours: 2,  label: 'Payment Pending',     severity: 'critical' },
];

// ============================================================
// SLA Storage
// ============================================================

const ALERTS_KEY = 'ss_sla_alerts';
const CONFIG_KEY = 'ss_sla_config';

export function getSLAConfig(): SLAConfig[] {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SLA_CONFIG;
  } catch { return DEFAULT_SLA_CONFIG; }
}

export function saveSLAConfig(config: SLAConfig[]): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch {}
}

export function getSLAAlerts(): SLAAlert[] {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; }
}

function saveSLAAlerts(alerts: SLAAlert[]): void {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 100))); } catch {}
}

// ============================================================
// SLA Check Engine
// ============================================================

export function runSLACheck(): { newAlerts: SLAAlert[]; totals: { info: number; warning: number; critical: number } } {
  const fulfillments = getFulfillments();
  const config = getSLAConfig();
  const existingAlerts = getSLAAlerts();
  const newAlerts: SLAAlert[] = [];
  const now = Date.now();

  fulfillments.forEach(f => {
    // Skip completed/cancelled/refunded
    if (['completed', 'cancelled', 'refunded'].includes(f.status)) return;

    // Find the last event for this status
    const lastEvent = [...f.events].reverse().find(e => e.status === f.status);
    if (!lastEvent) return;

    const elapsedMs = now - new Date(lastEvent.timestamp).getTime();
    const elapsedHours = elapsedMs / 3600000;

    // Find matching SLA config
    const sla = config.find(c => c.status === f.status);
    if (!sla || elapsedHours < sla.maxHours) return;

    // Check if we already alerted for this
    const alreadyAlerted = existingAlerts.some(a =>
      a.orderNumber === f.orderNumber && a.status === f.status && !a.resolved
    );
    if (alreadyAlerted) return;

    const alert: SLAAlert = {
      id: generateId(),
      orderNumber: f.orderNumber,
      status: f.status,
      statusLabel: FULFILLMENT_STATUSES[f.status]?.label || f.status,
      message: `Order ${f.orderNumber} has been in "${FULFILLMENT_STATUSES[f.status]?.label || f.status}" for ${Math.round(elapsedHours)}h (max: ${sla.maxHours}h)`,
      severity: sla.severity,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      maxHours: sla.maxHours,
      timestamp: now.toString(),
      resolved: false,
    };
    newAlerts.push(alert);
  });

  const allAlerts = [...newAlerts, ...existingAlerts];
  saveSLAAlerts(allAlerts);

  const totals = {
    info: allAlerts.filter(a => !a.resolved && a.severity === 'info').length,
    warning: allAlerts.filter(a => !a.resolved && a.severity === 'warning').length,
    critical: allAlerts.filter(a => !a.resolved && a.severity === 'critical').length,
  };

  return { newAlerts, totals };
}

export function resolveSLAAlert(alertId: string): void {
  const alerts = getSLAAlerts();
  const updated = alerts.map(a =>
    a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a
  );
  saveSLAAlerts(updated);
}

export function resolveAllSLAAlerts(): void {
  const alerts = getSLAAlerts().map(a => ({ ...a, resolved: true, resolvedAt: new Date().toISOString() }));
  saveSLAAlerts(alerts);
}

/** Get sla breach status for a fulfillment */
export function getSLABreachStatus(fulfillment: OrderFulfillment): { breached: boolean; level: Severity | null; hoursOver: number } | null {
  const config = getSLAConfig();
  const sla = config.find(c => c.status === fulfillment.status);
  if (!sla) return null;

  const lastEvent = [...fulfillment.events].reverse().find(e => e.status === fulfillment.status);
  if (!lastEvent) return null;

  const elapsed = (Date.now() - new Date(lastEvent.timestamp).getTime()) / 3600000;
  if (elapsed < sla.maxHours) return null;

  return { breached: true, level: sla.severity, hoursOver: Math.round((elapsed - sla.maxHours) * 10) / 10 };
}
