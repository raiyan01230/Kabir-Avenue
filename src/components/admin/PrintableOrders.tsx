import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PrintableOrders({ orders }: { orders: any[] }) {
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .single()
      .then(({ data }) => setStoreSettings(data));
  }, []);

  if (!orders || orders.length === 0) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans overflow-auto">
      {orders.map((order, i) => (
        <div key={order.id} className={`max-w-2xl mx-auto space-y-6 ${i < orders.length - 1 ? 'page-break-after-always' : ''}`}>
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-black">{storeSettings?.store_name || 'HYPERDRIVE E-COMMERCE'}</h1>
              <p className="text-xs text-slate-600">Official Invoice & Delivery Note</p>
              <div className="text-xs mt-2 text-slate-500">
                {storeSettings?.support_email && <div>Email: {storeSettings.support_email}</div>}
                {storeSettings?.support_phone && <div>Phone: {storeSettings.support_phone}</div>}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold">Order #: {order.order_number}</div>
              <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="font-bold mb-1">Customer Details:</h3>
              <div>{order.customers?.full_name || order.shipping_addresses?.[0]?.full_name}</div>
              <div>Phone: {order.customers?.phone || order.shipping_addresses?.[0]?.phone}</div>
            </div>
            <div>
              <h3 className="font-bold mb-1">Shipping Address:</h3>
              <div>{order.shipping_addresses?.[0]?.full_address}</div>
              <div>Area: {order.shipping_addresses?.[0]?.delivery_area}</div>
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-100">
                <th className="py-2 text-left">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((item: any, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item.product_name_snapshot}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">৳{Number(item.unit_price).toLocaleString()}</td>
                  <td className="py-2 text-right">৳{Number(item.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal:</span><span>৳{Number(order.subtotal).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping Fee:</span><span>৳{Number(order.shipping_fee || 0).toLocaleString()}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between"><span>Discount:</span><span>-৳{Number(order.discount_amount).toLocaleString()}</span></div>
              )}
              <div className="flex justify-between font-bold text-sm border-t pt-2"><span>Total:</span><span>৳{Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
