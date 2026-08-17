import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getStoreSettings } from '../../lib/queries';
import { getResolvedStoreName } from '../../lib/invoiceDownload';

interface PrintableOrdersProps {
  orders: any[];
  mode?: 'invoice' | 'label' | 'packing' | 'multi';
  storeSettings?: Record<string, string> | null;
  sections?: {
    customer?: boolean;
    shipping?: boolean;
    products?: boolean;
    pricing?: boolean;
    payment?: boolean;
    notes?: boolean;
    tracking?: boolean;
  };
}

export default function PrintableOrders({
  orders,
  mode = 'invoice',
  storeSettings: propStoreSettings,
  sections = {
    customer: true,
    shipping: true,
    products: true,
    pricing: true,
    payment: true,
    notes: true,
    tracking: true
  }
}: PrintableOrdersProps) {
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>(propStoreSettings || {});

  useEffect(() => {
    if (propStoreSettings && Object.keys(propStoreSettings).length > 0) {
      setStoreSettings(propStoreSettings);
      return;
    }

    let isMounted = true;
    async function loadSettings() {
      try {
        const fetched = await getStoreSettings();
        if (isMounted && fetched && Object.keys(fetched).length > 0) {
          setStoreSettings(fetched);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch from getStoreSettings:', err);
      }

      // Supabase direct fallback if API is not reached
      try {
        const { data } = await supabase.from('store_settings').select('*');
        if (isMounted && data && Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => {
            if (row.setting_key && row.setting_value !== undefined) {
              map[row.setting_key] = row.setting_value;
            }
          });
          setStoreSettings(map);
        }
      } catch (e) {
        console.warn('Supabase fallback store settings read error:', e);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [propStoreSettings]);

  if (!orders || orders.length === 0) return null;

  const resolvedStoreName = getResolvedStoreName(storeSettings);
  const resolvedPhone = storeSettings.hotline_phone || storeSettings.contact_phone || storeSettings.support_phone || '+880 1700-000000';
  const resolvedEmail = storeSettings.support_email || storeSettings.contact_email || 'support@hyperdrive.bd';
  const resolvedAddress = storeSettings.head_office_address || storeSettings.contact_address || storeSettings.address || 'Dhaka, Bangladesh';
  const resolvedLogo = storeSettings.logo_url || '';
  const resolvedWebsite = storeSettings.website_url || 'www.hyperdrive.bd';

  return (
    <div className="printable-container bg-white text-slate-900 font-sans p-0 m-0 w-full" id="printable-order-documents">
      {orders.map((order, i) => {
        const addr = (order.shipping_addresses && order.shipping_addresses[0]) || {};
        const customer = order.customers || {};
        const items = order.order_items || [];
        const isLast = i === orders.length - 1;

        // Shipping Label Mode
        if (mode === 'label') {
          return (
            <div
              key={order.id || i}
              className={`p-6 border-2 border-dashed border-slate-400 rounded-2xl bg-white max-w-xl mx-auto my-4 print:my-0 print:border-2 print:border-black ${
                !isLast ? 'print-page-break mb-8' : ''
              } print-avoid-break`}
            >
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    {resolvedStoreName}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                    EXPRESS COURIER DELIVERY PARCEL
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black bg-slate-900 text-white px-2 py-1 rounded inline-block font-mono">
                    {order.order_number}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">From (Sender):</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{resolvedStoreName}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{resolvedAddress}</div>
                  <div className="text-slate-600 text-[11px]">Phone: {resolvedPhone}</div>
                  <div className="text-slate-600 text-[11px]">Email: {resolvedEmail}</div>
                </div>

                <div className="p-3 bg-slate-100 border-2 border-slate-900 rounded-xl">
                  <div className="text-[10px] font-black text-slate-900 uppercase">Deliver To (Recipient):</div>
                  <div className="font-black text-slate-950 text-base mt-0.5">
                    {addr.full_name || customer.full_name || 'Customer'}
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5 font-mono">
                    📞 {addr.phone || customer.phone || 'N/A'}
                  </div>
                  <div className="text-slate-800 font-semibold text-xs mt-1 leading-snug">
                    {addr.full_address || 'Address on file'}
                  </div>
                  <div className="text-slate-700 text-xs font-bold mt-1">
                    {addr.thana ? `${addr.thana}, ` : ''}{addr.district || 'Dhaka'}, {addr.division || 'Dhaka'}
                  </div>
                  <div className="mt-1 inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase">
                    Zone: {addr.delivery_area || 'Inside Dhaka'}
                  </div>
                </div>
              </div>

              <div className="border-t border-b border-slate-300 py-3 my-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Payment Method: </span>
                  <span className="font-black text-slate-900 uppercase ml-1">{order.payment_method || 'Cash on Delivery'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Amount to Collect: </span>
                  <span className="font-black text-base text-slate-950 ml-1">
                    {order.payment_status === 'paid' ? '৳0 (PAID ONLINE)' : `৳${Number(order.total || 0).toLocaleString()} BDT`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2">
                <span>Items: {items.length} pcs | Package Weight: Standard</span>
                <span className="font-mono text-slate-800 font-bold">Tracking: {order.tracking_code || order.order_number}</span>
              </div>
            </div>
          );
        }

        // Packing Slip Mode
        if (mode === 'packing') {
          return (
            <div
              key={order.id || i}
              className={`p-8 bg-white max-w-3xl mx-auto my-4 print:my-0 print:p-0 ${
                !isLast ? 'print-page-break mb-12' : ''
              } print-avoid-break`}
            >
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-900">
                    {resolvedStoreName} — PACKING SLIP
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">Warehouse Dispatch &amp; Fulfillment Document</p>
                </div>
                <div className="text-right text-xs">
                  <div className="text-base font-black text-slate-900 font-mono">#{order.order_number}</div>
                  <div className="text-slate-600">Date: {new Date(order.created_at).toLocaleDateString('en-GB')}</div>
                  <div className="mt-1 font-bold text-slate-800 uppercase">Status: {order.order_status}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Customer / Recipient:</div>
                  <div className="font-bold text-slate-900 text-sm">{addr.full_name || customer.full_name || 'Customer'}</div>
                  <div className="text-slate-700 mt-0.5">Phone: {addr.phone || customer.phone || 'N/A'}</div>
                  <div className="text-slate-600 mt-0.5">{addr.full_address}</div>
                  <div className="text-slate-600">{addr.district}, {addr.division} ({addr.delivery_area || 'Inside Dhaka'})</div>
                </div>
                <div>
                  <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Dispatch Notes:</div>
                  <div className="text-slate-800 bg-white p-2.5 rounded border border-slate-200 text-xs italic">
                    {order.order_note || 'No special delivery instructions provided.'}
                  </div>
                  {order.tracking_code && (
                    <div className="mt-2 text-xs font-bold text-slate-900">
                      Tracking Code: <span className="font-mono">{order.tracking_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <table className="w-full text-xs border-collapse border border-slate-200 mb-6">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                    <th className="py-2.5 px-3 text-left w-12">#</th>
                    <th className="py-2.5 px-3 text-left">Item Description</th>
                    <th className="py-2.5 px-3 text-center w-24">Qty Picked</th>
                    <th className="py-2.5 px-3 text-center w-24">Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs">{item.product_name_snapshot || item.name || 'Product'}</div>
                        {item.products?.sku && (
                          <div className="text-[10px] text-slate-500 font-mono">SKU: {item.products.sku}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-sm text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="w-5 h-5 border-2 border-slate-400 rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-6 text-xs pt-4 border-t border-slate-300">
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 font-semibold">Packed By: </span>
                    <span className="border-b border-slate-400 inline-block w-40 pb-0.5"></span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Quality Checked By: </span>
                    <span className="border-b border-slate-400 inline-block w-36 pb-0.5"></span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 flex flex-col justify-end">
                  <div>Total Units: {items.reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0)}</div>
                  <div>Printed on: {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          );
        }

        // Default: Professional A4 Tax Invoice & Official Delivery Note
        return (
          <div
            key={order.id || i}
            className={`printable-invoice p-8 bg-white max-w-4xl mx-auto my-6 print:my-0 print:p-0 print:max-w-none text-slate-900 ${
              !isLast ? 'print-page-break mb-12' : ''
            }`}
          >
            {/* Header / Store Branding */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {resolvedLogo && (
                    <img
                      src={resolvedLogo}
                      alt={resolvedStoreName}
                      className="h-10 w-auto object-contain"
                    />
                  )}
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {resolvedStoreName}
                  </h1>
                </div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Official Tax Invoice &amp; Customer Delivery Note
                </p>
                <div className="text-[11px] text-slate-600 leading-tight pt-1 space-y-0.5">
                  <div>{resolvedAddress}</div>
                  <div className="flex flex-wrap gap-x-4">
                    <span>Hotline: {resolvedPhone}</span>
                    <span>Email: {resolvedEmail}</span>
                    {resolvedWebsite && <span>Web: {resolvedWebsite}</span>}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-black text-sm rounded-md tracking-wider">
                  {order.order_number}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Date: </span>
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Status: </span>
                  <span className="font-bold uppercase text-emerald-700">{order.order_status}</span>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Payment: </span>
                  <span className="font-bold uppercase text-slate-900">
                    {order.payment_method || 'Cash on Delivery'} ({order.payment_status || 'Pending'})
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Shipping Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6 print-avoid-break">
              {sections.customer && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Billed &amp; Sold To:
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {addr.full_name || customer.full_name || 'Customer'}
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Phone: </span>
                    {addr.phone || customer.phone || 'N/A'}
                  </div>
                  {(addr.email || customer.email) && (
                    <div className="text-slate-700">
                      <span className="font-semibold">Email: </span>
                      {addr.email || customer.email}
                    </div>
                  )}
                  {customer.id && (
                    <div className="text-[10px] text-slate-500 font-mono">Customer ID: {customer.id}</div>
                  )}
                </div>
              )}

              {sections.shipping && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Shipment &amp; Destination:
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {addr.full_name || customer.full_name || 'Recipient'}
                  </div>
                  <div className="text-slate-700 font-medium leading-snug">
                    {addr.full_address || 'Address provided offline'}
                  </div>
                  <div className="text-slate-800 font-bold">
                    {addr.thana ? `${addr.thana}, ` : ''}{addr.district || 'Dhaka'}, {addr.division || 'Dhaka'}
                  </div>
                  <div className="text-slate-700 pt-0.5">
                    <span className="font-semibold">Delivery Area: </span>
                    <span className="font-bold text-slate-900">{addr.delivery_area || 'Inside Dhaka'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Note Banner if present */}
            {sections.notes && order.order_note && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs mb-6 print-avoid-break">
                <span className="font-bold text-amber-900 uppercase text-[10px]">Order Notes / Instructions: </span>
                <span className="text-amber-950 font-medium ml-1">{order.order_note}</span>
              </div>
            )}

            {/* Product Items Table */}
            {sections.products && (
              <div className="mb-6 print-avoid-break">
                <table className="w-full text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3 text-left w-10">#</th>
                      <th className="py-2.5 px-3 text-left">Item Description</th>
                      <th className="py-2.5 px-3 text-center w-16">Qty</th>
                      <th className="py-2.5 px-3 text-right w-28">Unit Price (৳)</th>
                      <th className="py-2.5 px-3 text-right w-32">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 italic">No item records attached to this order.</td>
                      </tr>
                    ) : (
                      items.map((item: any, idx: number) => {
                        const itemSub = Number(item.subtotal || item.unit_price * item.quantity);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 text-xs">
                                {item.product_name_snapshot || item.name || 'Product'}
                              </div>
                              {item.products?.sku && (
                                <div className="text-[10px] text-slate-500 font-mono">SKU: {item.products.sku}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              ৳{Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-950">
                              ৳{itemSub.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Calculations & Summary Section */}
            {sections.pricing && (
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-4 mb-8 print-avoid-break">
                <div className="text-xs text-slate-600 max-w-sm space-y-2">
                  <div>
                    <span className="font-bold text-slate-800">Payment Terms: </span>
                    <span>All invoices are payable in Bangladeshi Taka (BDT ৳).</span>
                  </div>
                  {order.tracking_code && (
                    <div>
                      <span className="font-bold text-slate-800">Courier Tracking #: </span>
                      <span className="font-mono font-bold text-slate-900">{order.tracking_code}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 italic pt-1">
                    Thank you for ordering with {resolvedStoreName}. Please retain this official invoice as proof of warranty and delivery.
                  </div>
                </div>

                <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">৳{Number(order.subtotal || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-slate-700">
                    <span>Shipping ({addr.delivery_area || 'Inside Dhaka'}):</span>
                    <span className="font-semibold text-slate-900">৳{Number(order.shipping_fee || 0).toLocaleString()}</span>
                  </div>

                  {Number(order.discount || order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount {order.promo_code ? `(${order.promo_code})` : ''}:</span>
                      <span>-৳{Number(order.discount || order.discount_amount).toLocaleString()}</span>
                    </div>
                  )}

                  {Number(order.tax || 0) > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Tax / VAT:</span>
                      <span className="font-semibold text-slate-900">৳{Number(order.tax).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-900 pt-2.5 flex justify-between items-baseline font-black text-base text-slate-950">
                    <span>Grand Total:</span>
                    <span className="text-lg text-emerald-700">৳{Number(order.total || 0).toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>
            )}

            {/* Signature & Confirmation Block */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-8 border-t border-slate-300 mt-6 print-avoid-break">
              <div className="text-center pt-8 border-t border-dashed border-slate-400">
                <div className="font-bold text-slate-800">Authorized Store Signature &amp; Seal</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{resolvedStoreName} Management</div>
              </div>

              <div className="text-center pt-8 border-t border-dashed border-slate-400">
                <div className="font-bold text-slate-800">Customer / Recipient Signature</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Received in good condition &amp; verified</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
