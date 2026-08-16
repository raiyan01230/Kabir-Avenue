import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  ShieldCheck, 
  LogOut, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Trash2, 
  ShoppingBag,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshLocations';
import { supabase } from '../lib/supabase';
import { addItemToCustomerCart } from '../lib/cart';
import { ensureCustomerRecord } from '../lib/customer';

interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  thana: string;
  fullAddress: string;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { items: wishlist = [], removeItem: removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'orders' | 'wishlist'>('profile');
  const [profile, setProfile] = useState<CustomerProfile>({
    fullName: '',
    email: '',
    phone: '',
    division: 'Dhaka',
    district: 'Dhaka',
    thana: 'Mirpur',
    fullAddress: '',
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/account');
      return;
    }

    // Load initial profile data
    const savedLocal = localStorage.getItem(`profile_${user.id}`);
    if (savedLocal) {
      try {
        setProfile(JSON.parse(savedLocal));
      } catch (e) {
        console.error(e);
      }
    } else {
      setProfile((prev) => ({
        ...prev,
        fullName: user.displayName || 'Tech Enthusiast',
        email: user.email || '',
      }));
    }

    // Fetch user orders
    async function fetchOrders() {
      setLoadingOrders(true);
      try {
        const customerId = await ensureCustomerRecord(
          user.id,
          user.email,
          user.displayName || user.user_metadata?.full_name
        );

        if (customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setOrders(data);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn('Orders query error:', err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [user, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));

      try {
        await (supabase.from('customers') as any)
          .upsert({
            firebase_uid: user.id,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'firebase_uid' });
      } catch (dbErr) {
        console.warn('Customer profile upsert warning:', dbErr);
      }

      showToast('Profile & Address settings saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast('Failed to save profile changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCartFromWishlist = async (item: any) => {
    if (!user) return;
    try {
      const prodId = item.productId || item.product?.id || item.id;
      const price = item.product?.price || item.price || '0';
      const name = item.product?.name || item.name || 'Product';
      await addItemToCustomerCart(user.id, prodId, price, 1);
      showToast(`Added "${name}" to your cart!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add product to cart', 'error');
    }
  };

  // Find dynamic districts for selected division
  const currentDivData = BANGLADESH_DIVISIONS.find(
    (d) => d.name.toLowerCase() === (profile.division || 'dhaka').toLowerCase()
  ) || BANGLADESH_DIVISIONS[0];

  const currentDistricts = currentDivData ? currentDivData.districts : [];

  const currentDistData = currentDistricts.find(
    (d) => d.name.toLowerCase() === (profile.district || 'dhaka').toLowerCase()
  ) || currentDistricts[0];

  const currentThanas = currentDistData ? currentDistData.thanas : [];

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'delivered':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Delivered</span>;
      case 'shipped':
      case 'out for delivery':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">In Transit</span>;
      case 'processing':
      case 'packed':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">Processing</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">Order Placed</span>;
    }
  };

  if (!user) return null;

  const ordersCount = orders?.length || 0;
  const wishlistCount = wishlist?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Account Header */}
      <div className="bg-slate-900 text-white py-12 px-4 border-b border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {profile.fullName || 'Customer Profile'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-rose-600/80 hover:border-rose-500 border border-white/20 text-xs font-bold text-white transition cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <aside className="space-y-2">
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === 'profile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Personal Info</span>
              </button>

              <button
                onClick={() => setActiveTab('address')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === 'address'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Bangladesh Shipping Address</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === 'orders'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4" />
                  <span>My Orders</span>
                </div>
                {ordersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px]">
                    {ordersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === 'wishlist'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4" />
                  <span>Saved Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px]">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </div>

            {/* Security Guarantee Box */}
            <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-slate-600 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Official Warranty Store</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All purchases linked to your account include genuine Bangladesh manufacturer warranty and 7-day exchange coverage.
              </p>
            </div>
          </aside>

          {/* Tab Content Panels */}
          <main className="md:col-span-3">
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Personal Information</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage your identity and communication details.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profile.email}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Linked with Firebase authentication.</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mobile Phone (11 digits)</span>
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="017XXXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. BANGLADESH SHIPPING ADDRESS TAB */}
            {activeTab === 'address' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Default Bangladesh Delivery Address</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pre-fills automatically during one-click checkout for faster dispatch.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Division Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Division</label>
                      <select
                        value={profile.division}
                        onChange={(e) => {
                          const newDivName = e.target.value;
                          const targetDivObj = BANGLADESH_DIVISIONS.find((d) => d.name === newDivName) || BANGLADESH_DIVISIONS[0];
                          const firstDistObj = targetDivObj.districts[0];
                          const firstThanaObj = firstDistObj?.thanas[0];

                          setProfile({
                            ...profile,
                            division: targetDivObj.name,
                            district: firstDistObj?.name || '',
                            thana: firstThanaObj?.name || '',
                          });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {BANGLADESH_DIVISIONS.map((div) => (
                          <option key={div.id} value={div.name}>{div.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">District</label>
                      <select
                        value={profile.district}
                        onChange={(e) => {
                          const newDistName = e.target.value;
                          const targetDistObj = currentDistricts.find((d) => d.name === newDistName) || currentDistricts[0];
                          const firstThanaObj = targetDistObj?.thanas[0];

                          setProfile({
                            ...profile,
                            district: targetDistObj?.name || '',
                            thana: firstThanaObj?.name || '',
                          });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {currentDistricts.map((dist) => (
                          <option key={dist.id} value={dist.name}>{dist.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Thana/Upazila Selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Thana / Upazila</label>
                      <select
                        value={profile.thana}
                        onChange={(e) => setProfile({ ...profile, thana: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {currentThanas.map((thana) => (
                          <option key={thana.id} value={thana.name}>{thana.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Street & Flat Address */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Street Address / House / Road / Area</label>
                    <textarea
                      rows={3}
                      value={profile.fullAddress}
                      onChange={(e) => setProfile({ ...profile, fullAddress: e.target.value })}
                      placeholder="e.g. House #14, Road #5, Block C, Section 11, Mirpur"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Applicable Dispatch Rate:</span>
                    <span className="font-bold text-slate-900">
                      {(profile.district || '').toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Default Address'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. MY ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Order History</h2>
                    <p className="text-xs text-slate-500 mt-1">Track dispatch status and view previous receipts.</p>
                  </div>
                  <Link
                    to="/track"
                    className="text-xs font-bold text-slate-900 hover:text-slate-700 underline"
                  >
                    Track Any Order #
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-xs text-slate-500">Loading order records...</p>
                  </div>
                ) : ordersCount === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">No orders placed yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore our high-performance hardware catalog and place your first order.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl hover:border-slate-300 transition space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{order.order_number}</span>
                            <span className="text-[11px] text-slate-500 ml-3">
                              {new Date(order.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(order.order_status)}
                            <span className="font-extrabold text-slate-900 text-sm">৳{Number(order.total).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {order.order_items?.length || 1} Item(s) • {order.payment_method?.toUpperCase()}
                          </span>
                          <Link
                            to={`/track/${order.order_number}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-slate-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs"
                          >
                            <span>Live Tracking</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SAVED WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Saved Wishlist</h2>
                  <p className="text-xs text-slate-500 mt-1">Hardware and peripherals saved for quick purchasing.</p>
                </div>

                {wishlistCount === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Your wishlist is empty</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click the heart icon on any product to save it here for later.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {wishlist.map((item) => {
                      const product = item.product || item;
                      const prodName = product?.name || item?.name || 'Product';
                      const prodPrice = product?.price || item?.price || '0';
                      const prodSlug = product?.slug || item?.slug || '';
                      const prodId = product?.id || item?.productId || item?.id;

                      return (
                        <div key={item.id || prodId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <Link to={`/products/${prodSlug}`}>
                              <h3 className="font-bold text-slate-900 text-sm hover:text-slate-700 transition">
                                {prodName}
                              </h3>
                            </Link>
                            <span className="text-xs font-extrabold text-slate-900 block mt-1">
                              ৳{Number(prodPrice).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddToCartFromWishlist(item)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              onClick={() => removeFromWishlist(prodId)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Remove from Wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
