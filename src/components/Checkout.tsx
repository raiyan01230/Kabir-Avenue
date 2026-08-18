import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart, CartItem } from '../context/CartContext';
import { 
  getDeliveryHierarchy, 
  getDeliveryZones, 
  getStoreSettings, 
  Division 
} from '../lib/queries';
import { 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Tag, 
  X, 
  ArrowLeft,
  ArrowRight,
  Lock,
  ShoppingBag,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

export default function Checkout() {
  const { user } = useAuth();
  const { items: cartItems, subtotal: cartSubtotal, clearCart, buyNowItem, clearBuyNow, isCartLoading } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isBuyNowMode = searchParams.get('buyNow') === '1' || Boolean(buyNowItem);

  // Active items for this checkout session
  const activeItems: CartItem[] = useMemo(() => {
    if (isBuyNowMode && buyNowItem) {
      return [buyNowItem];
    }
    return cartItems;
  }, [isBuyNowMode, buyNowItem, cartItems]);

  const subtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  }, [activeItems]);

  // Delivery structure state
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    divisionId: '',
    districtId: '',
    thanaId: '',
    fullAddress: '',
    orderNote: '',
    paymentMethod: 'cod' as 'cod' | 'bkash'
  });

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prepopulate customer details if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.user_metadata?.full_name || prev.fullName || '',
        email: user.email || prev.email || '',
        phone: user.user_metadata?.phone || prev.phone || ''
      }));
    }
  }, [user]);

  // Load Divisions & Delivery Zones
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [divs, dz] = await Promise.all([
          getDeliveryHierarchy(),
          getDeliveryZones()
        ]);
        setDivisions(divs);
        setZones(dz);

        // Default to Dhaka Division
        if (divs.length > 0) {
          const dhakaDiv = divs.find((d) => d.name.toLowerCase().includes('dhaka')) || divs[0];
          const dhakaDist = dhakaDiv.districts.find((d) => d.name.toLowerCase().includes('dhaka')) || dhakaDiv.districts[0];
          const firstThana = dhakaDist?.thanas[0];

          setForm((prev) => ({
            ...prev,
            divisionId: prev.divisionId || dhakaDiv.id,
            districtId: prev.districtId || (dhakaDist ? dhakaDist.id : ''),
            thanaId: prev.thanaId || (firstThana ? firstThana.id : '')
          }));
        }
      } catch (err) {
        console.error('Failed to load checkout settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cascading Location selections
  const selectedDivision = divisions.find((d) => d.id === form.divisionId);
  const availableDistricts = selectedDivision ? selectedDivision.districts : [];
  const selectedDistrict = availableDistricts.find((d) => d.id === form.districtId);
  const availableThanas = selectedDistrict ? selectedDistrict.thanas : [];
  const selectedThana = availableThanas.find((t) => t.id === form.thanaId);

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divId = e.target.value;
    const div = divisions.find((d) => d.id === divId);
    const firstDist = div?.districts[0];
    const firstThana = firstDist?.thanas[0];

    setForm((prev) => ({
      ...prev,
      divisionId: divId,
      districtId: firstDist ? firstDist.id : '',
      thanaId: firstThana ? firstThana.id : ''
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    const dist = availableDistricts.find((d) => d.id === distId);
    const firstThana = dist?.thanas[0];

    setForm((prev) => ({
      ...prev,
      districtId: distId,
      thanaId: firstThana ? firstThana.id : ''
    }));
  };

  // Dynamic Shipping Calculation based on Database settings
  const isDhakaRate = selectedDistrict?.name.toLowerCase() === 'dhaka';
  const shippingFee = isDhakaRate
    ? (zones['Inside Dhaka'] || 70)
    : (zones['Outside Dhaka'] || 130);

  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);

  // Apply Promo Code Server-Side
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    try {
      setApplyingPromo(true);
      setPromoError(null);

      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: promoCodeInput.trim(), 
          subtotal: subtotal.toString(),
          customerId: user?.id || null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid promo code');
      }

      setAppliedPromo({
        code: data.code,
        discountAmount: parseFloat(data.discountAmount),
        description: data.description
      });
      setPromoCodeInput('');
    } catch (err: any) {
      setPromoError(err.message || 'Failed to apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeItems.length === 0) {
      setErrorMessage('No items selected for checkout. Please select a product first.');
      return;
    }

    if (!form.fullName.trim() || !form.phone.trim() || !form.fullAddress.trim()) {
      setErrorMessage('Please fill in your Full Name, Phone Number, and Complete Street Address.');
      return;
    }

    const cleanPhone = form.phone.replace(/\s+/g, '');
    if (!/^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 11-digit Bangladesh phone number (e.g. 017XXXXXXXX).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const divName = selectedDivision?.name || 'Dhaka';
    const distName = selectedDistrict?.name || 'Dhaka';
    const thanaName = selectedThana?.name || 'Dhanmondi';
    const detailedAddress = `${form.fullAddress.trim()}, ${thanaName}, ${distName}, ${divName}, Bangladesh`;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user?.id || null,
          email: form.email.trim() || user?.email || `guest_${cleanPhone}@checkout.bd`,
          items: activeItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            unitPrice: item.price,
            variant: item.variant || null,
            product: {
              name: item.name || 'Product Item',
              imageUrl: item.imageUrl || null,
              sku: item.sku || null
            }
          })),
          shipping_info: {
            full_name: form.fullName.trim(),
            phone: cleanPhone,
            email: form.email.trim() || user?.email || '',
            division: divName,
            district: distName,
            thana: thanaName,
            full_address: detailedAddress,
            delivery_area: isDhakaRate ? 'Inside Dhaka' : 'Outside Dhaka'
          },
          subtotal: subtotal.toString(),
          shipping_fee: shippingFee.toString(),
          tax: '0',
          promo_code: appliedPromo?.code || null,
          discount: discount.toString(),
          total: total.toString(),
          payment_method: form.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Merchant Pay',
          order_note: form.orderNote.trim() || null
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order. Please try again.');
      }

      // Clear the corresponding store session
      if (isBuyNowMode) {
        clearBuyNow();
      } else {
        await clearCart();
      }

      navigate(`/order-success?order_id=${result.orderId || ''}&order_number=${result.orderNumber || ''}`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'Failed to process order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Login Required to Order</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              You must be signed in to your SHM Gadget Zone account to place orders, track deliveries, and view purchase history.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              <span>Sign In or Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Continue Browsing Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || (isCartLoading && activeItems.length === 0)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Preparing Bangladesh Checkout...</p>
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Items in Checkout</h2>
        <p className="text-slate-500 text-sm mb-6">
          Please add products to your cart or click "Buy Now" on any product to proceed.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={isBuyNowMode ? "/products" : "/cart"}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          {isBuyNowMode ? "Back to Products" : "Back to Cart"}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Checkout &amp; Delivery</span>
              {isBuyNowMode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Direct Buy Now
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Cash on delivery &amp; nationwide courier dispatch across Bangladesh.
            </p>
          </div>

          {!user && (
            <div className="text-xs bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Ordering as Guest. <Link to="/login?redirect=/checkout" className="font-bold underline hover:text-slate-900">Sign in</Link> to save addresses.
              </span>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (Left) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Contact & Customer Information */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <span>Contact Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number (BD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (For order invoice &amp; tracking)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="tanvir@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. Bangladesh Shipping Address */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>Shipping Address (Bangladesh)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Division <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.divisionId}
                    onChange={handleDivisionChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.districtId}
                    onChange={handleDistrictChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thana / Upazila <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.thanaId}
                    onChange={(e) => setForm({ ...form, thanaId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  >
                    {availableThanas.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Complete Street Address (House, Road, Area) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.fullAddress}
                    onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                    placeholder="House 42, Road 11, Sector 4, Uttara"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Special Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.orderNote}
                    onChange={(e) => setForm({ ...form, orderNote: e.target.value })}
                    placeholder="Call before arrival / Leave with security guard"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method Selection */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <span>Payment Method</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    form.paymentMethod === 'cod'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={form.paymentMethod === 'cod'}
                    onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-xs font-black">Cash on Delivery</span>
                    <span className={`text-[11px] block mt-0.5 ${form.paymentMethod === 'cod' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Pay in cash when courier rider delivers package to your doorstep.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    form.paymentMethod === 'bkash'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bkash"
                    checked={form.paymentMethod === 'bkash'}
                    onChange={() => setForm({ ...form, paymentMethod: 'bkash' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-xs font-black">bKash Online Payment</span>
                    <span className={`text-[11px] block mt-0.5 ${form.paymentMethod === 'bkash' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Secure instant mobile payment directly with bKash gateway.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar Summary (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-bold text-slate-500">
                  {activeItems.length} {activeItems.length === 1 ? 'Product' : 'Products'}
                </span>
              </h2>

              {/* Items List Snapshot */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                {activeItems.map((item) => (
                  <div key={`${item.productId}_${item.variant || ''}`} className="flex items-center gap-3 pt-3 first:pt-0">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity || 1} &times; ৳{item.price.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      ৳{(item.price * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Promo Code</span>
                </label>

                {appliedPromo ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase">{appliedPromo.code}</span>
                      <span className="text-[10px] text-emerald-600 block">
                        Saved ৳{appliedPromo.discountAmount.toLocaleString()} ({appliedPromo.description || 'Special Discount'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="p-1 text-emerald-700 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Remove promo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER PROMO CODE"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    />
                    <button
                      type="button"
                      disabled={applyingPromo || !promoCodeInput.trim()}
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer"
                    >
                      {applyingPromo ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] text-rose-600 font-medium">{promoError}</p>
                )}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Shipping ({isDhakaRate ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                  <span className="font-bold text-slate-900">৳{shippingFee}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-৳{appliedPromo.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">Total Payable</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      ৳{total.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-400">All applicable charges included</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Confirming Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Place Order (৳{total.toLocaleString()})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted &amp; Bangladesh Courier Dispatched</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
