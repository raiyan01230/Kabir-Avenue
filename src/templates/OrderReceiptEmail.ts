export interface OrderReceiptData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    division: string;
    district: string;
    thana: string;
    deliveryArea: string;
    address: string;
    note?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    variant?: string;
  }>;
  store: {
    name: string;
    logoUrl?: string;
    email: string;
    phone: string;
    address: string;
    websiteUrl: string;
    founderName?: string;
    signatureUrl?: string;
  };
}

function formatTaka(amount: number) {
  return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderOrderReceiptEmail(data: OrderReceiptData): { subject: string; html: string; text: string } {
  const subject = `Order Confirmed — #${data.order.orderNumber}`;
  
  const orderDate = new Date(data.order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const itemsHtml = data.items.map(item => `
    <tr bgcolor="#eeeeee">
      <td style="padding:14px 12px; font-size:13px; color:#333; border-bottom:1px solid #ffffff;">
        <strong>${item.name}</strong>
        ${item.variant ? `<br/><span style="font-size:11px; color:#666;">${item.variant}</span>` : ''}
      </td>
      <td style="padding:14px 12px; font-size:13px; color:#333; border-bottom:1px solid #ffffff;" align="center">${item.quantity}</td>
      <td style="padding:14px 12px; font-size:13px; color:#333; border-bottom:1px solid #ffffff;" align="center">${formatTaka(item.unitPrice)}</td>
      <td style="padding:14px 12px; font-size:13px; color:#333; border-bottom:1px solid #ffffff;" align="right">${formatTaka(item.lineTotal)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Invoice ${data.order.orderNumber}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f4f4f1; }

  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; }
    .stack-col { display: block !important; width: 100% !important; text-align: left !important; }
    .fluid-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .invoice-title { font-size: 40px !important; }
    .thank-you { font-size: 32px !important; }
    .item-table td { font-size: 12px !important; padding: 8px 6px !important; }
    .hide-mobile { display: none !important; }
    .totals-cell { text-align: left !important; padding-left: 0 !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f1;">
<div style="display:none; max-height:0; overflow:hidden;">
  Your order ${data.order.orderNumber} has been successfully received.
</div>

<center style="width:100%; background-color:#f4f4f1;">
<!--[if mso]>
<table role="presentation" width="620" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
<![endif]-->
<table role="presentation" class="email-container" width="620" cellpadding="0" cellspacing="0" border="0" align="center" style="width:620px; max-width:620px; margin:0 auto; background-color:#ffffff;">

  <!-- Top spacer / floral corner -->
  <tr>
    <td style="padding:36px 40px 0 40px; font-family:Arial, Helvetica, sans-serif;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:14px; letter-spacing:2px; color:#3a5a34; font-weight:bold; text-transform:uppercase;">
            ${orderDate}
          </td>
          <td align="right" style="width:90px;" class="hide-mobile">
            <img src="https://em-content.zobj.net/source/apple/391/hibiscus_1f33a.png" width="70" alt="" style="display:block; opacity:0.85;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- INVOICE title -->
  <tr>
    <td style="padding:6px 40px 0 40px; font-family:Arial, Helvetica, sans-serif;" class="fluid-pad">
      <div class="invoice-title" style="font-size:52px; font-weight:800; color:#3a5a34; letter-spacing:1px; font-family:'Trebuchet MS', Arial, sans-serif;">
        INVOICE
      </div>
    </td>
  </tr>

  <!-- Invoice number box -->
  <tr>
    <td style="padding:14px 40px 20px 40px;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="#ececec" style="padding:14px 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; color:#333333;">
            ${data.order.orderNumber}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- divider -->
  <tr>
    <td style="padding:0 40px;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="border-top:2px solid #222222; font-size:1px; line-height:1px;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

  <!-- Customer details -->
  <tr>
    <td style="padding:22px 40px 10px 40px; font-family:Arial, Helvetica, sans-serif;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="stack-col" valign="top" width="50%">
            <div style="font-size:18px; font-weight:bold; color:#3a5a34; margin-bottom:6px;">
              Customer Details:
            </div>
            <div style="font-size:14px; color:#333333; line-height:22px;">
              <strong>${data.customer.name}</strong><br/>
              ${data.customer.phone}<br/>
              <a href="mailto:${data.customer.email}" style="color:#333; text-decoration:none;">${data.customer.email}</a>
            </div>
          </td>
          <td class="stack-col" valign="top" width="50%">
            <div style="font-size:18px; font-weight:bold; color:#3a5a34; margin-bottom:6px;">
              Shipping Address:
            </div>
            <div style="font-size:14px; color:#333333; line-height:22px;">
              ${data.shippingAddress.address}<br/>
              ${data.shippingAddress.thana}, ${data.shippingAddress.district}<br/>
              ${data.shippingAddress.division}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Item table -->
  <tr>
    <td style="padding:28px 40px 0 40px;" class="fluid-pad">
      <table role="presentation" class="item-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; font-family:Arial, Helvetica, sans-serif;">
        <tr bgcolor="#3a5a34">
          <td style="padding:14px 12px; color:#ffffff; font-size:13px; font-weight:bold; letter-spacing:1px;">DESCRIPTION</td>
          <td style="padding:14px 12px; color:#ffffff; font-size:13px; font-weight:bold; letter-spacing:1px;" align="center">QTY</td>
          <td style="padding:14px 12px; color:#ffffff; font-size:13px; font-weight:bold; letter-spacing:1px;" align="center">PRICE</td>
          <td style="padding:14px 12px; color:#ffffff; font-size:13px; font-weight:bold; letter-spacing:1px;" align="right">AMOUNT</td>
        </tr>
        ${itemsHtml}
      </table>
    </td>
  </tr>

  <!-- Payment details + Totals -->
  <tr>
    <td style="padding:30px 40px 10px 40px; font-family:Arial, Helvetica, sans-serif;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- Payment details -->
          <td class="stack-col" valign="top" width="55%" style="width:55%;">
            <div style="font-size:15px; font-weight:bold; color:#3a5a34; letter-spacing:0.5px; margin-bottom:10px;">
              PAYMENT DETAILS:
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="top" style="font-size:13px; font-weight:bold; color:#3a5a34; padding-right:16px; line-height:20px;">
                  ${data.store.name}
                </td>
                <td valign="top" style="font-size:13px; line-height:20px;">
                  <span style="font-weight:bold; color:#3a5a34;">Method:</span><br/>
                  <span style="color:#333333;">${data.order.paymentMethod}</span>
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 25px;">
                <a href="${data.store.websiteUrl}/track/${data.order.id}" style="background-color: #3a5a34; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">TRACK ORDER</a>
            </div>
          </td>

          <!-- Totals -->
          <td class="stack-col totals-cell" valign="top" width="45%" style="width:45%; padding-top:10px;" align="right">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="right" style="font-size:14px; font-weight:bold; color:#3a5a34; padding:4px 0;">SUBTOTAL:</td>
                <td align="right" style="font-size:14px; color:#333; padding:4px 0; width:90px;">${formatTaka(data.order.subtotal)}</td>
              </tr>
              <tr>
                <td align="right" style="font-size:14px; font-weight:bold; color:#3a5a34; padding:4px 0;">DISCOUNT:</td>
                <td align="right" style="font-size:14px; color:#333; padding:4px 0;">-${formatTaka(data.order.discount)}</td>
              </tr>
              <tr>
                <td align="right" style="font-size:14px; font-weight:bold; color:#3a5a34; padding:4px 0;">SHIPPING:</td>
                <td align="right" style="font-size:14px; color:#333; padding:4px 0;">${formatTaka(data.order.shipping)}</td>
              </tr>
              <tr>
                <td align="right" style="font-size:14px; font-weight:bold; color:#3a5a34; padding:4px 0;">TAX:</td>
                <td align="right" style="font-size:14px; color:#333; padding:4px 0;">${formatTaka(data.order.tax)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:10px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#3a5a34">
                    <tr>
                      <td align="right" style="padding:12px 16px; color:#ffffff; font-size:15px; font-weight:bold; letter-spacing:0.5px;">
                        TOTAL: ${formatTaka(data.order.total)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Signature + Thank you -->
  <tr>
    <td style="padding:40px 40px 10px 40px; font-family:Arial, Helvetica, sans-serif;" class="fluid-pad">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="stack-col" valign="bottom" width="55%">
            <div style="font-family:'Brush Script MT', 'Lucida Handwriting', 'Snell Roundhand', 'Great Vibes', cursive; font-size:36px; font-weight:normal; color:#333333; padding-bottom: 4px;">Raiyan</div>
            <div style="border-top:2px solid #222222; width:220px; margin-top:4px; margin-bottom:8px;"></div>
            <div style="font-size:13px; font-weight:bold; color:#3a5a34; line-height:19px;">
              Signature &amp; founder of<br/>${data.store.name}
            </div>
          </td>
          <td class="stack-col" valign="middle" width="45%" align="right">
            <div class="thank-you" style="font-size:38px; font-weight:800; color:#3a5a34; line-height:42px; font-family:'Trebuchet MS', Arial, sans-serif; text-align:right;">
              THANK<br/>YOU
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Bottom spacer -->
  <tr>
    <td style="padding:30px 40px 40px 40px; font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#999999; text-align:center; border-top:1px solid #eeeeee;" class="fluid-pad">
      This invoice was sent by ${data.store.name} · <a href="mailto:${data.store.email}" style="color:#999;">${data.store.email}</a> · ${data.store.phone}<br/>
      ${data.store.address}
    </td>
  </tr>

</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</center>
</body>
</html>`;

  const text = `
INVOICE #${data.order.orderNumber}
Date: ${orderDate}

CUSTOMER DETAILS
Name: ${data.customer.name}
Phone: ${data.customer.phone}
Email: ${data.customer.email}

SHIPPING ADDRESS
${data.shippingAddress.address}
${data.shippingAddress.thana}, ${data.shippingAddress.district}
${data.shippingAddress.division}

ITEMS:
${data.items.map(item => `- ${item.quantity}x ${item.name} @ ${formatTaka(item.unitPrice)} = ${formatTaka(item.lineTotal)}`).join('\n')}

Subtotal: ${formatTaka(data.order.subtotal)}
Discount: -${formatTaka(data.order.discount)}
Shipping: ${formatTaka(data.order.shipping)}
Tax: ${formatTaka(data.order.tax)}
TOTAL: ${formatTaka(data.order.total)}

Payment Method: ${data.order.paymentMethod}

Track your order: ${data.store.websiteUrl}/track/${data.order.id}

Thank you for shopping with ${data.store.name}.
  `.trim();

  return { subject, html, text };
}
