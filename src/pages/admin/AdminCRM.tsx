import React, { useEffect, useState } from 'react';
import {
  Users, Star, Tag, ShieldCheck, Mail, Phone, Search,
  Filter, ShoppingBag, DollarSign, Package, Sparkles,
  ArrowUpRight, RefreshCw, Plus, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerProfileModal from '../../components/admin/CustomerProfileModal';

export default function AdminCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'vip' | 'regular' | 'buyers' | 'no_orders'>('all');
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
        console.error('Failed to fetch CRM customers:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const nameMatch = (c.full_name || '').toLowerCase().includes(search.toLowerCase());
    const emailMatch = (c.email || '').toLowerCase().includes(search.toLowerCase());
    const phoneMatch = (c.phone || '').toLowerCase().includes(search.toLowerCase());
    const idMatch = (c.id || '').toLowerCase().includes(search.toLowerCase());

    const matchesSearch = nameMatch || emailMatch || phoneMatch || idMatch;
    if (!matchesSearch) return false;

    const totalSpend = Number(c.total_spent || 0);
    const orderCount = Number(c.total_orders || 0);
    const isVip = totalSpend >= 5000 || orderCount >= 3;

    if (segmentFilter === 'vip') return isVip;
    if (segmentFilter === 'regular') return !isVip;
    if (segmentFilter === 'buyers') return orderCount > 0;
    if (segmentFilter === 'no_orders') return orderCount === 0;
    return true;
  });

  // Calculate high-level CRM metrics
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => Number(c.total_spent || 0) >= 5000 || Number(c.total_orders || 0) >= 3);
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const totalOrdersPlaced = customers.reduce((sum, c) => sum + Number(c.total_orders || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <span>Customer Relationship &amp; Purchase History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              CRM Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access complete product-level order history, lifetime spending, purchased items breakdown, and customer accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/admin/orders/create"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create VIP / Manual Order</span>
          </Link>
        </div>
      </div>

      {/* Top CRM Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" /> Total Customers
          </div>
          <div className="text-2xl font-black text-white mt-1">{totalCustomers}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered accounts &amp; buyers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" /> VIP Segment
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1">{vipCustomers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt;৳5,000 spend or 3+ orders</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-400" /> Orders Placed
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalOrdersPlaced}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total lifetime orders</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-400" /> Customer Revenue
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">৳{totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Gross revenue from customers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone number, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Segment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSegmentFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              segmentFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setSegmentFilter('vip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
              segmentFilter === 'vip'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-purple-400 hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>VIP ({vipCustomers.length})</span>
          </button>
          <button
            onClick={() => setSegmentFilter('buyers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              segmentFilter === 'buyers'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Active Buyers ({customers.filter(c => Number(c.total_orders || 0) > 0).length})
          </button>
          <button
            onClick={() => setSegmentFilter('no_orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              segmentFilter === 'no_orders'
                ? 'bg-slate-800 text-slate-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            No Orders Yet
          </button>
        </div>
      </div>

      {/* Main CRM Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/90">
                <th className="py-3.5 px-4">Customer Profile</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Segment</th>
                <th className="py-3.5 px-4 text-center">Orders Placed</th>
                <th className="py-3.5 px-4 text-center">Units Bought</th>
                <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading customer purchase history...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No customers found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const totalSpend = Number(c.total_spent || 0);
                  const orderCount = Number(c.total_orders || 0);
                  const unitsPurchased = Number(c.total_units_purchased || 0);
                  const isVip = totalSpend >= 5000 || orderCount >= 3;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            isVip
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {(c.full_name?.[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <div className="group-hover:text-emerald-400 transition">{c.full_name || 'Customer'}</div>
                            <div className="text-[10px] text-slate-500">
                              Joined: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-200 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" /> {c.email}
                        </div>
                        <div className="text-slate-400 flex items-center gap-1.5 mt-0.5 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" /> {c.phone || 'No phone'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isVip
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 flex items-center gap-1 w-fit'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isVip && <Sparkles className="w-2.5 h-2.5 text-purple-400" />}
                          {isVip ? 'VIP Customer' : 'Regular'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-white text-sm">{orderCount}</div>
                        <div className="text-[10px] text-slate-500">
                          {c.last_order_date ? `Last: ${new Date(c.last_order_date).toLocaleDateString()}` : 'No orders'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-purple-300 text-sm">
                        {unitsPurchased}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-emerald-400 text-sm">৳{totalSpend.toLocaleString()}</div>
                        {orderCount > 0 && (
                          <div className="text-[10px] text-slate-500">
                            AOV: ৳{Math.round(totalSpend / orderCount).toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerId(c.id);
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <span>View History</span>
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
      </div>

      {/* Customer Profile & Purchase History Modal */}
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

