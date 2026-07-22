/**
 * Smart Shop — Comprehensive Vendor Receipt & 24h Dispute Timer
 * Amazon/Alibaba style for Ethiopian compliance
 */
import { calculateTaxBreakdown } from './tax';
import { formatPrice } from './utils';

export const DISPUTE_PERIOD_HOURS = 24;
export const DISPUTE_PERIOD_MS = DISPUTE_PERIOD_HOURS * 60 * 60 * 1000;

export function getDisputeDeadline(deliveredAt: string): Date {
  return new Date(new Date(deliveredAt).getTime() + DISPUTE_PERIOD_MS);
}

export function isInDisputePeriod(deliveredAt: string): boolean {
  return Date.now() < getDisputeDeadline(deliveredAt).getTime();
}

export function getDisputeRemaining(deliveredAt: string): string {
  const remaining = getDisputeDeadline(deliveredAt).getTime() - Date.now();
  if (remaining <= 0) return 'Dispute period ended';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

export function generateVendorReceipt(params: {
  receiptNumber: string;
  date: string;
  orderNumber: string;
  vendorName: string;
  vendorTIN?: string;
  vendorAddress: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number; total: number; sku?: string }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentReference: string;
  commissionRate: number;
  deliveryAddress: string;
  vendorNotes?: string;
}) {
  const tax = calculateTaxBreakdown({ productPrice: params.subtotal, deliveryFee: params.deliveryFee, commissionRate: params.commissionRate });
  const disputeDeadline = new Date(Date.now() + DISPUTE_PERIOD_MS);
  const itemsHtml = params.items.map(i => `<tr>
    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px">${i.name}${i.sku ? '<br><span style="font-size:8px;color:#9ca3af">SKU: ' + i.sku + '</span>' : ''}</td>
    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${i.quantity}</td>
    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">Br ${i.price.toLocaleString()}</td>
    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">Br ${i.total.toLocaleString()}</td>
  </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${params.orderNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;padding:20px;color:#1f2937}
  .receipt{max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .header{background:linear-gradient(135deg,#1e3a5f,#0f2137);padding:24px;color:white}
  .header h1{font-size:20px;font-weight:700;margin-bottom:2px}
  .header .meta{font-size:10px;opacity:0.8;margin-top:4px}
  .body{padding:16px 20px}
  .section{margin-bottom:14px}
  .st{font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;font-weight:600;border-bottom:1px dashed #e5e7eb;padding-bottom:4px;margin-bottom:6px}
  .row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
  .row .lbl{color:#6b7280}
  .row .val{font-weight:500}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{text-align:left;font-size:9px;text-transform:uppercase;color:#9ca3af;font-weight:600;padding:6px 8px;border-bottom:2px solid #e5e7eb}
  .total-row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
  .total-row.final{font-size:18px;font-weight:700;color:#1e3a5f;border-top:2px solid #1e3a5f;padding-top:8px;margin-top:8px}
  .tax-box{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin-top:10px;font-size:9px}
  .dispute-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-top:10px;font-size:9px}
  .footer{text-align:center;padding:16px;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:600;margin:2px}
  .paid{background:#dbeafe;color:#1e40af}
  .cod{background:#fef3c7;color:#92400e}
</style></head>
<body>
<div class="receipt">
  <div class="header">
    <div style="font-size:28px;margin-bottom:4px">🏪</div>
    <h1>${params.vendorName}</h1>
    <div class="meta">${params.vendorAddress}${params.vendorTIN ? ' | TIN: ' + params.vendorTIN : ''}</div>
    <div style="margin-top:8px;font-size:10px;display:flex;justify-content:space-between">
      <span>Receipt #${params.receiptNumber}</span>
      <span>${params.date}</span>
    </div>
  </div>
  <div class="body">
    <div class="section">
      <div class="st">Order Information</div>
      <div class="row"><span class="lbl">Order</span><span class="val" style="font-family:monospace">${params.orderNumber}</span></div>
      <div class="row"><span class="lbl">Payment</span><span class="val">${params.paymentMethod} <span class="badge ${params.paymentMethod === 'telebirr' || params.paymentMethod === 'chapa' ? 'paid' : 'cod'}">${params.paymentReference}</span></span></div>
      <div class="row"><span class="lbl">Deliver to</span><span class="val">${params.deliveryAddress}</span></div>
    </div>
    <div class="section">
      <div class="st">Customer</div>
      <div class="row"><span class="lbl">Name</span><span class="val">${params.customerName}</span></div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${params.customerPhone}</span></div>
    </div>
    <div class="section">
      <div class="st">Items Purchased</div>
      <table>
        <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
        ${itemsHtml}
      </table>
    </div>
    <div class="total-row"><span>Subtotal</span><span>Br ${params.subtotal.toLocaleString()}</span></div>
    ${params.discount > 0 ? '<div class="total-row" style="color:#10b981"><span>Discount</span><span>-Br ' + params.discount.toLocaleString() + '</span></div>' : ''}
    <div class="total-row"><span>Delivery Fee</span><span>Br ${params.deliveryFee.toLocaleString()}</span></div>
    <div class="total-row final"><span>TOTAL</span><span>Br ${params.total.toLocaleString()}</span></div>

    <div class="tax-box">
      <strong>Commission & Tax Breakdown</strong><br>
      Commission (${Math.round(params.commissionRate * 100)}%): Br ${tax.commissionAmount.toLocaleString()}<br>
      VAT on Commission (15%): Br ${tax.vatOnCommission.toLocaleString()}<br>
      Withholding Tax (2%): Br ${tax.withholdingTax.toLocaleString()}<br>
      Gateway Fee (2.5%): Br ${tax.gatewayFee.toLocaleString()}<br>
      <strong>Vendor Net Payout: Br ${tax.vendorPayout.toLocaleString()}</strong>
    </div>

    <div class="dispute-box">
      <strong>Dispute Period</strong><br>
      You have <strong>${DISPUTE_PERIOD_HOURS} hours</strong> from delivery to report any issues.<br>
      Deadline: ${disputeDeadline.toLocaleString()}<br>
      After this period, funds will be released to the vendor automatically.
    </div>

    ${params.vendorNotes ? '<div style="margin-top:8px;font-size:10px;color:#6b7280;padding:8px;background:#f9fafb;border-radius:6px"><strong>Notes:</strong><br>' + params.vendorNotes + '</div>' : ''}
  </div>
  <div class="footer">
    <p>Thank you for shopping at ${params.vendorName}!</p>
    <p style="margin-top:4px">For returns & disputes, contact within ${DISPUTE_PERIOD_HOURS}h of delivery</p>
  </div>
</div></body></html>`;
}

export function generateProcessingTimeline(statuses: { label: string; time: string; completed: boolean; icon: string }[]): string {
  const items = statuses.map((s, i) => `
    <div style="display:flex;gap:12px;padding:8px 0;${i < statuses.length - 1 ? 'border-bottom:1px solid #f3f4f6' : ''}">
      <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;${s.completed ? 'background:#dbeafe' : 'background:#f3f4f6'}">${s.icon}</div>
      <div><div style="font-size:12px;font-weight:${s.completed ? '600' : '400'};color:${s.completed ? '#1e40af' : '#9ca3af'}">${s.label}</div><div style="font-size:10px;color:#9ca3af">${s.time || 'Pending'}</div></div>
    </div>
  `).join('');
  return items;
}

export const VENDOR_STATUS_FLOW = [
  { label: 'Order Placed', icon: '📋' },
  { label: 'Payment Confirmed', icon: '✅' },
  { label: 'Processing', icon: '📦' },
  { label: 'Shipped', icon: '🚚' },
  { label: 'Out for Delivery', icon: '🚛' },
  { label: 'Delivered', icon: '📬' },
  { label: 'Dispute Period (24h)', icon: '⏳' },
  { label: 'Funds Released', icon: '💰' },
];
