import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Printer, Plus, CheckCircle, Clock, Truck, ShieldCheck, X, Sparkles } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual Order state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [productName, setProductName] = useState('Gaming PC Rig');
  const [productPrice, setProductPrice] = useState('120000');
  const [qty, setQty] = useState('1');
  const [deliveryArea, setDeliveryArea] = useState('Inside Dhaka');
  const [address, setAddress] = useState('Gulshan-2, Dhaka');

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: newStatus, admin_email })
    });
    if (res.ok) fetchOrders();
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customer_name: custName,
      customer_email: custEmail || `vip_${Date.now()}@hyperdrive.bd`,
      customer_phone: custPhone,
      items: [{ productName, unitPrice: Number(productPrice), quantity: Number(qty) }],
      shipping_info: {
        full_name: custName,
        phone: custPhone,
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Gulshan',
        full_address: address,
        delivery_area: deliveryArea
      },
      payment_method: 'Cash on Delivery',
      order_type: 'VIP/Phone',
      admin_email
    };

    const res = await fetch('/api/admin/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsManualModalOpen(false);
      fetchOrders();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create manual order');
    }
  };

  const handlePrint = (ord: any) => {
    setSelectedOrder(ord);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || (o.customers?.full_name && o.customers.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Orders &amp; VIP Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage customer orders, update delivery status, and create manual phone/social orders</p>
        </div>
        <Link
          to="/admin/orders/create"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create VIP / Offline Order</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Total (৳)</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No orders found.</td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-white">{ord.order_number}</td>
                    <td className="py-3">
                      <div className="font-medium text-slate-200">{ord.customers?.full_name || ord.shipping_addresses?.[0]?.full_name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-400">{ord.customers?.phone || ord.shipping_addresses?.[0]?.phone}</div>
                    </td>
                    <td className="py-3 font-bold text-emerald-400">৳{Number(ord.total).toLocaleString()}</td>
                    <td className="py-3 text-slate-300 capitalize">{ord.payment_method || 'COD'}</td>
                    <td className="py-3">
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handlePrint(ord)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Print A4 Order"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual / VIP Order Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create Manual / Phone / VIP Order</h2>
            <form onSubmit={handleCreateManualOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer Name</label>
                  <input type="text" required value={custName} onChange={e => setCustName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" placeholder="Raiyan Ahmed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input type="text" required value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" placeholder="+8801700000000" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email (Optional)</label>
                <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" placeholder="customer@gmail.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product Name / Item</label>
                  <input type="text" required value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Price (BDT ৳)</label>
                  <input type="number" required value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Area</label>
                  <select value={deliveryArea} onChange={e => setDeliveryArea(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs">
                    <option value="Inside Dhaka">Inside Dhaka (৳70)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳130)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input type="number" required value={qty} onChange={e => setQty(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Shipping Address</label>
                <textarea rows={2} required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable A4 Order Hidden/Overlay view */}
      {selectedOrder && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-2xl font-black">HYPERDRIVE E-COMMERCE</h1>
                <p className="text-xs text-slate-600">Official Invoice &amp; Delivery Note</p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold">Order #: {selectedOrder.order_number}</div>
                <div>Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-bold mb-1">Customer Details:</h3>
                <div>{selectedOrder.customers?.full_name || selectedOrder.shipping_addresses?.[0]?.full_name}</div>
                <div>Phone: {selectedOrder.customers?.phone || selectedOrder.shipping_addresses?.[0]?.phone}</div>
              </div>
              <div>
                <h3 className="font-bold mb-1">Shipping Address:</h3>
                <div>{selectedOrder.shipping_addresses?.[0]?.full_address}</div>
                <div>Area: {selectedOrder.shipping_addresses?.[0]?.delivery_area}</div>
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
                {(selectedOrder.order_items || []).map((item: any, idx: number) => (
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
                <div className="flex justify-between"><span>Subtotal:</span><span>৳{Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping Fee:</span><span>৳{Number(selectedOrder.shipping_fee || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-sm border-t pt-2"><span>Total:</span><span>৳{Number(selectedOrder.total).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
