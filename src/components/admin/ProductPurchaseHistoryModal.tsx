import React, { useEffect, useState } from 'react';
import {
  X, Package, ShoppingBag, Users, DollarSign, Calendar,
  TrendingUp, Search, ExternalLink, Mail, Phone, Clock,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductPurchaseHistoryModalProps {
  productId: string;
  onClose: () => void;
}

export default function ProductPurchaseHistoryModal({ productId, onClose }: ProductPurchaseHistoryModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPurchaseHistory = () => {
    setLoading(true);
    fetch(`/api/admin/products/${productId}/purchase-history`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load product purchase history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPurchaseHistory();
  }, [productId]);

  const stats = data?.stats || {
    total_orders: 0,
    total_units_sold: 0,
    total_revenue: 0,
    unique_customers_count: 0,
    last_ordered_at: null,
  };

  const purchases = (data?.purchases || []).filter((p: any) => {
    const custName = (p.customer?.full_name || '').toLowerCase();
    const custEmail = (p.customer?.email || '').toLowerCase();
    const orderNum = (p.order_number || '').toLowerCase();
    const query = search.toLowerCase();
    return custName.includes(query) || custEmail.includes(query) || orderNum.includes(query);
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {data?.product?.name || 'Product Sales & Purchase History'}
                </h2>
                {data?.product?.sku && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    SKU: {data.product.sku}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete audit trail of every customer who ordered this item, historical purchase pricing, and units sold
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPurchaseHistory}
              title="Refresh sales data"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
              <p className="text-xs font-semibold">Aggregating historical product orders &amp; buyers...</p>
            </div>
          ) : (
            <>
              {/* Sales Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                    <span>Total Orders</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {stats.total_orders}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Orders containing this item
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>Total Units Sold</span>
                  </div>
                  <div className="text-xl font-black text-purple-300 mt-1">
                    {stats.total_units_sold} units
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Total volume purchased
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total Revenue</span>
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    ৳{stats.total_revenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Gross item sales
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unique Buyers</span>
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {stats.unique_customers_count}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats.last_ordered_at
                      ? `Last: ${new Date(stats.last_ordered_at).toLocaleDateString()}`
                      : 'No orders yet'}
                  </div>
                </div>
              </div>

              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Customer Purchase Logs ({purchases.length})</span>
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by customer name, email, or order #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Purchase History Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/90">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                      <th className="py-3 px-4 text-center">Order Status</th>
                      <th className="py-3 px-4 text-right">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500">
                          {search
                            ? 'No customer purchases match your search query.'
                            : 'No customer has purchased this product yet.'}
                        </td>
                      </tr>
                    ) : (
                      purchases.map((p: any) => {
                        const status = p.order_status || 'pending';
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-white flex items-center gap-2">
                                <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-500/20 shrink-0">
                                  {(p.customer?.full_name?.[0] || 'C').toUpperCase()}
                                </div>
                                <div>
                                  <div>{p.customer?.full_name || 'Anonymous Customer'}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5" />
                                    <span>{p.customer?.email || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-mono text-emerald-400 font-bold">
                                {p.order_number}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center font-bold text-white">
                              {p.quantity}
                            </td>

                            <td className="py-3 px-4 text-right text-slate-300 font-mono">
                              ৳{Number(p.unit_price || 0).toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-right font-black text-emerald-400 font-mono">
                              ৳{Number(p.line_total || 0).toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  status === 'delivered'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : status === 'cancelled'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right text-slate-400">
                              {p.order_created_at
                                ? new Date(p.order_created_at).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Database-backed purchase audit trail with exact historical price snapshots
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
