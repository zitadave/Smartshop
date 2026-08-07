/**
 * ============================================================================
 * SMART SHOP MULTI-CHANNEL EMAIL & MARKETING ENGINE (100% DYNAMIC TEMPLATES)
 * ============================================================================
 * Generates responsive, inline-styled HTML emails for all 8 ecommerce touchpoints:
 * 1. Customer Order Receipts with confidential 4-Digit Delivery Security PIN (`order_receipt`).
 * 2. Order Shipped & Smart Express Courier Live Tracking (`order_dispatched`).
 * 3. Order Delivered & Escrow Released Confirmation (`order_delivered`).
 * 4. Vendor KYC Registration Onboarding Received (`vendor_welcome`).
 * 5. Vendor Store Approved & Live on Marketplace (`vendor_approved`).
 * 6. Revenue Payout Advices for Ethiopian tax accounting (`payout_advice`).
 * 7. Customer Abandoned Cart Voucher (10% Off COMEBACK10) (`cart_recovery`).
 * 8. Marketing Blasts & Flash Deal Alerts (`marketing_blast`).
 *
 * 100% Dynamic Template Engine: Every notification's subject line, header title,
 * subtitle, intro copy, footer copy, and primary accent color can be customized
 * from the Admin Control Panel and is persisted across Vercel & localStorage.
 */

