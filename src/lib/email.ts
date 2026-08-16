import { Resend } from 'resend';

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

    const res = await client.emails.send({
      from,
      to: cleanEmail,
      subject: `Your HYPERDRIVE Account Has Been Created Successfully!`,
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
              <h1>HYPERDRIVE</h1>
              <p>Authentic Enthusiast Hardware &bull; Bangladesh</p>
            </div>
            <div class="content">
              <div class="badge">&#10003; Account Active &amp; Verified</div>
              <p class="welcome-text">Hello <strong>${customer.fullName}</strong>,</p>
              <p class="welcome-text">
                Welcome to HYPERDRIVE! Your account is active. You can now browse our catalog, save items to your wishlist, track orders live, and checkout with fast dispatch across Bangladesh.
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
                <a href="${process.env.APP_URL || 'https://hyperdrive.bd'}" class="btn">Explore Hardware Catalog</a>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
                Fast Nationwide Courier Dispatch Available
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} HYPERDRIVE Bangladesh. Official Warranty Guaranteed.</p>
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

    const itemsRows = items.map((item: any) => {
      const name = item.product?.name || item.name || item.product_name_snapshot || 'Product Item';
      const price = Number(item.unitPrice || item.price || 0);
      const qty = item.quantity || 1;
      const total = price * qty;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;">
            <strong>${name}</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; text-align: center;">
            ${qty}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; text-align: right; font-weight: 600;">
            ৳${price.toLocaleString()}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; text-align: right; font-weight: 700;">
            ৳${total.toLocaleString()}
          </td>
        </tr>
      `;
    }).join('');

    const trackingUrl = `${process.env.APP_URL || 'https://hyperdrive.bd'}/track/${orderNumber}`;
    const from = getFromAddress();
    const cleanEmail = customerEmail.trim();

    const res = await client.emails.send({
      from,
      to: cleanEmail,
      subject: `Invoice & Order Confirmation - #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0f172a; color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
            .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
            .content { padding: 32px 24px; }
            .badge { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
            .btn { background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; }
            .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HYPERDRIVE</h1>
              <p>Official Invoice &amp; Dispatch Order #${orderNumber}</p>
            </div>

            <div class="content">
              <div class="badge">&#10003; Order Confirmed &amp; In Queue</div>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 0;">
                Thank you for your order with <strong>HYPERDRIVE Bangladesh</strong>! We have received your order details and are preparing package inspection and dispatch.
              </p>

              <!-- Delivery Address Summary -->
              ${shipping.full_name ? `
              <div class="card">
                <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; letter-spacing: 0.05em;">
                  Delivery Information
                </div>
                <div style="font-size: 14px; color: #334155; line-height: 1.5;">
                  <strong>Recipient:</strong> ${shipping.full_name} (${shipping.phone || 'N/A'})<br/>
                  <strong>Address:</strong> ${shipping.full_address || ''}, ${shipping.thana || ''}, ${shipping.district || ''}, ${shipping.division || ''}<br/>
                  <strong>Delivery Zone:</strong> ${shipping.delivery_area || 'Standard Bangladesh Delivery'}
                </div>
              </div>` : ''}

              <!-- Item Snapshot Table -->
              <div style="margin-bottom: 24px;">
                <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; letter-spacing: 0.05em;">
                  Order Items Breakdown
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">
                      <th style="text-align: left; padding-bottom: 8px;">Item</th>
                      <th style="text-align: center; padding-bottom: 8px;">Qty</th>
                      <th style="text-align: right; padding-bottom: 8px;">Unit Price</th>
                      <th style="text-align: right; padding-bottom: 8px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>
              </div>

              <!-- Financial Summary -->
              <div class="card" style="margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">৳${Number(orderData.subtotal || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Shipping Fee:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">৳${Number(orderData.shipping_fee || 70).toLocaleString()}</td>
                  </tr>
                  ${Number(orderData.discount || 0) > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #16a34a;">Discount Applied${orderData.promo_code ? ` (${orderData.promo_code})` : ''}:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #16a34a;">-৳${Number(orderData.discount).toLocaleString()}</td>
                  </tr>` : ''}
                  <tr style="border-top: 1px solid #cbd5e1;">
                    <td style="padding: 10px 0 0 0; font-weight: 800; font-size: 16px; color: #0f172a;">Total Payable:</td>
                    <td style="padding: 10px 0 0 0; text-align: right; font-weight: 900; font-size: 18px; color: #0f172a;">৳${Number(orderData.total || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-size: 12px;">Payment Method:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 12px; text-transform: uppercase;">${(orderData.payment_method || 'Cash on Delivery')}</td>
                  </tr>
                </table>
              </div>

              <!-- Track Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${trackingUrl}" class="btn">Track Package in Realtime &rarr;</a>
              </div>
            </div>

            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} HYPERDRIVE Bangladesh. All products covered by 7-day exchange warranty.</p>
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
    console.warn('[Email Service Notice]: Could not deliver order invoice via Resend:', error?.message || error);
    return { success: false, warning: error?.message || 'Email delivery skipped' };
  }
}

