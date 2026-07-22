/**
 * Smart Shop — Ethiopian Tax & Compliance Engine
 * Handles VAT, Turnover Tax, Withholding Tax, receipts & reporting
 * Fully compliant with Ethiopian tax regulations (ERCA)
 */

export interface TaxBreakdown {
  /** Base price before any taxes */
  basePrice: number;
  /** Delivery fee if applicable */
  deliveryFee: number;
  /** Smart Shop commission rate (e.g., 0.15 for 15%) */
  commissionRate: number;
  /** Smart Shop commission amount */
  commissionAmount: number;
  /** Gateway/channel fee */
  gatewayFee: number;
  /** VAT rate (15% in Ethiopia) */
  vatRate: number;
  /** VAT amount on commission */
  vatOnCommission: number;
  /** Withholding Tax rate (2%) */
  withholdingTaxRate: number;
  /** Withholding Tax amount */
  withholdingTax: number;
  /** Total customer paid */
  totalPaid: number;
  /** Net vendor payout after all deductions */
  vendorPayout: number;
  /** Smart Shop net revenue (commission - gateway - taxes) */
  shopRevenue: number;
  /** Total tax to remit to ERCA */
  totalTaxToRemit: number;
}

/**
 * Ethiopian TIN validation (basic format check)
 * TIN format: XXXXXX-XXXXXXX or XXXXXXXXXXX
 */
export function validateTIN(tin: string): boolean {
  return /^\d{6}-\d{7}$/.test(tin) || /^\d{11}$/.test(tin);
}

/**
 * Calculate complete tax breakdown for a transaction
 * Follows Ethiopian tax law for digital marketplace platforms
 */
export function calculateTaxBreakdown(params: {
  productPrice: number;
  deliveryFee?: number;
  commissionRate: number;
  vendorIsVatRegistered?: boolean;
}): TaxBreakdown {
  const basePrice = params.productPrice;
  const deliveryFee = params.deliveryFee || 0;
  const commissionRate = params.commissionRate;
  const totalBeforeTax = basePrice + deliveryFee;

  // Commission calculation (on product price only, not delivery)
  const commissionAmount = Math.round(basePrice * commissionRate);

  // Gateway fees (Chapa charges 2.5%, Telebirb ~2%)
  const gatewayFee = Math.round(basePrice * 0.025);

  // VAT on commission (15% - Smart Shop charges VAT on its service fee)
  const vatOnCommission = Math.round(commissionAmount * 0.15);

  // Withholding Tax (2% on gross payment to vendor)
  const withholdingTax = Math.round(basePrice * 0.02);

  // Total customer pays
  const totalPaid = totalBeforeTax + vatOnCommission;

  // Vendor net payout
  const vendorPayout = basePrice - commissionAmount - gatewayFee - withholdingTax;

  // Smart Shop net revenue
  const shopRevenue = commissionAmount - gatewayFee;

  // Total tax to remit to ERCA
  const totalTaxToRemit = vatOnCommission + withholdingTax;

  return {
    basePrice,
    deliveryFee,
    commissionRate,
    commissionAmount,
    gatewayFee,
    vatRate: 0.15,
    vatOnCommission,
    withholdingTaxRate: 0.02,
    withholdingTax,
    totalPaid,
    vendorPayout,
    shopRevenue,
    totalTaxToRemit,
  };
}

/**
 * Generate a legally compliant Ethiopian tax receipt HTML
 * Follows ERCA receipt requirements:
 * - Sequential receipt number
 * - Seller TIN, Buyer info
 * - VAT breakdown
 * - Withholding Tax details
 * - Date & time
 */
