import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Calendar, Search, ChevronRight, RefreshCw, ShoppingBag } from 'lucide-react';
import CustomerProfileModal from '../../components/admin/CustomerProfileModal';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customers:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Customer Accounts &amp; Profiles</h1>
          <p className="text-xs text-slate-400 mt-1">View registered storefront users, contact information, and complete purchase histories</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/90">
              <th className="py-3.5 px-4">Customer Name</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4 text-center">Total Orders</th>
              <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
              <th className="py-3.5 px-4 text-right">Registered</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">No customers found.</td></tr>
            ) : (
              filtered.map(c => {
                const totalSpend = Number(c.total_spent || 0);
                const orderCount = Number(c.total_orders || 0);

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        {(c.full_name?.[0] || 'C').toUpperCase()}
                      </div>
                      <span className="group-hover:text-emerald-400 transition">{c.full_name || 'Customer'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.email}</td>
                    <td className="py-3 px-4 text-slate-400">{c.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-center font-semibold text-white">
                      {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400">
                      ৳{totalSpend.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(c.id);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <span>Profile &amp; Orders</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomerId && (
        <CustomerProfileModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onOrderUpdated={fetchCustomers}
        />
      )}
    </div>
  );
}

