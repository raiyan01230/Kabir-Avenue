import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Printer, 
  Plus, 
  CheckSquare, 
  Square, 
  FileText, 
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  ExternalLink,
  Tag
} from 'lucide-react';
import { downloadOrdersHtml, getResolvedStoreName } from '../../lib/invoiceDownload';
import { getStoreSettings } from '../../lib/queries';
import { resolveOrderItemImage, resolveOrderItemName, resolveOrderItemSku } from '../../lib/orderItemHelper';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; order?: any; ids?: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Order form state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [productName, setProductName] = useState('Gaming PC Rig');
  const [productPrice, setProductPrice] = useState('120000');
  const [qty, setQty] = useState('1');
  const [deliveryArea, setDeliveryArea] = useState('Inside Dhaka');
  const [address, setAddress] = useState('Gulshan-2, Dhaka');

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus, admin_email })
      });
      if (res.ok) {
        showToast(`Order status updated to ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: newStatus } : o));
        if (selectedOrderForModal && selectedOrderForModal.id === id) {
          setSelectedOrderForModal((prev: any) => ({ ...prev, order_status: newStatus }));
        }
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch {
      showToast('Network error while updating status', 'error');
    }
  };

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      if (deleteTarget.type === 'single' && deleteTarget.order) {
        const res = await fetch(`/api/admin/orders/${deleteTarget.order.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_email })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast(`Order ${deleteTarget.order.order_number} was permanently deleted and inventory was restored.`);
          setSelectedOrderIds(prev => prev.filter(id => id !== deleteTarget.order.id));
          fetchOrders();
        } else {
          showToast(result.error || 'Failed to delete order', 'error');
        }
      } else if (deleteTarget.type === 'bulk' && deleteTarget.ids) {
        const res = await fetch(`/api/admin/orders/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_ids: deleteTarget.ids, admin_email })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast(`Successfully deleted ${result.deletedCount} orders and restored inventory stock.`);
          setSelectedOrderIds([]);
          fetchOrders();
        } else {
          showToast(result.error || 'Failed to bulk delete orders', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred during deletion', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
      showToast('VIP / Manual order created successfully!');
      fetchOrders();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to create manual order', 'error');
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filtered.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filtered.map(o => o.id));
    }
  };

  const handlePrintSingle = (ord: any) => {
    navigate(`/admin/orders/${ord.id || ord.order_number}/print`);
  };

  const handleDownloadSingle = (ord: any) => {
    downloadOrdersHtml([ord], 'invoice', storeSettings);
  };

  const handleBatchPrint = () => {
    if (selectedOrderIds.length === 0) return;
    navigate(`/admin/orders/print?ids=${selectedOrderIds.join(',')}`);
  };

  const handleBatchDownload = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedOrders.length === 0) return;
    downloadOrdersHtml(selectedOrders, 'invoice', storeSettings);
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = (o.order_number && o.order_number.toLowerCase().includes(q)) || 
      (o.customers?.full_name && o.customers.full_name.toLowerCase().includes(q)) ||
      (o.shipping_addresses?.[0]?.full_name && o.shipping_addresses[0].full_name.toLowerCase().includes(q)) ||
      (o.shipping_addresses?.[0]?.phone && o.shipping_addresses[0].phone.includes(q)) ||
      (o.order_items || []).some((it: any) => {
        const name = resolveOrderItemName(it).toLowerCase();
        const sku = resolveOrderItemSku(it).toLowerCase();
        return name.includes(q) || sku.includes(q);
      });
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const liveStoreName = getResolvedStoreName(storeSettings);

  return (
    <>
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
          toast.type === 'success' ? 'bg-slate-900 text-white border-emerald-500/50' : 'bg-rose-950 text-rose-200 border-rose-600'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Order Details & Products Modal */}
      {selectedOrderForModal && (
        <OrderDetailsModal
          order={selectedOrderForModal}
          isOpen={Boolean(selectedOrderForModal)}
          onClose={() => setSelectedOrderForModal(null)}
          onUpdateStatus={handleUpdateStatus}
          storeSettings={storeSettings}
        />
      )}

      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Orders &amp; VIP Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Store: <strong className="text-slate-300">{liveStoreName}</strong> &bull; Inspect ordered products with images, update delivery statuses, print/download A4 invoices, and securely delete records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedOrderIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleBatchDownload}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-md cursor-pointer"
                  title="Download selected invoices as standalone document file"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ({selectedOrderIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchPrint}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Selected ({selectedOrderIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: 'bulk', ids: selectedOrderIds })}
                  className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-rose-500/40 shadow-md cursor-pointer"
                  title="Permanently delete selected orders"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedOrderIds.length})</span>
                </button>
              </>
            )}

            <Link
              to="/admin/printing"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Printing Center</span>
            </Link>

            <Link
              to="/admin/orders/create"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create VIP / Offline Order</span>
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by order #, customer, or product..."
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
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="Select all orders"
                    >
                      {selectedOrderIds.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Ordered Products</th>
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
                    <td colSpan={9} className="py-8 text-center text-slate-500">Loading orders...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">No orders found.</td>
                  </tr>
                ) : (
                  filtered.map((ord) => {
                    const isSelected = selectedOrderIds.includes(ord.id);
                    const isExpanded = expandedOrderIds.includes(ord.id);
                    const items = ord.order_items || [];
                    const itemCount = items.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0);

                    return (
                      <React.Fragment key={ord.id}>
                        <tr className={`hover:bg-slate-800/40 ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => toggleSelectOrder(ord.id)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 font-bold text-white">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForModal(ord)}
                                className="hover:text-emerald-400 font-mono font-bold text-left transition cursor-pointer"
                                title="Click to inspect full order details"
                              >
                                {ord.order_number}
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-200">{ord.customers?.full_name || ord.shipping_addresses?.[0]?.full_name || 'Guest'}</div>
                            <div className="text-[10px] text-slate-400">{ord.customers?.phone || ord.shipping_addresses?.[0]?.phone}</div>
                          </td>

                          {/* Ordered Products Gallery & Quick Preview */}
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              {/* Stacked Product Thumbnails */}
                              <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                                {items.slice(0, 3).map((it: any, itIdx: number) => {
                                  const imgUrl = resolveOrderItemImage(it);
                                  const itName = resolveOrderItemName(it);
                                  return (
                                    <div
                                      key={it.id || itIdx}
                                      className="relative inline-block w-8 h-8 rounded-lg overflow-hidden ring-2 ring-slate-900 bg-slate-800 shadow-sm"
                                      title={`${itName} (Qty: ${it.quantity})`}
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={itName}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80';
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                                {items.length > 3 && (
                                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg ring-2 ring-slate-900 bg-slate-800 text-[10px] font-bold text-slate-300">
                                    +{items.length - 3}
                                  </div>
                                )}
                              </div>

                              {/* Title / Expand Button */}
                              <div className="flex flex-col">
                                <div className="text-slate-300 font-medium line-clamp-1 max-w-[160px] text-[11px]">
                                  {items.length > 0 ? resolveOrderItemName(items[0]) : 'Custom Order'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(ord.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition text-left cursor-pointer mt-0.5"
                                >
                                  <span>{items.length} {items.length === 1 ? 'item' : 'items'} ({itemCount} units)</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
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
                          <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForModal(ord)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg transition inline-flex items-center gap-1 font-bold text-xs shadow-sm cursor-pointer"
                              title="Inspect ordered products &amp; details"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400 hover:text-white" />
                              <span>Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(ord)}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition inline-flex items-center gap-1 font-bold text-xs shadow-sm cursor-pointer"
                              title="Download invoice file (.html)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintSingle(ord)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition inline-flex items-center gap-1 font-bold text-xs shadow-sm cursor-pointer"
                              title="Open A4 Print &amp; Invoice View"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Print</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'single', order: ord })}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition inline-flex items-center gap-1 font-bold text-xs shadow-sm cursor-pointer"
                              title="Delete this order permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expandable Products Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80 border-b border-slate-800">
                            <td colSpan={9} className="p-4">
                              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                                      Products in Order #{ord.order_number}
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForModal(ord)}
                                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Full Order Modal</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {items.map((it: any, itIdx: number) => {
                                    const img = resolveOrderItemImage(it);
                                    const name = resolveOrderItemName(it);
                                    const sku = resolveOrderItemSku(it);
                                    const unitPrice = Number(it.unit_price || 0);
                                    const qty = Number(it.quantity || 1);
                                    const lineSub = Number(it.subtotal || unitPrice * qty);
                                    const prod = it.products || {};

                                    return (
                                      <div
                                        key={it.id || itIdx}
                                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700 transition"
                                      >
                                        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                                          <img
                                            src={img}
                                            alt={name}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80';
                                            }}
                                          />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                          <div className="font-bold text-slate-100 text-xs truncate" title={name}>
                                            {name}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            {sku !== 'N/A' && (
                                              <span className="font-mono text-slate-400">SKU: {sku}</span>
                                            )}
                                            {prod.stock_quantity !== undefined && (
                                              <span className="text-emerald-400 font-medium">Stock: {prod.stock_quantity}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between text-xs pt-0.5">
                                            <span className="text-slate-300 font-semibold">
                                              ৳{unitPrice.toLocaleString()} &times; <strong className="text-emerald-300">{qty}</strong>
                                            </span>
                                            <span className="font-extrabold text-emerald-400">
                                              ৳{lineSub.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {deleteTarget.type === 'single'
                      ? `Delete Order #${deleteTarget.order?.order_number}?`
                      : `Delete ${deleteTarget.ids?.length} Selected Orders?`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    This action will permanently delete the order record, line items, status history, and customer shipping details from the database.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Automatic Inventory Restoration</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unless the order was already cancelled, product quantities will automatically be returned to current warehouse stock.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {isDeleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual / VIP Order Modal */}
        {isManualModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Create Manual / Phone / VIP Order</h2>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                  <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer">Create Order</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
