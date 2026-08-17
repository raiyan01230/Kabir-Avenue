import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ExternalLink, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Package, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Layers, 
  Info,
  Calendar,
  CreditCard,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveOrderItemImage, resolveOrderItemName, resolveOrderItemSku } from '../../lib/orderItemHelper';
import { downloadOrdersHtml, openPrintWindow } from '../../lib/invoiceDownload';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => Promise<void>;
  storeSettings?: Record<string, string>;
}

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  storeSettings = {}
}: OrderDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [statusVal, setStatusVal] = useState(order?.order_status || 'pending');
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const addr = (order.shipping_addresses && order.shipping_addresses[0]) || {};
  const customer = order.customers || {};
  const items = order.order_items || [];

  const handleStatusChange = async (newStatus: string) => {
    setStatusVal(newStatus);
    if (onUpdateStatus) {
      setUpdating(true);
      try {
        await onUpdateStatus(order.id, newStatus);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handlePrint = () => {
    openPrintWindow([order], 'invoice', storeSettings);
  };

  const handleDownload = () => {
    downloadOrdersHtml([order], 'invoice', storeSettings);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full my-8 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-white font-mono">{order.order_number}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.order_status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  order.order_status === 'cancelled' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  order.order_status === 'shipped' || order.order_status === 'out_for_delivery' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {order.order_status}
                </span>
                {order.payment_method && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {order.payment_method}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Download standalone HTML invoice"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
              title="Print A4 Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Quick Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Order Status:</span>
              <select
                disabled={updating}
                value={statusVal}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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
              {updating && <span className="text-xs text-emerald-400 animate-pulse">Saving...</span>}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Payment Status: <strong className="text-slate-200 capitalize">{order.payment_status || 'Pending'}</strong></span>
            </div>
          </div>

          {/* Ordered Products Section (Requested by User) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Ordered Products ({items.length} item{items.length === 1 ? '' : 's'})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Total Units: <strong className="text-slate-200">{items.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0)}</strong>
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 divide-y divide-slate-800/80">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No products listed on this order.</div>
              ) : (
                items.map((item: any, idx: number) => {
                  const img = resolveOrderItemImage(item);
                  const name = resolveOrderItemName(item);
                  const sku = resolveOrderItemSku(item);
                  const unitPrice = Number(item.unit_price || 0);
                  const qty = Number(item.quantity || 1);
                  const lineSubtotal = Number(item.subtotal || unitPrice * qty);
                  const prod = item.products || {};
                  const currentStock = prod.stock_quantity;

                  return (
                    <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/50 transition">
                      <div className="flex items-center gap-4">
                        {/* Product Image Thumbnail */}
                        <div 
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 group cursor-pointer"
                          onClick={() => setActiveImageZoom(img)}
                          title="Click to expand product image"
                        >
                          <img
                            src={img}
                            alt={name}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white uppercase bg-black/70 px-1.5 py-0.5 rounded">Zoom</span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-white line-clamp-1">{name}</h4>
                            {prod.slug && (
                              <Link
                                to={`/products/${prod.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-400 transition"
                                title="View product live in storefront"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {sku !== 'N/A' && (
                              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px] text-slate-300">
                                SKU: {sku}
                              </span>
                            )}
                            {currentStock !== undefined && (
                              <span className={`text-[10px] font-semibold ${
                                currentStock > 5 ? 'text-emerald-400' : currentStock > 0 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                Live Warehouse Stock: {currentStock} units
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 font-medium">
                            <span>Unit Price: </span>
                            <strong className="text-white font-bold">৳{unitPrice.toLocaleString()}</strong>
                            <span className="text-slate-500 mx-1.5">&times;</span>
                            <span className="bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-md font-extrabold text-xs">
                              {qty} {qty === 1 ? 'unit' : 'units'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Line Subtotal */}
                      <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Subtotal</span>
                        <span className="text-base font-black text-emerald-400">৳{lineSubtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Customer & Shipping Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Customer Profile</span>
              </h4>
              <div className="text-xs space-y-1.5">
                <div className="text-sm font-bold text-white">
                  {customer.full_name || addr.full_name || 'Guest Customer'}
                </div>
                {(customer.phone || addr.phone) && (
                  <div className="text-slate-300 flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.phone || addr.phone}</span>
                  </div>
                )}
                {(customer.email || addr.email) && (
                  <div className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.email || addr.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Destination & Delivery Area */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Shipping Address</span>
              </h4>
              <div className="text-xs space-y-1.5 text-slate-300">
                <div className="font-bold text-white">{addr.full_name || 'Recipient'}</div>
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>{addr.full_address || 'Provided offline'}</span>
                </div>
                <div className="text-slate-400 pl-5">
                  {addr.thana ? `${addr.thana}, ` : ''}{addr.district || 'Dhaka'}, {addr.division || 'Dhaka'}
                </div>
                <div className="pl-5 pt-1">
                  <span className="text-[11px] font-bold bg-slate-900 text-emerald-300 px-2 py-0.5 rounded border border-slate-800">
                    {addr.delivery_area || 'Inside Dhaka'} (Fee: ৳{Number(order.shipping_fee || 70).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Note if any */}
          {order.order_note && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-amber-400 uppercase text-[10px]">Customer Order Note:</div>
              <p className="text-amber-200 italic">&ldquo;{order.order_note}&rdquo;</p>
            </div>
          )}

          {/* Financial Totals */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Financial Summary
            </h4>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="text-white font-medium">৳{Number(order.subtotal || 0).toLocaleString()}</span>
            </div>
            {Number(order.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount / Promo ({order.promo_code || 'APPLIED'}):</span>
                <span>-৳{Number(order.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Delivery Fee ({addr.delivery_area || 'Standard'}):</span>
              <span className="text-white font-medium">৳{Number(order.shipping_fee || 70).toLocaleString()}</span>
            </div>
            {Number(order.tax || 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax / VAT:</span>
                <span className="text-white font-medium">৳{Number(order.tax).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
              <span className="text-base">Grand Total:</span>
              <span className="text-lg font-black text-emerald-400">৳{Number(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <Link
            to={`/admin/orders/${order.id}/print`}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Open Dedicated Print View</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Full Zoom Modal */}
      {activeImageZoom && (
        <div 
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveImageZoom(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden p-2 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveImageZoom(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImageZoom}
              alt="Zoomed product preview"
              className="w-full h-full object-contain max-h-[80vh] rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