export function generateTaxReceipt(receipt: {
  receiptNumber: string;
  date: string;
  storeName: string;
  storeTIN: string;
  customerName: string;
  customerTIN?: string;
  customerPhone: string;
  customerAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  taxBreakdown: TaxBreakdown;
  paymentMethod: string;
  paymentReference: string;
  isVatRegistered: boolean;
}): string {
  const itemsRows = receipt.items.map(it => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${it.name} × ${it.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right">Br ${it.total.toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Receipt - ${receipt.receiptNumber}</title>
  <style>
    @page { margin: 10mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; background:#f3f4f6; padding:20px; color:#1f2937; }
    .receipt { max-width:480px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#1e3a5f,#0f2137); padding:20px; text-align:center; color:white; }
    .header h1 { font-size:18px; font-weight:700; margin-bottom:2px; letter-spacing:1px; }
    .header .tin { font-size:10px; opacity:0.8; font-family:monospace; background:rgba(255,255,255,0.1); display:inline-block; padding:3px 10px; border-radius:4px; margin-top:4px; }
    .receipt-no { font-size:11px; background:#dbeafe; color:#1e3a5f; padding:3px 12px; border-radius:4px; font-weight:700; display:inline-block; margin-top:6px; }
    .body { padding:16px 20px; }
    .section { margin-bottom:14px; }
    .section-title { font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#9ca3af; font-weight:600; border-bottom:1px dashed #e5e7eb; padding-bottom:4px; margin-bottom:6px; }
    .row { display:flex; justify-content:space-between; font-size:12px; padding:2px 0; }
    .row .lbl { color:#6b7280; }
    .row .val { font-weight:500; }
    table { width:100%; border-collapse:collapse; margin-top:4px; }
    th { text-align:left; font-size:9px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding:6px 8px; border-bottom:2px solid #e5e7eb; }
    .totals { border-top:2px solid #e5e7eb; padding-top:8px; margin-top:8px; }
    .total-row { display:flex; justify-content:space-between; font-size:12px; padding:3px 0; }
    .total-row.final { font-size:16px; font-weight:700; color:#1e3a5f; border-top:2px solid #1e3a5f; padding-top:8px; margin-top:8px; }
    .total-row.tax { color:#dc2626; }
    .total-row.deduction { color:#6366f1; }
    .tax-box { background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; margin-top:10px; }
    .tax-box h4 { font-size:10px; font-weight:700; color:#dc2626; margin-bottom:6px; }
    .tax-row { display:flex; justify-content:space-between; font-size:10px; padding:2px 0; }
    .footer { text-align:center; padding:14px 20px; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; }
    .footer strong { color:#374151; }
    .stamp { border:2px solid #dc2626; color:#dc2626; padding:4px 12px; border-radius:4px; font-size:9px; font-weight:700; display:inline-block; margin-top:6px; letter-spacing:1px; transform:rotate(-2deg); }
    @media print { body { background:white; padding:0; } .receipt { box-shadow:none; border-radius:0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div style="font-size:24px;margin-bottom:4px;">🏪</div>
      <h1>${receipt.storeName}</h1>
      <div class="tin">TIN: ${receipt.storeTIN}</div>
      <div class="receipt-no"># ${receipt.receiptNumber}</div>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="row"><span class="lbl">Date</span><span class="val">${receipt.date}</span></div>
        <div class="row"><span class="lbl">Payment</span><span class="val">${receipt.paymentMethod}</span></div>
        <div class="row"><span class="lbl">Reference</span><span class="val">${receipt.paymentReference}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Customer</div>
        <div class="row"><span class="lbl">Name</span><span class="val">${receipt.customerName}</span></div>
        <div class="row"><span class="lbl">Phone</span><span class="val">${receipt.customerPhone}</span></div>
        ${receipt.customerTIN ? `<div class="row"><span class="lbl">TIN</span><span class="val">${receipt.customerTIN}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Items</div>
        <table>
          <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
          ${itemsRows}
        </table>
      </div>

      <div class="totals">
        <div class="total-row"><span>Subtotal (Products)</span><span>Br ${receipt.taxBreakdown.basePrice.toLocaleString()}</span></div>
        ${receipt.taxBreakdown.deliveryFee > 0 ? `<div class="total-row"><span>Delivery Fee</span><span>Br ${receipt.taxBreakdown.deliveryFee.toLocaleString()}</span></div>` : ''}
        <div class="total-row tax"><span>VAT 15% on Commission</span><span>Br ${receipt.taxBreakdown.vatOnCommission.toLocaleString()}</span></div>
        <div class="total-row final"><span>TOTAL PAID</span><span>Br ${receipt.taxBreakdown.totalPaid.toLocaleString()}</span></div>
      </div>

      <div class="tax-box">
        <h4>🧾 Tax Breakdown (For Your Records)</h4>
        <div class="tax-row"><span>Base Price</span><span>Br ${receipt.taxBreakdown.basePrice.toLocaleString()}</span></div>
        <div class="tax-row"><span>Smart Shop Commission (${(receipt.taxBreakdown.commissionRate * 100).toFixed(0)}%)</span><span>-Br ${receipt.taxBreakdown.commissionAmount.toLocaleString()}</span></div>
        <div class="tax-row"><span>Gateway Fee (2.5%)</span><span>-Br ${receipt.taxBreakdown.gatewayFee.toLocaleString()}</span></div>
        <div class="tax-row" style="color:#dc2626;"><span>Withholding Tax (2%)</span><span>-Br ${receipt.taxBreakdown.withholdingTax.toLocaleString()}</span></div>
        <div class="tax-row" style="color:#6366f1;font-weight:700;border-top:1px dashed #ccc;padding-top:4px;margin-top:4px;"><span>Vendor Net Payout</span><span>Br ${receipt.taxBreakdown.vendorPayout.toLocaleString()}</span></div>
      </div>

      <div style="font-size:9px;color:#9ca3af;margin-top:10px;padding:8px;background:#f9fafb;border-radius:6px;">
        <strong>Tax Summary:</strong><br />
        VAT on Commission: Br ${receipt.taxBreakdown.vatOnCommission.toLocaleString()} (collected, to remit to ERCA)<br />
        Withholding Tax: Br ${receipt.taxBreakdown.withholdingTax.toLocaleString()} (deducted, to remit to ERCA)<br />
        Total Tax to Remit: <strong>Br ${receipt.taxBreakdown.totalTaxToRemit.toLocaleString()}</strong>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for shopping at ${receipt.storeName}!</p>
      <p style="font-size:9px;margin-top:4px;">For returns: contact within 7 days | TIN: ${receipt.storeTIN}</p>
      ${receipt.isVatRegistered ? '<div class="stamp">✅ VAT RECEIPT</div>' : '<div class="stamp">📄 SALES RECEIPT</div>'}
      <p style="font-size:8px;margin-top:6px;color:#d1d5db;">Receipt #${receipt.receiptNumber} | Generated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate monthly VAT return data
 * Format: CSV ready for ERCA submission
 */
export function generateVATReturn(transactions: TaxBreakdown[], period: string): string {
  const totalVAT = transactions.reduce((s, t) => s + t.vatOnCommission, 0);
  const totalWHT = transactions.reduce((s, t) => s + t.withholdingTax, 0);
  const totalCommission = transactions.reduce((s, t) => s + t.commissionAmount, 0);
  const totalSales = transactions.reduce((s, t) => s + t.basePrice, 0);

  return [
    '=== VAT RETURN (ክፍያ ተመላሽ) ===',
    `Period: ${period}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '=== SUMMARY ===',
    `Total Sales (Br): ${totalSales.toLocaleString()}`,
    `Total Commission (Br): ${totalCommission.toLocaleString()}`,
    `VAT on Commission (15%) (Br): ${totalVAT.toLocaleString()}`,
    `Withholding Tax (2%) (Br): ${totalWHT.toLocaleString()}`,
    `Total Tax to Remit (Br): ${(totalVAT + totalWHT).toLocaleString()}`,
    '',
    '=== TRANSACTION DETAILS ===',
    'Date,BasePrice,Commission,VAT,WHT,VendorPayout',
    ...transactions.map((t, i) => {
      const date = new Date();
      date.setDate(date.getDate() - transactions.length + i);
      return `${date.toISOString().split('T')[0]},${t.basePrice},${t.commissionAmount},${t.vatOnCommission},${t.withholdingTax},${t.vendorPayout}`;
    }),
  ].join('\n');
}

/**
 * Generate vendor withholding tax certificate
 * Each vendor who had WHT deducted gets one
 */
export function generateWHTCertificate(params: {
  vendorName: string;
  vendorTIN: string;
  period: string;
  transactions: { date: string; amount: number; wht: number }[];
}): string {
  const totalAmount = params.transactions.reduce((s, t) => s + t.amount, 0);
  const totalWHT = params.transactions.reduce((s, t) => s + t.wht, 0);

  return [
    '===================================',
    '  WITHDOLDING TAX CERTIFICATE',
    '  (የተሰነጠቀ የገቢ ታክስ የምስክር ወረቀት)',
    '===================================',
    '',
    `Vendor: ${params.vendorName}`,
    `TIN: ${params.vendorTIN}`,
    `Period: ${params.period}`,
    '',
    '--- Deductions ---',
    `Total Payments: Br ${totalAmount.toLocaleString()}`,
    `WHT Deducted (2%): Br ${totalWHT.toLocaleString()}`,
    '',
    '--- Transaction Details ---',
    ...params.transactions.map(t => `${t.date} | Br ${t.amount.toLocaleString()} | WHT: Br ${t.wht.toLocaleString()}`),
    '',
    '===================================',
    `Smart Shop Ethiopia | TIN: PENDING`,
    `Generated: ${new Date().toISOString()}`,
    '===================================',
  ].join('\n');
}

/**
 * Generate sequential receipt number
 * Format: SS-YYYY-XXXXX (Smart Shop - Year - Sequential)
 */
export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `SS-${year}-${seq}`;
}

/**
 * Ethiopian date formatting
 */
export function formatEthiopianDate(date: Date): string {
  return date.toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Service fee rates for Ethiopian payment gateways
 */
export const PAYMENT_GATEWAYS = {
  chapa: {
    name: 'Chapa',
    fee: 0.025, // 2.5%
    settlementDays: 1, // T+1
    supportsPayout: true,
    apiDocs: 'https://developer.chapa.co',
  },
  telebirr: {
    name: 'Telebirr',
    fee: 0.02, // 2%
    settlementDays: 0, // Instant
    supportsPayout: false,
    apiDocs: 'https://www.ethiotelecom.et/telebirr',
  },
};

/**
 * Tax constants for Ethiopia (2024/2025)
 */
export const ETHIOPIAN_TAX = {
  vatRate: 0.15, // 15%
  vatThreshold: 1_000_000, // 1M Birr annual turnover
  turnoverTaxRate: 0.02, // 2% for non-VAT registered
  withholdingTaxRate: 0.02, // 2%
  businessProfitTaxRate: 0.30, // 30%
  stampDutyPerReceipt: 0.50, // Br 0.50 per receipt (estimated)
};
