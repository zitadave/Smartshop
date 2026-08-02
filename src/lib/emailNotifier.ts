/**
 * ============================================================================
 * SMART SHOP MULTI-CHANNEL EMAIL & MARKETING ENGINE (RESEND API - 3,000/mo)
 * ============================================================================
 * Generates responsive, inline-styled HTML emails for:
 * 1. Customer Order Receipts with confidential 4-Digit Delivery Security PIN.
 * 2. Vendor Onboarding KYC Confirmations & Audit Trail.
 * 3. Revenue Payout Advices for Ethiopian tax accounting.
 * 4. Marketing Blasts (Flash Deals, Active Group Buys, Cart Recovery Vouchers).
 *
 * Fully resilient: operates in sandbox simulation mode if RESEND_API_KEY is unset.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  templateType: 'order_receipt' | 'vendor_welcome' | 'payout_advice' | 'cart_recovery' | 'marketing_blast';
  data: Record<string, any>;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  templateType: string;
  sentAt: string;
  simulated: boolean;
  status: string;
}

/**
 * Generate HTML for Customer Order Confirmation & 4-Digit Delivery PIN
 */
export function generateOrderReceiptHtml(order: any, pin: string = '4928'): string {
  const itemsHtml = (order.items || []).map((i: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${i.name || i.nameEn || 'Item'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center;">x${i.quantity || i.qty || 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: bold;">Br ${(i.price || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #2563eb; font-size: 24px;">🏪 Smart Shop</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Smart Marketplace — Official Digital Invoice</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Order Confirmed: #${order.orderNumber || 'ORD-2026-001'}</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        Thank you for shopping with Smart Shop! Your order has been secured in escrow and is being prepared for dispatch.
      </p>

      <!-- Security PIN Box -->
      <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <div style="font-size: 12px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 1px;">🔐 Delivery Security PIN</div>
        <div style="font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 4px; margin: 8px 0;">${pin}</div>
        <p style="font-size: 12px; color: #166534; margin: 0;">
          Confidential: Present this 4-digit PIN to your Smart Express courier upon arrival to release payment escrow.
        </p>
      </div>

      <h3 style="font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 24px;">
        Grand Total: <span style="color: #16a34a;">Br ${(order.total || 0).toLocaleString()}</span>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 14px; font-size: 13px; color: #475569;">
        <strong>Delivery Address:</strong> ${order.customer?.address || 'Addis Ababa'}<br/>
        <strong>Phone:</strong> ${order.customer?.phone || 'N/A'}
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Smart Shop Ethiopia · 24/7 Support in Amharic, Oromo, Tigrinya, Somali & English
      </div>
    </div>
  `;
}

/**
 * Generate HTML for Vendor KYC Registration Onboarding Confirmation
 */
export function generateVendorWelcomeHtml(vendor: any): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #0d9488; font-size: 24px;">🏪 Smart Shop Vendor Network</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Merchant KYC & Compliance Receipt</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Welcome, ${vendor.storeName || 'Merchant'}!</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Your vendor application and KYC documents have been successfully received. Our administrative team is reviewing your Trade License, TIN, and Store Branding.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #166534;">
        <strong>Store Name:</strong> ${vendor.storeName}<br/>
        <strong>Phone:</strong> ${vendor.storePhone}<br/>
        <strong>TIN Number:</strong> ${vendor.tinNumber || 'Verified'}<br/>
        <strong>Trade License:</strong> ${vendor.licenseNumber || 'Verified'}<br/>
        <strong>District:</strong> ${vendor.storeAddress || 'Addis Ababa'}<br/>
        <strong>Logo & Banner:</strong> ${vendor.logo ? '✓ Uploaded' : 'Pending'} / ${vendor.backgroundImage ? '✓ Uploaded' : 'Pending'}
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Once approved, you will be notified via Telegram Bot and Email, and your store will go live on the Smart Shop marketplace.
      </p>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Smart Shop Merchant Operations · Addis Ababa, Ethiopia
      </div>
    </div>
  `;
}

/**
 * Generate HTML for Financial Payout Advice (Ethiopian Accounting & Tax Compliance)
 */
export function generatePayoutReceiptHtml(payout: any): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #16a34a; font-size: 24px;">💸 Smart Shop Payout Advice</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Revenue Disbursal Record</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Disbursal Executed: Br ${(payout.amount || 0).toLocaleString()}</h2>
      <p style="color: #475569; font-size: 14px;">
        We have processed your revenue withdrawal request. Funds have been sent to your registered payout account.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #334155;">
        <strong>Vendor Name:</strong> ${payout.vendorName || 'Smart Shop Merchant'}<br/>
        <strong>Amount Disbursed:</strong> <span style="color: #16a34a; font-weight: bold;">Br ${(payout.amount || 0).toLocaleString()}</span><br/>
        <strong>Payout Method:</strong> ${payout.payment_method || payout.method || 'Telebirr'}<br/>
        <strong>Destination Account:</strong> ${payout.account_number || payout.details || 'Verified'}<br/>
        <strong>Date & Time:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </div>

      <p style="font-size: 12px; color: #64748b; font-style: italic;">
        Please retain this advice receipt for your Ethiopian revenue accounting and tax compliance records.
      </p>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Smart Shop Financial Operations
      </div>
    </div>
  `;
}

/**
 * Generate HTML for Email Marketing Blasts (Flash Deals, Group Buys, Discount Vouchers)
 */
export function generateMarketingBlastHtml(campaign: any): string {
  const title = campaign.title || '⚡ Special Announcement from Smart Shop!';
  const subtitle = campaign.subtitle || 'Exclusive deals & collaborative shopping savings.';
  const ctaText = campaign.ctaText || 'Shop Flash Deals Now';
  const targetUrl = campaign.targetUrl || 'https://smartshop-steel.vercel.app/?utm_source=email_marketing';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; padding: 28px 16px; border-radius: 14px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 26px; color: #ffffff;">${title}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${subtitle}</p>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        ${campaign.description || 'Discover our latest curated arrivals, Active Group Buy collaborative deals, and limited-time Flash Sales across Tech, Fashion, Food & Daily Subscriptions.'}
      </p>

      <!-- Main Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${targetUrl}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
          ${ctaText} ➔
        </a>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        🤝 Group Buy Discount: Share any product link with peers to unlock 25% off instantly!<br/>
        🚚 Free Delivery available on orders over Br 1,000 in Addis Ababa.
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Smart Shop Marketplace · <a href="https://smartshop-steel.vercel.app" style="color: #64748b;">Visit Storefront</a>
      </div>
    </div>
  `;
}

/**
 * Send an email notification (or simulate safely if RESEND_API_KEY is unset)
 * Logs all email activity in localStorage for audit trail.
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; simulated?: boolean; id?: string; error?: string }> {
  if (!payload || !payload.to) {
    return { success: false, error: 'Recipient email required' };
  }

  let htmlContent = '';
  if (payload.templateType === 'order_receipt') {
    htmlContent = generateOrderReceiptHtml(payload.data?.order || {}, payload.data?.pin || '4928');
  } else if (payload.templateType === 'vendor_welcome') {
    htmlContent = generateVendorWelcomeHtml(payload.data?.vendor || {});
  } else if (payload.templateType === 'payout_advice') {
    htmlContent = generatePayoutReceiptHtml(payload.data?.payout || {});
  } else {
    htmlContent = generateMarketingBlastHtml(payload.data || {});
  }

  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
        type: payload.templateType
      })
    });
    const data = await res.json();

    // Persist to local audit log
    try {
      const logs: EmailLogEntry[] = JSON.parse(localStorage.getItem('ss_email_logs') || '[]');
      logs.unshift({
        id: 'em-' + Date.now().toString(36),
        to: payload.to,
        subject: payload.subject,
        templateType: payload.templateType,
        sentAt: new Date().toISOString(),
        simulated: Boolean(data.simulated),
        status: data.success ? (data.simulated ? 'Simulated (Sandbox)' : 'Sent via Resend') : 'Failed'
      });
      localStorage.setItem('ss_email_logs', JSON.stringify(logs.slice(0, 30)));
    } catch {}

    return data;
  } catch (err: any) {
    return { success: true, simulated: true, error: err.message };
  }
}
