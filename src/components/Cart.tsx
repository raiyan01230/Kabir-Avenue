import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getDeliveryZones } from '../lib/queries';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function Cart() {
  const { items, itemCount, subtotal, updateQuantity, removeFromCart, clearCart, isCartLoading } = useCart();
  const navigate = useNavigate();
  const [zones, setZones] = useState<Record<string, number>>({});
  const [selectedArea, setSelectedArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getDeliveryZones().then(setZones);
  }, []);

  const insideFee = zones['Inside Dhaka'] || 70;
  const outsideFee = zones['Outside Dhaka'] || 130;
  const currentShipping = selectedArea === 'Inside Dhaka' ? insideFee : outsideFee;
  const estimatedTotal = subtotal + (items.length > 0 ? currentShipping : 0);

  if (isCartLoading && items.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
          Looks like you haven't added any items to your cart yet. Explore our latest arrivals and top deals!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Shopping Cart</span>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review your selections before proceeding to secure checkout</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>

          {confirmClear ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Yes, Clear All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 py-2 px-3 rounded-xl hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {items.map((item) => {
              const itemTotal = item.price * (item.quantity || 1);
              const maxStock = item.stockQuantity ?? 99;

              return (
                <div key={`${item.productId}_${item.variant || 'default'}`} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Link
                      to={`/products/${item.slug || item.productId}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 block group"
                    >
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="space-y-1 min-w-0">
                      {item.sku && (
                        <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                      )}
                      <Link
                        to={`/products/${item.slug || item.productId}`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <span className="inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          Variant: {item.variant}
                        </span>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-bold text-slate-900">
                          ৳{item.price.toLocaleString()}
                        </span>
                        {item.comparePrice && item.comparePrice > item.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ৳{item.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                        disabled={item.quantity >= maxStock}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="text-base font-black text-slate-900">
                        ৳{itemTotal.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center justify-end gap-1 mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantees Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-3">
              <Truck className="w-5 h-5 text-slate-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Fast Delivery</p>
                <p className="text-[10px] text-slate-500">Dhaka &amp; All Districts</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">100% Genuine</p>
                <p className="text-[10px] text-slate-500">Verified Quality</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-slate-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Cash on Delivery</p>
                <p className="text-[10px] text-slate-500">Pay When Received</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 sticky top-24">
            <h2 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            {/* Delivery Destination Estimator */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Delivery Area
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedArea('Inside Dhaka')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                    selectedArea === 'Inside Dhaka'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                  }`}
                >
                  Inside Dhaka (৳{insideFee})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArea('Outside Dhaka')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                    selectedArea === 'Outside Dhaka'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                  }`}
                >
                  Outside Dhaka (৳{outsideFee})
                </button>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 text-xs pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping ({selectedArea})</span>
                <span className="font-bold text-slate-900">৳{currentShipping}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Estimated Total</span>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">
                    ৳{estimatedTotal.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">Includes all taxes</p>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Promo codes and full shipping address details are applied at final checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