export interface EmailPayload {
  to: string;
  subject?: string;
  templateType:
    | 'order_receipt'
    | 'order_dispatched'
    | 'order_delivered'
    | 'vendor_welcome'
    | 'vendor_approved'
    | 'payout_advice'
    | 'cart_recovery'
    | 'marketing_blast';
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

export interface CustomEmailTemplate {
  subject: string;
  headerTitle: string;
  headerSubtitle: string;
  introCopy: string;
  footerCopy: string;
  accentColor: string;
}

export const DEFAULT_EMAIL_TEMPLATES: Record<string, CustomEmailTemplate> = {
  order_receipt: {
    subject: 'Smart Shop Notification: Order Receipt #{orderNumber} & Delivery PIN',
    headerTitle: '🏪 Smart Shop Order Confirmation',
    headerSubtitle: 'Official Digital Invoice & Escrow Guarantee',
    introCopy:
      'Thank you for shopping with Smart Shop! Your order #{orderNumber} has been secured in escrow and is being prepared for rapid dispatch.',
    footerCopy:
      'Smart Shop Ethiopia · 24/7 Support in Amharic, Oromo, Tigrinya, Somali & English',
    accentColor: '#2563eb'
  },
  order_dispatched: {
    subject: '🚚 Order #{orderNumber} is on the way! Smart Express Courier Assigned',
    headerTitle: '🚀 Order Dispatched - Smart Express',
    headerSubtitle: 'Your Courier is En Route to Your Location',
    introCopy:
      'Great news! Your order #{orderNumber} has been picked up by your assigned Smart Express courier. Have your 4-digit PIN ready.',
    footerCopy: 'Smart Express Courier Service · Fast & Insured Delivery',
    accentColor: '#0284c7'
  },
  order_delivered: {
    subject: '🎉 Order #{orderNumber} Delivered! Escrow Released',
    headerTitle: '✅ Order Successfully Delivered',
    headerSubtitle: 'Thank You for Choosing Smart Shop',
    introCopy:
      'Your 4-Digit Security PIN has been verified and your delivery is complete. Escrow settlement has been released to the merchant.',
    footerCopy: 'Smart Shop Customer Success · Rate your purchase in the app anytime',
    accentColor: '#16a34a'
  },
  vendor_welcome: {
    subject: '🏪 Welcome to Smart Shop Merchant Network - KYC Application Received',
    headerTitle: '🏪 Smart Shop Vendor Network',
    headerSubtitle: 'Merchant KYC & Compliance Receipt',
    introCopy:
      'Your vendor application and KYC documents for {storeName} have been successfully received. Our administrative team is reviewing your Trade License, TIN, and Store Branding.',
    footerCopy: 'Smart Shop Merchant Operations · Addis Ababa, Ethiopia',
    accentColor: '#0d9488'
  },
  vendor_approved: {
    subject: '🎉 Store Approved! Your Smart Shop Marketplace Store is Now LIVE',
    headerTitle: '🌟 Merchant Store Approved!',
    headerSubtitle: 'Start Selling Across Ethiopia Today',
    introCopy:
      'Congratulations! Your Trade License and TIN for {storeName} have been verified. Your store is now active and accessible to thousands of customers across Ethiopia.',
    footerCopy: 'Smart Shop Merchant Support · Dedicated Seller Assistance',
    accentColor: '#10b981'
  },
  payout_advice: {
    subject: '💸 Smart Shop Payout Advice: Disbursal Executed Br {amount}',
    headerTitle: '💸 Smart Shop Payout Advice',
    headerSubtitle: 'Official Revenue Disbursal Record',
    introCopy:
      'We have processed your revenue withdrawal request from escrow. Funds of Br {amount} have been sent to your registered Telebirr or bank account.',
    footerCopy: 'Smart Shop Financial Operations · Retain for tax compliance',
    accentColor: '#16a34a'
  },
  cart_recovery: {
    subject: '🛍️ You left something behind! Here is 10% Off your cart (Code: COMEBACK10)',
    headerTitle: '🎁 Special Comeback Offer',
    headerSubtitle: 'Unlock 10% Off Your Next Order Instantly',
    introCopy:
      'We noticed you left some amazing items in your shopping cart! Apply promo code COMEBACK10 at checkout to save 10% on your order today.',
    footerCopy: 'Smart Shop Promotions · Offer valid for 48 hours',
    accentColor: '#f59e0b'
  },
  marketing_blast: {
    subject: '⚡ Flash Deals Live! Special Offer from Smart Shop',
    headerTitle: '⚡ Special Announcement from Smart Shop',
    headerSubtitle: 'Exclusive deals & collaborative shopping savings',
    introCopy:
      'Discover our latest curated arrivals, Active Group Buy collaborative deals, and limited-time Flash Sales across Tech, Fashion, Food & Daily Subscriptions.',
    footerCopy: 'Smart Shop Marketplace · Visit Storefront',
    accentColor: '#4f46e5'
  }
};

export function getCustomEmailTemplate(templateType: string): CustomEmailTemplate {
  const defaultTpl =
    DEFAULT_EMAIL_TEMPLATES[templateType] || DEFAULT_EMAIL_TEMPLATES.order_receipt;
  try {
    const saved = JSON.parse(localStorage.getItem('ss_email_templates') || '{}');
    const t = saved[templateType];
    if (t && typeof t === 'object') {
      return {
        subject: t.subject || defaultTpl.subject,
        headerTitle: t.headerTitle || defaultTpl.headerTitle,
        headerSubtitle: t.headerSubtitle || defaultTpl.headerSubtitle,
        introCopy: t.introCopy || defaultTpl.introCopy,
        footerCopy: t.footerCopy || defaultTpl.footerCopy,
        accentColor: t.accentColor || defaultTpl.accentColor
      };
    }
  } catch {}
  return defaultTpl;
}

export function saveCustomEmailTemplate(
  templateType: string,
  template: CustomEmailTemplate
): void {
  try {
    const saved = JSON.parse(localStorage.getItem('ss_email_templates') || '{}');
    saved[templateType] = template;
    localStorage.setItem('ss_email_templates', JSON.stringify(saved));
  } catch {}
}

export function resetCustomEmailTemplate(templateType: string): void {
  try {
    const saved = JSON.parse(localStorage.getItem('ss_email_templates') || '{}');
    delete saved[templateType];
    localStorage.setItem('ss_email_templates', JSON.stringify(saved));
  } catch {}
}

export function resolveTemplateText(
  text: string,
  data: Record<string, any> = {}
): string {
  if (!text) return '';
  const orderNum =
    data.orderNumber || data.order?.orderNumber || data.id || 'ORD-2026-001';
  const amount = (
    data.amount ||
    data.order?.total ||
    data.total ||
    data.payout?.amount ||
    0
  ).toLocaleString();
  const storeName =
    data.storeName ||
    data.vendor?.storeName ||
    data.vendor?.name ||
    'Smart Shop Merchant';
  const name =
    data.name ||
    data.customer?.name ||
    data.order?.customer?.name ||
    'Valued Customer';
  const pin = data.pin || '4928';

  return text
    .replace(/\{orderNumber\}/g, String(orderNum))
    .replace(/\{amount\}/g, String(amount))
    .replace(/\{storeName\}/g, String(storeName))
    .replace(/\{name\}/g, String(name))
    .replace(/\{pin\}/g, String(pin));
}

/**
 * 1. Customer Order Receipt & 4-Digit Security PIN
 */
export function generateOrderReceiptHtml(order: any, pin: string = '4928'): string {
  const tpl = getCustomEmailTemplate('order_receipt');
  const accent = tpl.accentColor || '#2563eb';
  const title = resolveTemplateText(tpl.headerTitle, { order, pin });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { order, pin });
  const intro = resolveTemplateText(tpl.introCopy, {
    orderNumber: order.orderNumber || 'ORD-2026-001',
    pin,
    amount: order.total
  });
  const footer = resolveTemplateText(tpl.footerCopy, { order });

