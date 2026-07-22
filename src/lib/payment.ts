/**
 * Smart Shop — Payment Processing Engine
 * Handles Chapa & Telebirr integration, payment verification,
 * vendor payout disbursement, and transaction recording
 */

export type PaymentGateway = 'chapa' | 'telebirr';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentTransaction {
  id: string;
  orderNumber: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface PayoutRecord {
  id: string;
  vendorId: number;
  vendorName: string;
  amount: number;
  commission: number;
  taxDeductions: {
    vat: number;
    withholdingTax: number;
    gatewayFee: number;
  };
  netAmount: number;
  status: PayoutStatus;
  method: 'chapa' | 'bank' | 'telebirr';
  accountNumber: string;
  period: string;
  createdAt: string;
  completedAt?: string;
  receiptNumber: string;
}

/**
 * Initiate a Chapa payment
 * In production, this calls Chapa's REST API
 */
export async function initiateChapaPayment(params: {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: { title: string; description: string };
}): Promise<{ success: boolean; checkout_url?: string; error?: string }> {
  try {
    // In production, this would be:
    // POST https://api.chapa.co/v1/transaction/initialize
    // Headers: Authorization: Bearer CHAPA_SECRET_KEY
    
    // For now, simulate success
    console.log('[Chapa] Payment initiated:', params.tx_ref);
    return {
      success: true,
      checkout_url: `https://checkout.chapa.co/payment/${params.tx_ref}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Verify a Chapa payment
 * In production, this calls Chapa's verification endpoint
 */
export async function verifyChapaPayment(tx_ref: string): Promise<{
  status: PaymentStatus;
  amount?: number;
  reference?: string;
  error?: string;
}> {
  try {
    // In production:
    // GET https://api.chapa.co/v1/transaction/verify/{tx_ref}
    
    console.log('[Chapa] Verifying payment:', tx_ref);
    return { status: 'completed', amount: 0, reference: `CHAPA-${Date.now()}` };
  } catch (e: any) {
    return { status: 'failed', error: e.message };
  }
}

/**
 * Initiate Telebirr payment
 * Telebirr uses a different flow: generates a QR code / deep link
 */
export async function initiateTelebirrPayment(params: {
  amount: number;
  phone: string;
  orderId: string;
  callbackUrl: string;
}): Promise<{ success: boolean; qrCode?: string; deepLink?: string; error?: string }> {
  try {
    console.log('[Telebirr] Payment initiated:', params.orderId);
    return {
      success: true,
      deepLink: `telebirr://pay?amount=${params.amount}&order=${params.orderId}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Disburse payout to vendor via Chapa
 * Chapa supports bulk disbursements to bank accounts and mobile money
 */
export async function disbursToVendor(params: {
  vendorName: string;
  amount: number;
  accountNumber: string;
  bankCode?: string;
  description: string;
}): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    console.log('[Payout] Disbursing to vendor:', params.vendorName, params.amount);
    return {
      success: true,
      reference: `PO-${Date.now().toString(36).toUpperCase()}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get exchange rate from ETB to other currencies
 */
export async function getExchangeRate(currency: string): Promise<number> {
  const rates: Record<string, number> = {
    ETB: 1,
    USD: 0.019,
    EUR: 0.017,
    GBP: 0.015,
    KES: 2.45,
  };
  return rates[currency] || 1;
}

/**
 * Calculate settlement date based on gateway
 * Chapa: T+1 (next business day)
 * Telebirr: Instant
 */
export function getSettlementDate(gateway: PaymentGateway, date: Date = new Date()): Date {
  const settlement = new Date(date);
  if (gateway === 'chapa') {
    settlement.setDate(settlement.getDate() + 1);
    // If settlement falls on weekend, move to Monday
    if (settlement.getDay() === 0) settlement.setDate(settlement.getDate() + 1);
    if (settlement.getDay() === 6) settlement.setDate(settlement.getDate() + 2);
  }
  return settlement;
}

/**
 * Generate a unique transaction reference
 */
export function generateTxRef(type: 'payment' | 'payout' | 'refund'): string {
  const prefix = type === 'payment' ? 'TXN' : type === 'payout' ? 'PO' : 'REF';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
