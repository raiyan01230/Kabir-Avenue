import { useEffect, useState } from 'react';
import { Truck, MapPin, Phone } from 'lucide-react';

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/deliveries')
      .then(r => r.json())
      .then(data => {
        setDeliveries(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Delivery Management</h1>
        <p className="text-xs text-slate-400 mt-1">Track shipping locations, districts, and courier statuses across Bangladesh</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Order #</th>
              <th className="pb-3">Recipient</th>
              <th className="pb-3">Delivery Address</th>
              <th className="pb-3">Area / Fee</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading deliveries...</td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No delivery records.</td></tr>
            ) : (
              deliveries.map((d, idx) => {
                const addr = d.shipping_addresses?.[0];
                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-white">{d.order_number}</td>
                    <td className="py-3">
                      <div className="font-medium text-slate-200">{addr?.full_name || d.customers?.full_name}</div>
                      <div className="text-[10px] text-slate-400">{addr?.phone || d.customers?.phone}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <div>{addr?.full_address || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{addr?.district}, {addr?.division}</div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-white">{addr?.delivery_area || 'Inside Dhaka'}</span>
                      <div className="text-[10px] text-emerald-400">৳{addr?.shipping_fee || 70}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {d.order_status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
