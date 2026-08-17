import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ensureCustomerRecord } from '../lib/customer';
import { Package, Clock, Truck, ArrowRight, ShoppingBag, ShieldCheck, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { resolveOrderItemImage, resolveOrderItemName, resolveOrderItemSku } from '../lib/orderItemHelper';

export default function OrdersHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        navigate('/login?redirect=/orders');
        return;
      }
      try {
        setLoading(true);
        const customerId = await ensureCustomerRecord(
          user.id,
          user.email,
          user.displayName || user.user_metadata?.full_name
        );

        if (customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
          const { data: orderList, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items(
                *,
                products(
                  id,
                  name,
                  sku,
                  slug,
                  price,
                  product_images(id, image_url, storage_path, is_primary)
                )
              )
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setOrders(orderList || []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium text-sm">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Review your order history, ordered products with photos, and live delivery status.</p>
        </div>
        <Link
          to="/track"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
        >
          <Truck className="w-4 h-4" />
          Track by Code
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Orders Placed Yet</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">
            You haven't placed any orders yet. Explore our top products and enjoy genuine warranty and express delivery across Bangladesh!
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => {
            const items = ord.order_items || [];
            const totalUnits = items.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0);

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition"
              >
                {/* Order Header */}
                <div className="p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        ord.order_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.order_status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        ord.order_status === 'shipped' || ord.order_status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.order_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Ordered on {new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; Payment: <span className="font-semibold capitalize">{ord.payment_method || 'Cash on Delivery'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Amount</span>
                      <span className="text-base font-black text-slate-900">৳{Number(ord.total).toLocaleString()}</span>
                    </div>

                    <Link
                      to={`/track/${ord.order_number}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Live Track</span>
                    </Link>
                  </div>
                </div>

                {/* Ordered Items List with Images */}
                <div className="p-5 divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Items detail available in invoice.</p>
                  ) : (
                    items.map((it: any, itIdx: number) => {
                      const img = resolveOrderItemImage(it);
                      const name = resolveOrderItemName(it);
                      const unitPrice = Number(it.unit_price || 0);
                      const qty = Number(it.quantity || 1);
                      const lineTotal = Number(it.subtotal || unitPrice * qty);
                      const slug = it.products?.slug;

                      return (
                        <div key={it.id || itIdx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Product Thumbnail */}
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
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

                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate max-w-sm">
                                {slug ? (
                                  <Link to={`/products/${slug}`} className="hover:text-emerald-600 transition inline-flex items-center gap-1">
                                    <span>{name}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                  </Link>
                                ) : (
                                  <span>{name}</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ৳{unitPrice.toLocaleString()} &times; <strong className="text-slate-800">{qty}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-black text-slate-900">৳{lineTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

