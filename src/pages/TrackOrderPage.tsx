import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, Truck, Package, ArrowLeft, ShieldCheck, MapPin, Phone, Search, ChevronRight, AlertCircle, ShoppingBag, Copy, Check, ExternalLink } from 'lucide-react';
import { resolveOrderItemImage, resolveOrderItemName, resolveOrderItemSku } from '../lib/orderItemHelper';

interface OrderDetails {
  id: string;
  order_number: string;
  subtotal: string;
  shipping_fee: string;
  tax: string;
  discount: string;
  total: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  shipping_address: string;
  order_note: string | null;
  created_at: string;
  shippingAddresses?: {
    full_name: string;
    phone: string;
    email: string;
    full_address: string;
  }[];
  orderItems?: {
    id: string;
    product_name_snapshot: string;
    unit_price: string;
    quantity: number;
    subtotal: string;
  }[];
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Order received & queued for dispatch verification' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Order confirmed with inventory warehouse' },
  { key: 'processing', label: 'Processing & QC', desc: 'Quality inspection and item preparation' },
  { key: 'packed', label: 'Packed', desc: 'Securely packaged for Bangladesh express courier' },
  { key: 'shipped', label: 'In Transit', desc: 'Handed over to courier express partner' },
  { key: 'out for delivery', label: 'Out for Delivery', desc: 'Courier agent on route to your address' },
  { key: 'delivered', label: 'Delivered', desc: 'Successfully handed over to customer' },
];

export default function TrackOrderPage() {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber: string }>();
  const [searchInput, setSearchInput] = useState(paramOrderNumber || '');
  const [activeOrderNumber, setActiveOrderNumber] = useState(paramOrderNumber || '');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(paramOrderNumber));
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (ordNum: string) => {
    if (!ordNum.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', ordNum.trim())
        .maybeSingle();

      if (orderErr) throw orderErr;
      if (!orderData) {
        setError(`No order found matching "${ordNum}". Please check your order reference number.`);
        setOrder(null);
        setLoading(false);
        return;
      }

      // 2. Fetch items with product relation and images
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          *,
          products(
            id,
            name,
            sku,
            slug,
            price,
            product_images(id, image_url, storage_path, is_primary)
          )
        `)
        .eq('order_id', orderData.id);

      // 3. Fetch shipping address
      const { data: shippingData } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('order_id', orderData.id)
        .maybeSingle();

      setOrder({
        ...orderData,
        orderItems: itemsData || [],
        shippingAddresses: shippingData ? [shippingData] : [],
        shipping_address: shippingData?.full_address || orderData.shipping_address || 'Bangladesh'
      });
    } catch (err: any) {
      console.error('Order tracking fetch error:', err);
      setError(err.message || 'Failed to load tracking data.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderNumber) {
      setActiveOrderNumber(paramOrderNumber);
      setSearchInput(paramOrderNumber);
      fetchOrder(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  // Realtime updates
  useEffect(() => {
    if (!activeOrderNumber) return;

    const channel = supabase
      .channel(`order_track_${activeOrderNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${activeOrderNumber}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveOrderNumber(searchInput.trim());
      fetchOrder(searchInput.trim());
    }
  };

  const currentStatusNormalized = (order?.order_status || 'pending').toLowerCase();
  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === currentStatusNormalized);
  const activeIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

  const shippingInfo = order?.shippingAddresses?.[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header & Search Bar */}
      <div className="mb-8">
        <Link to="/orders" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-3">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order Tracking &amp; Status
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Live updates with real-time courier status and order details.
            </p>
          </div>

          {/* Quick Order Number Lookup Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order # (e.g. ORD-123)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Track
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Tracking Order Live...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-rose-900 mb-1">Order Lookup Notice</h3>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            onClick={() => setSearchInput('')}
            className="text-xs font-bold text-slate-900 underline"
          >
            Try another order number
          </button>
        </div>
      )}

      {!order && !loading && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm my-8">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Track Any Order</h3>
          <p className="text-xs text-slate-500 mb-6">
            Enter your order number received in your confirmation email or order history.
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            View My Orders
          </Link>
        </div>
      )}

      {order && !loading && (
        <div className="space-y-8">
          {/* Order Header Summary Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Order Reference</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Realtime
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-mono font-black">{order.order_number}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs uppercase text-slate-400 font-semibold block">Total Amount</span>
                <span className="text-2xl font-black text-white">৳{Number(order.total).toLocaleString()}</span>
              </div>
              <div className="text-right border-l border-slate-700 pl-6">
                <span className="text-xs uppercase text-slate-400 font-semibold block">Payment</span>
                <span className="text-xs font-bold text-slate-200 uppercase">{order.payment_method}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main 7-Stage Visual Timeline */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
                <span>7-Stage Delivery Progress</span>
                <span className="text-xs font-bold text-slate-500 capitalize">
                  Status: <span className="text-slate-900">{order.order_status}</span>
                </span>
              </h2>

              <div className="relative pl-6 sm:pl-8 space-y-7 border-l-2 border-slate-200">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= activeIdx;
                  const isCurrent = idx === activeIdx;

                  return (
                    <div key={step.key} className="relative">
                      {/* Timeline Node */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                            : 'bg-white text-slate-400 border-2 border-slate-200'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isCurrent ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Invoice & Package Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              {/* Package Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700" />
                  Package Items ({order.orderItems?.length || 0})
                </h3>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {order.orderItems?.map((item: any, itIdx: number) => {
                    const img = resolveOrderItemImage(item);
                    const name = resolveOrderItemName(item);
                    const unitPrice = Number(item.unit_price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineSub = Number(item.subtotal || unitPrice * qty);
                    const slug = item.products?.slug;

                    return (
                      <div key={item.id || itIdx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
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
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[180px]">
                              {slug ? (
                                <Link to={`/products/${slug}`} className="hover:text-emerald-600 transition">
                                  {name}
                                </Link>
                              ) : (
                                name
                              )}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Qty: {qty} &times; ৳{unitPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <span className="font-extrabold text-slate-900 text-xs flex-shrink-0">
                          ৳{lineSub.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping & Recipient Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-sm">
                  Shipping &amp; Recipient
                </h3>

                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-0.5">Recipient</span>
                  <p className="font-bold text-slate-800 text-sm">{shippingInfo?.full_name || 'Customer'}</p>
                  {shippingInfo?.phone && (
                    <p className="text-slate-600 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {shippingInfo.phone}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-0.5">Destination Address</span>
                  <p className="text-slate-700 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    {shippingInfo?.full_address || order.shipping_address}
                  </p>
                </div>

                {order.order_note && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase block mb-0.5">Order Note</span>
                    <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &ldquo;{order.order_note}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-sm flex items-center justify-between">
                  <span>Financial Breakdown</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{order.payment_method}</span>
                </h3>

                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-slate-900">৳{Number(order.shipping_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-3 border-t border-slate-100 text-sm">
                  <span>Total Due</span>
                  <span className="text-base font-black">৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
