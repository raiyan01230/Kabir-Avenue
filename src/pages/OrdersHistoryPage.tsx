import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ensureCustomerRecord } from '../lib/customer';
import { Package, Clock, Truck, ArrowRight, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CustomerOrder {
  id: string;
  order_number: string;
  total: string;
  order_status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  item_count?: number;
}

export default function OrdersHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
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
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setOrders((orderList as CustomerOrder[]) || []);
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
        <p className="mt-4 text-slate-600 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Review your order history and track active deliveries.</p>
        </div>
        <Link
          to="/track"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
        >
          <Truck className="w-4 h-4" />
          Track Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Orders Found</h2>
          <p className="text-slate-500 text-xs mb-6">
            You haven't placed any orders yet. Explore our curated catalog and enjoy express delivery!
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-base">{ord.order_number}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-100 text-slate-800">
                    {ord.order_status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {ord.payment_method}
                </p>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Amount</span>
                  <span className="text-base font-black text-slate-900">৳{Number(ord.total).toLocaleString()}</span>
                </div>

                <Link
                  to={`/track/${ord.order_number}`}
                  className="inline-flex items-center gap-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Track Live
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
