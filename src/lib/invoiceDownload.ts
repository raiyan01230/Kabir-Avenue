/**
 * Utility for generating, printing, and downloading standalone A4 Invoices,
 * Shipping Labels, and Packing Slips for Bangladesh E-Commerce orders.
 */

export function getResolvedStoreName(settings?: Record<string, string> | null): string {
  if (!settings) return 'HYPERDRIVE E-COMMERCE';
  return (
    settings.store_name ||
    settings.storeName ||
    settings.site_name ||
    settings.store_title ||
    'HYPERDRIVE E-COMMERCE'
  );
}

export function generateOrderHtml(
  orders: any[],
  mode: 'invoice' | 'label' | 'packing' = 'invoice',
  storeSettings?: Record<string, string> | null
): string {
  const storeName = getResolvedStoreName(storeSettings);
  const hotline = storeSettings?.hotline_phone || storeSettings?.contact_phone || storeSettings?.support_phone || '+880 1700-000000';
  const email = storeSettings?.support_email || storeSettings?.contact_email || 'support@hyperdrive.bd';
  const address = storeSettings?.head_office_address || storeSettings?.contact_address || storeSettings?.address || 'Dhaka, Bangladesh';
  const websiteUrl = storeSettings?.website_url || 'www.hyperdrive.bd';
  const logoUrl = storeSettings?.logo_url || '';

  const ordersHtml = orders.map((order, index) => {
    const addr = (order.shipping_addresses && order.shipping_addresses[0]) || {};
    const cust = order.customers || {};
    const items = order.order_items || [];
    const isLast = index === orders.length - 1;
    const pageBreakClass = !isLast ? 'page-break' : '';

    if (mode === 'label') {
      return `
        <div class="label-card ${pageBreakClass}">
          <div class="label-header">
            <div>
              <h2 class="store-title">${storeName}</h2>
              <p class="subtitle">EXPRESS COURIER DELIVERY PARCEL</p>
            </div>
            <div class="text-right">
              <div class="order-badge">${order.order_number}</div>
              <div class="small-text">${new Date(order.created_at).toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="box sender-box">
              <div class="box-label">From (Sender):</div>
              <div class="box-name">${storeName}</div>
              <div class="box-desc">${address}</div>
              <div class="box-desc">Phone: ${hotline}</div>
              <div class="box-desc">Email: ${email}</div>
            </div>

            <div class="box recipient-box">
              <div class="box-label highlight">Deliver To (Recipient):</div>
              <div class="recipient-name">${addr.full_name || cust.full_name || 'Valued Customer'}</div>
              <div class="recipient-phone">📞 ${addr.phone || cust.phone || 'N/A'}</div>
              <div class="recipient-addr">${addr.full_address || 'Address on file'}</div>
              <div class="recipient-zone">${addr.thana ? `${addr.thana}, ` : ''}${addr.district || 'Dhaka'}, ${addr.division || 'Dhaka'}</div>
              <div class="zone-tag">Zone: ${addr.delivery_area || 'Inside Dhaka'}</div>
            </div>
          </div>

          <div class="payment-row">
            <div>
              <span class="muted">Payment Method: </span>
              <strong>${(order.payment_method || 'Cash on Delivery').toUpperCase()}</strong>
            </div>
            <div class="text-right">
              <span class="muted">Amount to Collect: </span>
              <strong class="total-amount">${order.payment_status === 'paid' ? '৳0 (PAID ONLINE)' : `৳${Number(order.total || 0).toLocaleString()} BDT`}</strong>
            </div>
          </div>

          <div class="label-footer">
            <span>Items: ${items.length} pcs | Standard Parcel</span>
            <span>Tracking: <strong>${order.tracking_code || order.order_number}</strong></span>
          </div>
        </div>
      `;
    }

    if (mode === 'packing') {
      const totalUnits = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0);
      return `
        <div class="invoice-container ${pageBreakClass}">
          <div class="header-row">
            <div>
              <h1 class="store-title">${storeName} — PACKING SLIP</h1>
              <p class="subtitle">Warehouse Dispatch & Fulfillment Document</p>
            </div>
            <div class="text-right">
              <div class="order-badge">${order.order_number}</div>
              <div class="small-text">Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}</div>
              <div class="small-text"><strong>Status:</strong> ${(order.order_status || 'confirmed').toUpperCase()}</div>
            </div>
          </div>

          <div class="grid-2 meta-grid">
            <div class="box">
              <div class="box-label">Recipient / Customer:</div>
              <div class="box-name">${addr.full_name || cust.full_name || 'Customer'}</div>
              <div class="box-desc">Phone: ${addr.phone || cust.phone || 'N/A'}</div>
              <div class="box-desc">${addr.full_address || ''}</div>
              <div class="box-desc">${addr.district || 'Dhaka'}, ${addr.division || 'Dhaka'} (${addr.delivery_area || 'Inside Dhaka'})</div>
            </div>
            <div class="box">
              <div class="box-label">Dispatch Notes:</div>
              <div class="note-box">${order.order_note || 'No special delivery instructions.'}</div>
              ${order.tracking_code ? `<div style="margin-top: 6px; font-size: 11px;"><strong>Courier Tracking:</strong> ${order.tracking_code}</div>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Item Description</th>
                <th style="width: 100px; text-align: center;">Qty Picked</th>
                <th style="width: 80px; text-align: center;">Checked</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it: any, i: number) => `
                <tr>
                  <td style="color: #666; font-weight: bold;">${i + 1}</td>
                  <td>
                    <strong>${it.product_name_snapshot || it.name || 'Product'}</strong>
                    ${it.products?.sku ? `<div class="sku-text">SKU: ${it.products.sku}</div>` : ''}
                  </td>
                  <td style="text-align: center; font-weight: 800; font-size: 13px;">${it.quantity}</td>
                  <td style="text-align: center;"><div class="check-box"></div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="grid-2 signatures-grid">
            <div>
              <div class="sig-line">Packed By: __________________________</div>
              <div class="sig-line" style="margin-top: 15px;">QC Verified By: ______________________</div>
            </div>
            <div class="text-right" style="font-size: 11px; color: #666;">
              <div>Total Package Units: <strong>${totalUnits}</strong></div>
              <div>Printed: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Default: Official A4 Tax Invoice
    const subtotal = Number(order.subtotal || 0);
    const shipping = Number(order.shipping_fee || 0);
    const discount = Number(order.discount || order.discount_amount || 0);
    const tax = Number(order.tax || 0);
    const total = Number(order.total || 0);

    return `
      <div class="invoice-container ${pageBreakClass}">
        <!-- Top Branding Header -->
        <div class="header-row">
          <div>
            <div class="brand-line">
              ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" class="brand-logo" />` : ''}
              <h1 class="store-title">${storeName}</h1>
            </div>
            <p class="invoice-tagline">OFFICIAL TAX INVOICE & DELIVERY NOTE</p>
            <div class="store-details">
              <div>${address}</div>
              <div>Hotline: ${hotline} | Email: ${email}</div>
              <div>Web: ${websiteUrl}</div>
            </div>
          </div>

          <div class="text-right">
            <div class="order-badge">${order.order_number}</div>
            <div class="small-text"><strong>Issue Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div class="small-text"><strong>Order Status:</strong> <span class="status-tag">${(order.order_status || 'confirmed').toUpperCase()}</span></div>
            <div class="small-text"><strong>Payment:</strong> ${(order.payment_method || 'Cash on Delivery').toUpperCase()} (${order.payment_status || 'Pending'})</div>
          </div>
        </div>

        <!-- Customer & Destination Grid -->
        <div class="grid-2 meta-grid">
          <div class="box">
            <div class="box-label">Billed & Sold To:</div>
            <div class="box-name">${addr.full_name || cust.full_name || 'Customer'}</div>
            <div class="box-desc"><strong>Phone:</strong> ${addr.phone || cust.phone || 'N/A'}</div>
            ${(addr.email || cust.email) ? `<div class="box-desc"><strong>Email:</strong> ${addr.email || cust.email}</div>` : ''}
            ${cust.id ? `<div class="box-desc" style="font-family: monospace; font-size: 10px;">ID: ${cust.id}</div>` : ''}
          </div>

          <div class="box">
            <div class="box-label">Shipment & Delivery Address:</div>
            <div class="box-name">${addr.full_name || cust.full_name || 'Recipient'}</div>
            <div class="box-desc">${addr.full_address || 'Address provided offline'}</div>
            <div class="box-desc"><strong>${addr.thana ? `${addr.thana}, ` : ''}${addr.district || 'Dhaka'}, ${addr.division || 'Dhaka'}</strong></div>
            <div class="box-desc" style="margin-top: 4px;"><strong>Zone:</strong> ${addr.delivery_area || 'Inside Dhaka'}</div>
          </div>
        </div>

        ${order.order_note ? `
          <div class="note-box" style="margin-bottom: 16px;">
            <strong>Order Notes / Instructions:</strong> ${order.order_note}
          </div>
        ` : ''}

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>Item Description</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 110px; text-align: right;">Unit Price (৳)</th>
              <th style="width: 120px; text-align: right;">Total (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${items.length === 0 ? `
              <tr><td colspan="5" style="text-align: center; color: #888; padding: 20px;">No line items found.</td></tr>
            ` : items.map((it: any, i: number) => {
              const lineTotal = Number(it.subtotal || (Number(it.unit_price) * Number(it.quantity)));
              return `
                <tr>
                  <td style="color: #666; font-weight: bold;">${i + 1}</td>
                  <td>
                    <strong>${it.product_name_snapshot || it.name || 'Product'}</strong>
                    ${it.products?.sku ? `<div class="sku-text">SKU: ${it.products.sku}</div>` : ''}
                  </td>
                  <td style="text-align: center; font-weight: bold;">${it.quantity}</td>
                  <td style="text-align: right;">৳${Number(it.unit_price).toLocaleString()}</td>
                  <td style="text-align: right; font-weight: bold;">৳${lineTotal.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Calculations & Totals -->
        <div class="totals-section">
          <div class="terms-column">
            <div><strong>Payment Terms:</strong> All invoices payable in Bangladeshi Taka (৳ BDT).</div>
            ${order.tracking_code ? `<div><strong>Courier Tracking Code:</strong> <code>${order.tracking_code}</code></div>` : ''}
            <div style="font-size: 10px; color: #666; font-style: italic; margin-top: 6px;">
              Thank you for ordering with ${storeName}. Keep this official document for warranty and parcel verification.
            </div>
          </div>

          <div class="calculation-card">
            <div class="calc-row">
              <span>Subtotal:</span>
              <span>৳${subtotal.toLocaleString()}</span>
            </div>
            <div class="calc-row">
              <span>Shipping Fee (${addr.delivery_area || 'Inside Dhaka'}):</span>
              <span>৳${shipping.toLocaleString()}</span>
            </div>
            ${discount > 0 ? `
              <div class="calc-row discount-row">
                <span>Promo Discount ${order.promo_code ? `(${order.promo_code})` : ''}:</span>
                <span>-৳${discount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${tax > 0 ? `
              <div class="calc-row">
                <span>Tax / VAT:</span>
                <span>৳${tax.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="grand-total-row">
              <span>Grand Total:</span>
              <span>৳${total.toLocaleString()} BDT</span>
            </div>
          </div>
        </div>

        <!-- Official Signatures -->
        <div class="grid-2 signatures-block">
          <div class="signature-cell">
            <div class="signature-title">Authorized Store Signature & Seal</div>
            <div class="signature-sub">${storeName} Fulfillment</div>
          </div>
          <div class="signature-cell">
            <div class="signature-title">Customer / Recipient Signature</div>
            <div class="signature-sub">Received in good condition & intact</div>
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${storeName} - Order Document</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      padding: 20px;
      line-height: 1.4;
      font-size: 12px;
    }
    .no-print-bar {
      max-width: 850px;
      margin: 0 auto 20px auto;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #059669;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #10b981;
    }
    .btn-secondary {
      background: #334155;
      color: #f8fafc;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    .invoice-container {
      max-width: 850px;
      margin: 0 auto 30px auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }

    .label-card {
      max-width: 580px;
      margin: 0 auto 30px auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      border: 2px dashed #94a3b8;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-line {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      height: 36px;
      width: auto;
      object-fit: contain;
    }
    .store-title {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #020617;
    }
    .invoice-tagline {
      font-size: 11px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .store-details {
      font-size: 11px;
      color: #475569;
      margin-top: 6px;
      line-height: 1.4;
    }
    .subtitle {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 2px;
    }
    .order-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-family: monospace;
      font-weight: 900;
      font-size: 14px;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .small-text {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .status-tag {
      color: #047857;
      font-weight: 700;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .meta-grid {
      margin-bottom: 20px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .box-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .box-label.highlight {
      color: #0f172a;
    }
    .box-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .box-desc {
      font-size: 11px;
      color: #334155;
      line-height: 1.4;
    }
    .recipient-name {
      font-size: 15px;
      font-weight: 900;
      color: #020617;
    }
    .recipient-phone {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0;
    }
    .recipient-addr {
      font-size: 11px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 4px;
    }
    .recipient-zone {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    .zone-tag {
      display: inline-block;
      margin-top: 6px;
      background: #0f172a;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .note-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      color: #78350f;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 10px 12px;
      text-align: left;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      color: #1e293b;
    }
    .sku-text {
      font-family: monospace;
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .check-box {
      width: 18px;
      height: 18px;
      border: 2px solid #94a3b8;
      border-radius: 4px;
      margin: 0 auto;
    }

    .totals-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-bottom: 24px;
    }
    .terms-column {
      max-width: 380px;
      font-size: 11px;
      color: #475569;
      line-height: 1.5;
    }
    .calculation-card {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #334155;
      margin-bottom: 6px;
    }
    .discount-row {
      color: #047857;
      font-weight: 600;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 2px solid #0f172a;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 900;
      color: #020617;
    }
    .grand-total-row span:last-child {
      color: #047857;
      font-size: 16px;
    }

    .signatures-block {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #cbd5e1;
    }
    .signature-cell {
      text-align: center;
      padding-top: 28px;
      border-top: 1px dashed #94a3b8;
    }
    .signature-title {
      font-size: 11px;
      font-weight: 800;
      color: #1e293b;
    }
    .signature-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }

    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 10px 0;
      margin: 12px 0;
      font-size: 11px;
    }
    .total-amount {
      font-size: 15px;
      font-weight: 900;
      color: #020617;
    }
    .label-footer {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      padding-top: 4px;
    }

    .text-right { text-align: right; }
    .muted { color: #64748b; font-weight: 700; font-size: 10px; text-transform: uppercase; }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .invoice-container, .label-card {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 auto !important;
        max-width: 100% !important;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm 15mm 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>${storeName}</strong> &bull; ${orders.length} Order Document(s) Ready
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  ${ordersHtml}
</body>
</html>`;
}

/**
 * Triggers a direct browser file download (.html document format) that the user can open, share, or print anywhere.
 */
export function downloadOrdersHtml(
  orders: any[],
  mode: 'invoice' | 'label' | 'packing' = 'invoice',
  storeSettings?: Record<string, string> | null,
  customFilename?: string
): void {
  const storeName = getResolvedStoreName(storeSettings);
  const htmlContent = generateOrderHtml(orders, mode, storeSettings);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  let filename = customFilename;
  if (!filename) {
    const cleanStore = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (orders.length === 1) {
      filename = `${cleanStore}-${mode}-${orders[0].order_number || 'order'}.html`;
    } else {
      filename = `${cleanStore}-${mode}-batch-${orders.length}-orders.html`;
    }
  }

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Opens a clean, standalone top-level browser popup window and triggers print.
 * This completely circumvents iframe sandboxes and preview environment blockers.
 */
export function openPrintWindow(
  orders: any[],
  mode: 'invoice' | 'label' | 'packing' = 'invoice',
  storeSettings?: Record<string, string> | null
): boolean {
  try {
    const htmlContent = generateOrderHtml(orders, mode, storeSettings);
    const printWindow = window.open('', '_blank', 'width=950,height=800,menubar=no,toolbar=no,location=no,status=no');

    if (!printWindow) {
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Auto trigger print in the popup window once loaded
    printWindow.onload = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.warn('Popup print trigger warning:', e);
      }
    };

    return true;
  } catch (err) {
    console.error('Failed to open clean print window:', err);
    return false;
  }
}
