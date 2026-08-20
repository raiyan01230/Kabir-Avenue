import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

async function fetchStoreSettingsFromDB() {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    
    const sb = createClient(url, key);
    const { data, error } = await sb.from('store_settings').select('setting_key, setting_value');
    if (error || !data) return null;
    
    const map: Record<string, string> = {};
    data.forEach(row => {
      map[row.setting_key] = row.setting_value;
    });
    return map;
  } catch (e) {
    console.warn('Could not fetch store settings for email', e);
    return null;
  }
}

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (
    trimmed.startsWith('guest_') ||
    trimmed.startsWith('vip_') ||
    trimmed.startsWith('admin_created_') ||
    trimmed.endsWith('@checkout.bd') ||
    trimmed.endsWith('@hyperdrive.bd') ||
    trimmed.endsWith('@customer.store') ||
    trimmed.endsWith('.local')
  ) {
    return false;
  }
  return EMAIL_REGEX.test(trimmed);
}

function getFromAddress(): string {
  // Resend free test tier uses onboarding@resend.dev without complex display names that trigger header validation issues
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}

export async function sendAccountConfirmationEmail(customer: {
  fullName: string;
  email: string;
  phone?: string;
}) {
  if (!isValidEmail(customer.email)) {
    console.log(`[Email Service] Skipping account confirmation for non-deliverable/placeholder email: ${customer.email}`);
    return { success: true, skipped: true };
  }

  const client = getResend();
  if (!client) {
    console.log(`[Email Service] RESEND_API_KEY not configured. Simulated account welcome email for: ${customer.email}`);
    return { success: true, simulated: true };
  }

  try {
    const from = getFromAddress();
    const cleanEmail = customer.email.trim();
    
    const dbSettings = await fetchStoreSettingsFromDB();
    const storeName = dbSettings?.['store_name'] || 'HYPERDRIVE';
    const storeWebsite = process.env.APP_URL || 'https://hyperdrive.bd';

    const res = await client.emails.send({
      from,
      to: cleanEmail,
      subject: `Your ${storeName} Account Has Been Created Successfully!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0f172a; color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.05em; font-weight: 900; }
            .header p { margin: 0; font-size: 14px; opacity: 0.8; }
            .content { padding: 32px 24px; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
            .welcome-text { font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #334155; }
            .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
            .button-wrapper { text-align: center; margin: 28px 0; }
            .btn { background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; }
            .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${storeName}</h1>
              <p>Authentic Enthusiast Hardware &bull; Bangladesh</p>
            </div>
            <div class="content">
              <div class="badge">&#10003; Account Active &amp; Verified</div>
              <p class="welcome-text">Hello <strong>${customer.fullName}</strong>,</p>
              <p class="welcome-text">
                Welcome to ${storeName}! Your account is active. You can now browse our catalog, save items to your wishlist, track orders live, and checkout with fast dispatch across Bangladesh.
              </p>
              
              <div class="details-card">
                <div style="font-weight: 700; margin-bottom: 12px; font-size: 13px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Registered Profile</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Full Name:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right; font-size: 14px; font-weight: 600;">${customer.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Email:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right; font-size: 14px; font-weight: 600;">${customer.email}</td>
                  </tr>
                  ${customer.phone ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Phone:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right; font-size: 14px; font-weight: 600;">${customer.phone}</td>
                  </tr>` : ''}
                </table>
              </div>

              <div class="button-wrapper">
                <a href="${storeWebsite}" class="btn">Explore Hardware Catalog</a>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
                Fast Nationwide Courier Dispatch Available
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${storeName} Bangladesh. Official Warranty Guaranteed.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (res && (res as any).error) {
      const errObj = (res as any).error;
      console.warn(`[Resend Notice] ${errObj.name || 'validation_notice'}: ${errObj.message || 'Sandbox restriction'}`);
      return { success: false, warning: errObj.message };
    }

    return { success: true, data: res };
  } catch (error: any) {
    console.warn('[Email Service Notice]: Could not deliver account email via Resend:', error?.message || error);
    return { success: false, warning: error?.message || 'Email delivery skipped' };
  }
}

import { renderOrderReceiptEmail, OrderReceiptData } from '../templates/OrderReceiptEmail';

export async function sendOrderConfirmation(orderData: any, customerEmail: string) {
  if (!isValidEmail(customerEmail)) {
    console.log(`[Email Service] Skipping external dispatch for dummy/guest placeholder: ${customerEmail}`);
    return { success: true, skipped: true };
  }

  const client = getResend();
  const orderNumber = orderData.order_number || orderData.orderNumber || orderData.id || `ORD-${Date.now()}`;

  if (!client) {
    console.log(`[Email Service] RESEND_API_KEY not set. Simulated order invoice #${orderNumber} for: ${customerEmail}`);
    return { success: true, simulated: true };
  }

  try {
    const items = orderData.items || [];
    const shipping = orderData.shipping_info || {};
    
    const dbSettings = await fetchStoreSettingsFromDB();

    const receiptData: OrderReceiptData = {
      order: {
        id: orderData.id || orderNumber,
        orderNumber: orderNumber,
        createdAt: orderData.created_at || new Date().toISOString(),
        status: orderData.status || 'Pending',
        paymentMethod: orderData.payment_method || 'Cash on Delivery',
        subtotal: Number(orderData.subtotal || 0),
        discount: Number(orderData.discount || 0),
        shipping: Number(orderData.shipping_fee || 70),
        tax: 0,
        total: Number(orderData.total || 0),
        currency: 'BDT'
      },
      customer: {
        name: shipping.full_name || 'Customer',
        email: customerEmail,
        phone: shipping.phone || ''
      },
      shippingAddress: {
        division: shipping.division || '',
        district: shipping.district || '',
        thana: shipping.thana || '',
        deliveryArea: shipping.delivery_area || '',
        address: shipping.full_address || '',
        note: orderData.order_note
      },
      items: items.map((item: any) => ({
        productId: item.product_id || '',
        name: item.product?.name || item.name || item.product_name_snapshot || 'Product Item',
        variant: item.variant || (item.variant_info_snapshot ? Object.entries(item.variant_info_snapshot.attributes || {}).map(([k,v]) => `${k}: ${v}`).join(', ') : null),
        quantity: item.quantity || 1,
        unitPrice: Number(item.unitPrice || item.price || 0),
        lineTotal: Number(item.unitPrice || item.price || 0) * (item.quantity || 1)
      })),
      store: {
        name: dbSettings?.['store_name'] || orderData.store_name || 'HYPERDRIVE',
        email: dbSettings?.['contact_email'] || dbSettings?.['support_email'] || orderData.store_email || 'support@hyperdrive.bd',
        phone: dbSettings?.['store_phone'] || dbSettings?.['contact_phone'] || orderData.store_phone || '+8801XXXXXXXXX',
        address: dbSettings?.['store_address'] || dbSettings?.['contact_address'] || orderData.store_address || 'Dhaka, Bangladesh',
        websiteUrl: process.env.APP_URL || 'https://hyperdrive.bd'
      }
    };

    const { subject, html, text } = renderOrderReceiptEmail(receiptData);

    const from = getFromAddress();
    const cleanEmail = customerEmail.trim();

    const res = await client.emails.send({
      from,
      to: cleanEmail,
      subject,
      html,
      text
    });

    if (res && (res as any).error) {
      const errObj = (res as any).error;
      console.warn(`[Resend Notice] ${errObj.name || 'validation_notice'}: ${errObj.message || 'Sandbox restriction'}`);
      return { success: false, warning: errObj.message };
    }

    return { success: true, data: res };
  } catch (error: any) {
    console.warn('[Email Service Notice]: Could not deliver order invoice via Resend:', error?.message || error);
    return { success: false, warning: error?.message || 'Email delivery skipped' };
  }
}

