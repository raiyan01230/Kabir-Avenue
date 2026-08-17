import React, { useEffect, useState } from 'react';
import {
  X, User, ShoppingBag, CreditCard, Truck, Calendar, DollarSign,
  Package, Tag, Phone, Mail, MapPin, ExternalLink, Printer,
  Sparkles, CheckCircle, Clock, AlertTriangle, ChevronDown,
  ChevronRight, RefreshCw, ShoppingCart, ArrowRight
} from 'lucide-react';
import { getStorageImageUrl } from '../../lib/storage';
import { downloadOrdersHtml } from '../../lib/invoiceDownload';
import { getStoreSettings } from '../../lib/queries';
import { Link, useNavigate } from 'react-router-dom';

interface CustomerProfileModalProps {
  customerId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export default function CustomerProfileModal({
  customerId,
  onClose,
  onOrderUpdated
}: CustomerProfileModalProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'cart'>('orders');
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@store.bd';

  const fetchCustomerData = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const json = await res.json();
      setData(json);

      // Auto-expand all orders by default so product-level information is instantly visible
      if (json?.orders && Array.isArray(json.orders)) {
        const expandedMap: Record<string, boolean> = {};
        json.orders.forEach((o: any) => {
          expandedMap[o.id] = true;
        });
        setExpandedOrders(expandedMap);
      }
    } catch (err) {
      console.error('Failed to load customer profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });
    fetchCustomerData();
  }, [customerId]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: newStatus,
          admin_email
        })
      });
      if (res.ok) {
        fetchCustomerData();
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!customerId) return null;

  const customer = data?.customer;
  const summary = data?.summary || {
    totalOrders: 0,
    totalSpent: 0,
    totalUnitsPurchased: 0,
    totalProductsPurchased: 0,
    averageOrderValue: 0,
    currentCartValue: 0,
    lastOrderDate: null
  };
  const orders = data?.orders || [];
  const purchasedProducts = data?.purchasedProducts || [];
  const activeCart = data?.activeCart || { items: [], cartTotal: 0 };

  const isVip = summary.totalSpent >= 5000 || summary.totalOrders >= 3;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'shipped':
      case 'out_for_delivery':
      case 'out for delivery':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'confirmed':
      case 'processing':
      case 'packed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${
              isVip
                ? 'bg-gradient-to-br from-purple-500/20 to-amber-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {(customer?.full_name?.[0] || 'C').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white">{customer?.full_name || 'Customer Profile'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                  isVip
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 flex items-center gap-1'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {isVip && <Sparkles className="w-3 h-3 text-purple-400" />}
                  {isVip ? 'VIP Customer' : 'Regular Customer'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {customer?.email}
                </span>
                {customer?.phone && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {customer?.phone}
                  </span>
                )}
                <span className="text-slate-500">
                  Registered: {customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/admin/orders/create');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Create VIP Order</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading complete purchase history and order details...</p>
            </div>
          ) : (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Total Orders
                  </div>
                  <div className="text-xl font-black text-white mt-1">{summary.totalOrders}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Lifetime placed</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Spent
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">৳{summary.totalSpent.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Paid / invoiced</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-purple-400" /> Units Bought
                  </div>
                  <div className="text-xl font-black text-purple-300 mt-1">{summary.totalUnitsPurchased}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total quantities</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" /> Unique Items
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">{summary.totalProductsPurchased}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Distinct SKUs</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Avg Order (AOV)
                  </div>
                  <div className="text-xl font-black text-cyan-300 mt-1">৳{summary.averageOrderValue.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Per transaction</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" /> Active Cart
                  </div>
                  <div className="text-xl font-black text-indigo-300 mt-1">৳{summary.currentCartValue.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{activeCart.items?.length || 0} items pending</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Customer Order History ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'products'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Purchased Products Summary ({purchasedProducts.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('cart')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'cart'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Customer Active Cart ({activeCart.items?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: ORDER HISTORY WITH FULL PRODUCT DETAILS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                      <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white">No Orders Placed Yet</h4>
                      <p className="text-xs text-slate-400 mt-1">This customer has not completed any orders yet.</p>
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/admin/orders/create');
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Place First VIP Order</span>
                      </button>
                    </div>
                  ) : (
                    orders.map((order: any) => {
                      const isExpanded = expandedOrders[order.id] ?? true;
                      const shipping = order.shipping_addresses?.[0] || order.shipping_addresses;
                      const orderItems = order.order_items || [];

                      return (
                        <div
                          key={order.id}
                          className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition shadow-sm"
                        >
                          {/* Order Summary Row */}
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70">
                            <div className="flex items-start sm:items-center gap-3">
                              <button
                                onClick={() => toggleOrderExpand(order.id)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition mt-0.5 sm:mt-0"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-sm text-white">
                                    {order.order_number}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.order_status)}`}>
                                    {order.order_status || 'Pending'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                                    {order.payment_method || 'Cash on Delivery'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    {new Date(order.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {shipping && (
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <MapPin className="w-3 h-3 text-slate-500" />
                                      {shipping.delivery_area || 'Dhaka'} ({shipping.thana || shipping.district || 'BD'})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Financial breakdown & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                              <div className="text-right">
                                <div className="text-base font-black text-emerald-400">
                                  ৳{Number(order.total || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {orderItems.length} products • {orderItems.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0)} units
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => downloadOrdersHtml([order], storeSettings)}
                                  title="Download / Print Official Invoice"
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="hidden sm:inline">Invoice</span>
                                </button>

                                <select
                                  value={order.order_status || 'pending'}
                                  disabled={updatingOrderId === order.id}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="bg-slate-800 border border-slate-700 text-white rounded-xl text-xs px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="packed">Packed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="out_for_delivery">Out for Delivery</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="returned">Returned</option>
                                  <option value="refunded">Refunded</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Order Details & PRODUCTS IN THIS ORDER Table */}
                          {isExpanded && (
                            <div className="border-t border-slate-800/80 p-4 sm:p-5 bg-slate-950/60 space-y-4 animate-in fade-in duration-150">
                              
                              {/* Shipping & Notes snapshot */}
                              {shipping && (
                                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Recipient &amp; Delivery Address</div>
                                    <div className="font-semibold text-white mt-0.5">{shipping.full_name} ({shipping.phone})</div>
                                    <div className="text-slate-400 mt-0.5">{shipping.full_address}</div>
                                  </div>
                                  <div className="sm:border-l sm:border-slate-800 sm:pl-3">
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Financial Breakdown</div>
                                    <div className="flex items-center justify-between text-slate-300 mt-0.5">
                                      <span>Subtotal:</span>
                                      <span className="font-semibold">৳{Number(order.subtotal || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                      <span>Shipping Fee ({shipping.delivery_area || 'Standard'}):</span>
                                      <span>৳{Number(order.shipping_fee || 0).toLocaleString()}</span>
                                    </div>
                                    {Number(order.discount || 0) > 0 && (
                                      <div className="flex items-center justify-between text-amber-400 text-[11px]">
                                        <span>Discount Applied {order.promo_code ? `(${order.promo_code})` : ''}:</span>
                                        <span>-৳{Number(order.discount || 0).toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* PRODUCTS IN THIS ORDER TABLE */}
                              <div>
                                <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                                    Products in this order ({orderItems.length})
                                  </span>
                                  <span className="text-[10px] text-slate-500 normal-case">Preserved historical purchase price</span>
                                </div>

                                <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/90 text-[11px]">
                                        <th className="py-2.5 px-3">Product</th>
                                        <th className="py-2.5 px-3">SKU</th>
                                        <th className="py-2.5 px-3 text-center">Qty</th>
                                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                                        <th className="py-2.5 px-3 text-right">Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {orderItems.map((item: any) => {
                                        const p = item.products;
                                        const imgUrl = getStorageImageUrl(
                                          item.product_image_snapshot ||
                                          p?.product_images?.find((img: any) => img.is_primary)?.image_url ||
                                          p?.product_images?.[0]?.image_url ||
                                          p?.image_url,
                                          'ecommerce'
                                        );

                                        const productName = item.product_name_snapshot || p?.name || 'Product';
                                        const sku = p?.sku || 'N/A';
                                        const unitPrice = Number(item.unit_price || 0);
                                        const qty = Number(item.quantity || 1);
                                        const lineTotal = Number(item.subtotal || (unitPrice * qty));

                                        return (
                                          <tr key={item.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-2.5 px-3">
                                              <div className="flex items-center gap-3">
                                                <img
                                                  src={imgUrl}
                                                  alt={productName}
                                                  className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700/60 shrink-0"
                                                  onError={(e) => {
                                                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80');
                                                  }}
                                                />
                                                <div>
                                                  <div className="font-bold text-white line-clamp-1">
                                                    {productName}
                                                  </div>
                                                  {p?.slug ? (
                                                    <a
                                                      href={`/products/${p.slug}`}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                                    >
                                                      <span>Storefront Page</span>
                                                      <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                  ) : (
                                                    <div className="text-[10px] text-slate-500">Historical Record</div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                              {sku}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-white">
                                              {qty}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                                              ৳{unitPrice.toLocaleString()}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                                              ৳{lineTotal.toLocaleString()}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {order.order_note && (
                                <div className="text-xs bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-slate-300">
                                  <span className="font-bold text-slate-400">Order Note: </span>
                                  {order.order_note}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: AGGREGATE PURCHASED PRODUCTS SUMMARY */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Purchased Products Summary</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aggregated list of all unique products bought across all historical orders.
                    </p>
                  </div>

                  {purchasedProducts.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                      <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white">No Products Purchased Yet</h4>
                      <p className="text-xs text-slate-400 mt-1">This customer has not ordered any products from the catalog.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                            <th className="py-3 px-4">Product Details</th>
                            <th className="py-3 px-4">SKU</th>
                            <th className="py-3 px-4 text-center">Total Units</th>
                            <th className="py-3 px-4 text-center">Orders Count</th>
                            <th className="py-3 px-4 text-right">Total Spent</th>
                            <th className="py-3 px-4 text-right">Last Purchased</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {purchasedProducts.map((p: any, idx: number) => {
                            const imgUrl = getStorageImageUrl(p.imageUrl, 'ecommerce');

                            return (
                              <tr key={idx} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={imgUrl}
                                      alt={p.name}
                                      className="w-11 h-11 object-cover rounded-xl bg-slate-800 border border-slate-700/60 shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80');
                                      }}
                                    />
                                    <div>
                                      <div className="font-bold text-white text-xs">{p.name}</div>
                                      {p.slug && (
                                        <a
                                          href={`/products/${p.slug}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                        >
                                          <span>View on Website</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                                  {p.sku || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-center font-black text-white text-sm">
                                  {p.totalUnits}
                                </td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-300">
                                  {p.orderCount} {p.orderCount === 1 ? 'order' : 'orders'}
                                </td>
                                <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                                  ৳{Number(p.totalSpent || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400 text-xs">
                                  {p.lastPurchasedDate ? new Date(p.lastPurchasedDate).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOMER ACTIVE CART (SEPARATE FROM PURCHASE HISTORY) */}
              {activeTab === 'cart' && (
                <div className="space-y-4">
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <ShoppingCart className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-200">Customer Active Shopping Cart</h4>
                      <p className="text-[11px] text-indigo-300/80 mt-0.5">
                        These items are currently placed in the customer's cart waiting for checkout. They are strictly separate from past completed purchase orders.
                      </p>
                    </div>
                  </div>

                  {activeCart.items?.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                      <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white">Cart is Currently Empty</h4>
                      <p className="text-xs text-slate-400 mt-1">The customer does not currently have pending items in their active cart.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                            <th className="py-3 px-4">Cart Item</th>
                            <th className="py-3 px-4">SKU</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-4 text-right">Unit Price</th>
                            <th className="py-3 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {activeCart.items.map((item: any) => {
                            const p = item.products;
                            const imgUrl = getStorageImageUrl(
                              p?.product_images?.find((img: any) => img.is_primary)?.image_url ||
                              p?.product_images?.[0]?.image_url ||
                              p?.image_url,
                              'ecommerce'
                            );
                            const unitPrice = Number(item.unit_price || p?.price || 0);
                            const qty = Number(item.quantity || 1);
                            const lineTotal = unitPrice * qty;

                            return (
                              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={imgUrl}
                                      alt={p?.name || 'Product'}
                                      className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700/60 shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80');
                                      }}
                                    />
                                    <div className="font-bold text-white">{p?.name || 'Product'}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-400 text-xs">{p?.sku || 'N/A'}</td>
                                <td className="py-3 px-4 text-center font-bold text-white">{qty}</td>
                                <td className="py-3 px-4 text-right text-slate-300 font-semibold">৳{unitPrice.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-bold text-indigo-400">৳{lineTotal.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-800 bg-slate-900/90 font-bold">
                            <td colSpan={4} className="py-3 px-4 text-right text-slate-300">Total Active Cart Value:</td>
                            <td className="py-3 px-4 text-right text-indigo-400 text-sm font-black">
                              ৳{Number(activeCart.cartTotal || 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Customer ID: <span className="font-mono text-slate-400">{customer?.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
