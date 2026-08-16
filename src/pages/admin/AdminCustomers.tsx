import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

export default function AdminCustomers() {
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
        <h1 className="text-2xl font-extrabold text-white">Customer Management</h1>
        <p className="text-xs text-slate-400 mt-1">View registered storefront users and account histories</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Customer Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3">Total Orders</th>
              <th className="pb-3">Registered Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No registered customers yet.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                      {(c.full_name?.[0] || 'C').toUpperCase()}
                    </div>
                    <span>{c.full_name || 'Customer'}</span>
                  </td>
                  <td className="py-3 text-slate-300">{c.email}</td>
                  <td className="py-3 text-slate-400">{c.phone || 'N/A'}</td>
                  <td className="py-3 font-semibold text-emerald-400">{c.orders?.length || 0} orders</td>
                  <td className="py-3 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
