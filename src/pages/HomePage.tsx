import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Star, 
  Flame, 
  Sparkles,
  Layers,
  Award,
  MessageSquarePlus,
  MapPin,
  X,
  Check
} from 'lucide-react';
import InfiniteMarquee from "../components/InfiniteMarquee";
import BannerCarousel from "../components/BannerCarousel";
import ProductCard from "../components/ProductCard";
import FeatureFocusSections from "../components/FeatureFocusSections";
import { 
  getFeaturedProducts, 
  getCategories, 
  getHomepageBanners, 
  getDiscountDeals, 
  getNewArrivals, 
  getDeliveryZones,
  getStoreReviews,
  submitProductReview,
  Product, 
  Category, 
  Banner,
  ReviewItem
} from '../lib/queries';

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountDeals, setDiscountDeals] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | '5star' | 'delivery' | 'quality'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revText, setRevText] = useState('');
  const [revName, setRevName] = useState('');
  const [revEmail, setRevEmail] = useState('');
  const [revCity, setRevCity] = useState('Dhaka');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bannerList, featured, deals, arrivals, cats, dz, revs] = await Promise.all([
          getHomepageBanners(),
          getFeaturedProducts(),
          getDiscountDeals(),
          getNewArrivals(),
          getCategories(),
          getDeliveryZones(),
          getStoreReviews()
        ]);
        setBanners(bannerList);
        setFeaturedProducts(featured);
        setDiscountDeals(deals);
        setNewArrivals(arrivals);
        setCategories(cats);
        setZones(dz);
        setReviews(revs || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load homepage data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revText.trim()) {
      showToast('Please enter your review message', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await submitProductReview({
        rating: revRating,
        title: revTitle.trim() || 'Verified Experience',
        review_text: revText.trim(),
        customer_name: revName.trim() ? `${revName.trim()} (${revCity})` : `Verified Buyer (${revCity})`,
        customer_email: revEmail.trim()
      });

      if (res.success) {
        showToast('Thank you! Your verified review has been submitted.');
        setIsReviewModalOpen(false);
        setRevTitle('');
        setRevText('');
        setRevName('');
        setRevEmail('');
        
        // Refresh reviews list
        const updated = await getStoreReviews();
        setReviews(updated);
      } else {
        showToast(res.error || 'Failed to submit review', 'error');
      }
    } catch {
      showToast('Review submission failed. Please try again.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === '5star') return Number(r.rating) === 5;
    if (reviewFilter === 'delivery') {
      const txt = (r.review_text + ' ' + (r.title || '')).toLowerCase();
      return txt.includes('delivery') || txt.includes('fast') || txt.includes('courier') || txt.includes('rider') || txt.includes('dhaka');
    }
    if (reviewFilter === 'quality') {
      const txt = (r.review_text + ' ' + (r.title || '')).toLowerCase();
      return txt.includes('quality') || txt.includes('original') || txt.includes('authentic') || txt.includes('warranty') || txt.includes('best');
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading store experience...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Toast Notification */}
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

      {/* 1. Dynamic Hero Banner Carousel Engine */}
      {banners.length > 0 && (
        <section className="container mx-auto px-2 sm:px-4 pt-2 sm:pt-4">
          <BannerCarousel banners={banners} />
        </section>
      )}

      {/* 2. Infinite Scrolling Marquee */}
      <InfiniteMarquee />

      {/* 3. Bangladesh Service Guarantees */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Nationwide Delivery</h3>
              <p className="text-xs text-slate-500 mt-1">Inside Dhaka ৳{zones['Inside Dhaka'] || 70} (24-48h), Outside Dhaka ৳{zones['Outside Dhaka'] || 130} (2-4 days).</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">100% Genuine Guarantee</h3>
              <p className="text-xs text-slate-500 mt-1">Direct from official sources with authentic quality guarantee.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Easy Exchange Policy</h3>
              <p className="text-xs text-slate-500 mt-1">Hassle-free replacement for defective or damaged items.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Shop by Category */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Shop by Category</h2>
              <p className="text-xs text-slate-500 mt-1">Explore our curated collections</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 group"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((cat, index) => (
              <Link
                key={cat.id || cat.slug || index}
                to={`/category/${cat.slug}`}
                className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-400 hover:shadow-md transition text-center cursor-pointer group flex flex-col items-center justify-center"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-16 h-16 object-cover rounded-2xl mb-3 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white rounded-2xl flex items-center justify-center text-slate-700 font-bold transition mb-3">
                    <Layers className="w-7 h-7" />
                  </div>
                )}
                <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                {cat.description && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Deals & Discounts Section */}
      {discountDeals.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Deals &amp; Discounts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Special discounted prices on popular items</p>
              </div>
            </div>
            <Link
              to="/shop?sort=price_asc"
              className="text-xs font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 group"
            >
              <span>See All Deals</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {discountDeals.map((product, index) => (
              <ProductCard
                key={product.id || index}
                product={product}
                onAddedToCart={(name) => showToast(`Added "${name}" to cart!`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Featured Products Showcase */}
      <section id="featured" className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Featured Products</h2>
            <p className="text-xs text-slate-500 mt-1">Handpicked quality essentials for you</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 group"
          >
            <span>Explore All Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id || index}
                product={product}
                onAddedToCart={(name) => showToast(`Added "${name}" to cart!`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">New Arrivals</h2>
                <p className="text-xs text-slate-500 mt-0.5">Freshly stocked items</p>
              </div>
            </div>
            <Link
              to="/shop?sort=newest"
              className="text-xs font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 group"
            >
              <span>View All New</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newArrivals.map((product, index) => (
              <ProductCard
                key={product.id || index}
                product={product}
                onAddedToCart={(name) => showToast(`Added "${name}" to cart!`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 8. Verified Customer Reviews & Nationwide Social Proof */}
      <section className="container mx-auto px-4 py-10">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden shadow-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-8">
            {/* Header & Trust Aggregate Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  <Award className="w-3.5 h-3.5" />
                  <span>Real Customer Feedback &bull; 64 Districts Nationwide</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Verified Customer Experiences
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Real feedback from customers across Bangladesh with verified Cash on Delivery &amp; express doorstep shipping.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Aggregate Rating Score Card */}
                <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
                  <div className="text-2xl font-black text-white">4.9<span className="text-xs font-normal text-slate-400">/5</span></div>
                  <div className="space-y-0.5">
                    <div className="flex items-center text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">99.2% Positive Satisfaction</div>
                  </div>
                </div>

                {/* Write a Review Button */}
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                All Reviews ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('5star')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === '5star'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>5-Star Ratings</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('delivery')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'delivery'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>Fast Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('quality')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'quality'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Original Quality</span>
              </button>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {filteredReviews.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-slate-800/40 rounded-2xl border border-slate-800">
                  No matching customer reviews found for this filter.
                </div>
              ) : (
                filteredReviews.map((rev) => {
                  const ratingCount = Number(rev.rating) || 5;
                  const customerName = rev.customers?.full_name || 'Verified Customer';
                  const cityOrDistrict = rev.customers?.city || (customerName.includes('(') ? customerName.split('(')[1]?.replace(')', '') : 'Bangladesh');
                  const initials = customerName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'BD';

                  return (
                    <div
                      key={rev.id}
                      className="bg-slate-800/70 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 transition flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-amber-400 gap-0.5">
                            {[...Array(ratingCount)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Verified Purchase
                          </span>
                        </div>

                        {rev.title && (
                          <h4 className="text-xs font-bold text-white line-clamp-1">{rev.title}</h4>
                        )}

                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          &ldquo;{rev.review_text}&rdquo;
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">
                              {customerName.split('(')[0]?.trim()}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-slate-500" />
                              <span>{cityOrDistrict}</span>
                            </div>
                          </div>
                        </div>

                        {rev.products?.name && (
                          <div className="text-[10px] text-slate-400 max-w-[120px] truncate text-right font-medium" title={rev.products.name}>
                            {rev.products.name}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Focus Sections (4-5 Core Guarantees) */}
      <FeatureFocusSections variant="grid" />

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">Share Your Experience</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your honest review helps shoppers across Bangladesh</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Rating Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRevRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= revRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">
                    {revRating === 5 ? '5 Stars - Outstanding!' : `${revRating} Stars`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="e.g. Raiyan Ahmed"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Your City / District</label>
                  <input
                    type="text"
                    required
                    value={revCity}
                    onChange={(e) => setRevCity(e.target.value)}
                    placeholder="e.g. Dhanmondi, Dhaka"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Kept Private)</label>
                <input
                  type="email"
                  value={revEmail}
                  onChange={(e) => setRevEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  placeholder="e.g. Excellent original product, lightning fast delivery"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={revText}
                  onChange={(e) => setRevText(e.target.value)}
                  placeholder="Describe your delivery speed, product condition, packaging, or customer service experience..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
