import { useEffect, useState } from 'react';
import { Users, Star, Tag, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function AdminCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Advanced CRM &amp; VIP Customer Management</h1>
        <p className="text-xs text-slate-400 mt-1">Manage customer segments, VIP tags, internal admin notes, and lifetime order analytics</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Customer Profile</th>
              <th className="pb-3">Contact Information</th>
              <th className="pb-3">Segment Tag</th>
              <th className="pb-3">Orders &amp; Spending</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading CRM data...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No customers registered yet.</td></tr>
            ) : (
              customers.map(c => {
                const totalSpend = (c.orders || []).reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
                const orderCount = (c.orders || []).length;
                const isVip = totalSpend > 5000 || orderCount >= 3;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                          {(c.full_name?.[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <div>{c.full_name || 'Customer'}</div>
                          <div className="text-[10px] text-slate-400">Registered: {new Date(c.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</div>
                      <div className="text-slate-400 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-slate-400" /> {c.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isVip ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isVip ? 'VIP Customer' : 'Regular Customer'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-emerald-400">৳{totalSpend.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{orderCount} total orders</div>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => alert(`Customer ID: ${c.id}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}`)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                        View Profile
                      </button>
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