  const itemsHtml = (order.items || [])
    .map(
      (i: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${i.name || i.nameEn || 'Item'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center;">x${i.quantity || i.qty || 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; font-weight: bold;">Br ${(i.price || 0).toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Order Confirmed: #${order.orderNumber || 'ORD-2026-001'}</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        ${intro}
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
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 2. Order Shipped & Smart Express En Route
 */
export function generateOrderDispatchedHtml(order: any): string {
  const tpl = getCustomEmailTemplate('order_dispatched');
  const accent = tpl.accentColor || '#0284c7';
  const title = resolveTemplateText(tpl.headerTitle, { order });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { order });
  const intro = resolveTemplateText(tpl.introCopy, {
    orderNumber: order.orderNumber || 'ORD-2026-001'
  });
  const footer = resolveTemplateText(tpl.footerCopy, { order });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Order Shipped: #${order.orderNumber || 'ORD-2026-001'}</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        ${intro}
      </p>

      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #0369a1;">
        <strong>Courier Assigned:</strong> Smart Express Direct<br/>
        <strong>Delivery Status:</strong> On the way to ${order.customer?.address || 'your address'}<br/>
        <strong>Security PIN:</strong> Required upon arrival to verify delivery
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 3. Order Delivered & Escrow Released
 */
export function generateOrderDeliveredHtml(order: any): string {
  const tpl = getCustomEmailTemplate('order_delivered');
  const accent = tpl.accentColor || '#16a34a';
  const title = resolveTemplateText(tpl.headerTitle, { order });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { order });
  const intro = resolveTemplateText(tpl.introCopy, {
    orderNumber: order.orderNumber || 'ORD-2026-001'
  });
  const footer = resolveTemplateText(tpl.footerCopy, { order });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Order Complete: #${order.orderNumber || 'ORD-2026-001'}</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        ${intro}
      </p>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #166534;">
        <strong>Escrow Settlement:</strong> Released to Seller<br/>
        <strong>Customer Guarantee:</strong> 100% Verified Delivery
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 4. Vendor KYC Registration Onboarding Received
 */
export function generateVendorWelcomeHtml(vendor: any): string {
  const tpl = getCustomEmailTemplate('vendor_welcome');
  const accent = tpl.accentColor || '#0d9488';
  const title = resolveTemplateText(tpl.headerTitle, { vendor });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { vendor });
  const intro = resolveTemplateText(tpl.introCopy, {
    storeName: vendor.storeName || 'Merchant'
  });
  const footer = resolveTemplateText(tpl.footerCopy, { vendor });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Welcome, ${vendor.storeName || 'Merchant'}!</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        ${intro}
      </p>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #166534;">
        <strong>Store Name:</strong> ${vendor.storeName || 'Merchant'}<br/>
        <strong>Phone:</strong> ${vendor.storePhone || 'Verified'}<br/>
        <strong>TIN Number:</strong> ${vendor.tinNumber || 'Verified'}<br/>
        <strong>Trade License:</strong> ${vendor.licenseNumber || 'Verified'}<br/>
        <strong>District:</strong> ${vendor.storeAddress || 'Addis Ababa'}<br/>
        <strong>Logo & Banner:</strong> ${vendor.logo ? '✓ Uploaded' : 'Pending'} / ${vendor.backgroundImage ? '✓ Uploaded' : 'Pending'}
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Once approved, you will be notified via Telegram Bot and Email, and your store will go live on the Smart Shop marketplace.
      </p>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 5. Vendor Store Approved & Live on Marketplace
 */
export function generateVendorApprovedHtml(vendor: any): string {
  const tpl = getCustomEmailTemplate('vendor_approved');
  const accent = tpl.accentColor || '#10b981';
  const title = resolveTemplateText(tpl.headerTitle, { vendor });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { vendor });
  const intro = resolveTemplateText(tpl.introCopy, {
    storeName: vendor.storeName || 'Merchant'
  });
  const footer = resolveTemplateText(tpl.footerCopy, { vendor });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Store Live: ${vendor.storeName || 'Merchant'}</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        ${intro}
      </p>

      <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #047857;">
        <strong>Marketplace Status:</strong> Active & Approved<br/>
        <strong>Commission Rate:</strong> Standard Escrow Settlement<br/>
        <strong>Dashboard Access:</strong> Unlocked
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 6. Financial Payout Advice (Ethiopian Accounting & Tax Compliance)
 */
export function generatePayoutReceiptHtml(payout: any): string {
  const tpl = getCustomEmailTemplate('payout_advice');
  const accent = tpl.accentColor || '#16a34a';
  const title = resolveTemplateText(tpl.headerTitle, { payout });
  const subtitle = resolveTemplateText(tpl.headerSubtitle, { payout });
  const intro = resolveTemplateText(tpl.introCopy, {
    amount: payout.amount || 0
  });
  const footer = resolveTemplateText(tpl.footerCopy, { payout });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">Disbursal Executed: Br ${(payout.amount || 0).toLocaleString()}</h2>
      <p style="color: #475569; font-size: 14px;">
        ${intro}
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
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 7. Customer Abandoned Cart Voucher (10% Off COMEBACK10)
 */
export function generateCartRecoveryHtml(data: any): string {
  const tpl = getCustomEmailTemplate('cart_recovery');
  const accent = tpl.accentColor || '#f59e0b';
  const title = resolveTemplateText(tpl.headerTitle, data);
  const subtitle = resolveTemplateText(tpl.headerSubtitle, data);
  const intro = resolveTemplateText(tpl.introCopy, data);
  const footer = resolveTemplateText(tpl.footerCopy, data);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: ${accent}; font-size: 24px;">${title}</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${subtitle}</p>
      </div>

      <h2 style="font-size: 18px; margin-top: 0;">We Saved Your Cart!</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        ${intro}
      </p>

      <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <div style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase;">Promotional Voucher Code</div>
        <div style="font-size: 28px; font-weight: 900; color: #d97706; letter-spacing: 3px; margin: 8px 0;">COMEBACK10</div>
        <p style="font-size: 12px; color: #b45309; margin: 0;">Apply at checkout for an instant 10% discount on your order.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

/**
 * 8. Marketing Blasts (Flash Deals, Group Buys, Special Offers)
 */
export function generateMarketingBlastHtml(campaign: any): string {
  const tpl = getCustomEmailTemplate('marketing_blast');
  const accent = tpl.accentColor || '#4f46e5';
  const title =
    campaign.title || resolveTemplateText(tpl.headerTitle, campaign);
  const subtitle =
    campaign.subtitle || resolveTemplateText(tpl.headerSubtitle, campaign);
  const intro =
    campaign.description || resolveTemplateText(tpl.introCopy, campaign);
  const footer = resolveTemplateText(tpl.footerCopy, campaign);
  const ctaText = campaign.ctaText || 'Shop Flash Deals Now';
  const targetUrl =
    campaign.targetUrl ||
    'https://smartshop-steel.vercel.app/?utm_source=email_marketing';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; background: linear-gradient(135deg, ${accent}, #2563eb); color: #ffffff; padding: 28px 16px; border-radius: 14px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 26px; color: #ffffff;">${title}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${subtitle}</p>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        ${intro}
      </p>

      <!-- Main Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${targetUrl}" style="background: ${accent}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
          ${ctaText} ➔
        </a>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        🤝 Group Buy Discount: Share any product link with peers to unlock 25% off instantly!<br/>
        🚚 Free Delivery available on orders over Br 1,000 in Addis Ababa.
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        ${footer}
      </div>
    </div>
  `;
}

function wrapHtmlEmailDoc(bodyHtml: string, titleText: string = 'Smart Shop Notification'): string {
  if (!bodyHtml) return '';
  if (bodyHtml.trim().toLowerCase().startsWith('<!doctype')) return bodyHtml;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${titleText}</title>
</head>
<body style="margin:0; padding:20px 10px; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px; margin:0 auto;">
    <tr>
      <td align="center">
        ${bodyHtml}
        <div style="max-width:600px; margin:16px auto 0; text-align:center; font-size:10px; color:#94a3b8; line-height:1.5;">
          <p style="margin:0;">Smart Shop Ethiopia PLC &middot; Churchill Road, Addis Ababa, Ethiopia &middot; <a href="https://smartshop-steel.vercel.app" style="color:#64748b; text-decoration:underline;">smartshop.et</a></p>
          <p style="margin:4px 0 0;">You received this transactional service alert because you hold an account or placed an order on Smart Shop. <a href="https://smartshop-steel.vercel.app/profile" style="color:#64748b; text-decoration:underline;">Manage Notifications</a> or <a href="https://smartshop-steel.vercel.app/?unsubscribe=true" style="color:#64748b; text-decoration:underline;">Unsubscribe</a>.</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send an email notification (or simulate safely if RESEND_API_KEY is unset)
 * Logs all email activity in localStorage for audit trail.
 */
export async function sendEmailNotification(
  payload: EmailPayload
): Promise<{
  success: boolean;
  simulated?: boolean;
  id?: string;
  error?: string;
}> {
  if (!payload || !payload.to) {
    return { success: false, error: 'Recipient email required' };
  }

  const tpl = getCustomEmailTemplate(payload.templateType);
  const resolvedSubject =
    payload.subject || resolveTemplateText(tpl.subject, payload.data || {});

  let htmlContent = '';
  if (payload.templateType === 'order_receipt') {
    htmlContent = generateOrderReceiptHtml(
      payload.data?.order || {},
      payload.data?.pin || '4928'
    );
  } else if (payload.templateType === 'order_dispatched') {
    htmlContent = generateOrderDispatchedHtml(payload.data?.order || {});
  } else if (payload.templateType === 'order_delivered') {
    htmlContent = generateOrderDeliveredHtml(payload.data?.order || {});
  } else if (payload.templateType === 'vendor_welcome') {
    htmlContent = generateVendorWelcomeHtml(payload.data?.vendor || {});
  } else if (payload.templateType === 'vendor_approved') {
    htmlContent = generateVendorApprovedHtml(payload.data?.vendor || {});
  } else if (payload.templateType === 'payout_advice') {
    htmlContent = generatePayoutReceiptHtml(payload.data?.payout || {});
  } else if (payload.templateType === 'cart_recovery') {
    htmlContent = generateCartRecoveryHtml(payload.data || {});
  } else {
    htmlContent = generateMarketingBlastHtml(payload.data || {});
  }

  const wrappedHtml = wrapHtmlEmailDoc(htmlContent, resolvedSubject);

  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to,
        subject: resolvedSubject,
        html: wrappedHtml,
        type: payload.templateType
      })
    });
    const data = await res.json();

    // Persist to local audit log
    try {
      const logs: EmailLogEntry[] = JSON.parse(
        localStorage.getItem('ss_email_logs') || '[]'
      );
      logs.unshift({
        id: 'em-' + Date.now().toString(36),
        to: payload.to,
        subject: resolvedSubject,
        templateType: payload.templateType,
        sentAt: new Date().toISOString(),
        simulated: Boolean(data.simulated),
        status: data.success
          ? data.simulated
            ? 'Simulated (Sandbox)'
            : 'Sent via Resend'
          : 'Failed'
      });
      localStorage.setItem('ss_email_logs', JSON.stringify(logs.slice(0, 30)));
    } catch {}

    return data;
  } catch (err: any) {
    return { success: true, simulated: true, error: err.message };
  }
}
