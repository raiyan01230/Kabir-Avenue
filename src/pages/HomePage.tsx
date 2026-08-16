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
  Award
} from 'lucide-react';
import InfiniteMarquee from "../components/InfiniteMarquee";
import BannerCarousel from "../components/BannerCarousel";
import ProductCard from "../components/ProductCard";
import { 
  getFeaturedProducts, 
  getCategories, 
  getHomepageBanners, 
  getDiscountDeals, 
  getNewArrivals, 
  getDeliveryZones,
  Product, 
  Category, 
  Banner 
} from '../lib/queries';

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountDeals, setDiscountDeals] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bannerList, featured, deals, arrivals, cats, dz] = await Promise.all([
          getHomepageBanners(),
          getFeaturedProducts(),
          getDiscountDeals(),
          getNewArrivals(),
          getCategories(),
          getDeliveryZones()
        ]);
        setBanners(bannerList);
        setFeaturedProducts(featured);
        setDiscountDeals(deals);
        setNewArrivals(arrivals);
        setCategories(cats);
        setZones(dz);
      } catch (err: any) {
        setError(err.message || 'Failed to load homepage data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
        <section className="container mx-auto px-4 pt-4">
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
            {categories.map((cat) => (
              <Link
                key={cat.id}
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
            {discountDeals.map((product) => (
              <ProductCard
                key={product.id}
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
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
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
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddedToCart={(name) => showToast(`Added "${name}" to cart!`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 8. Verified Customer Testimonials */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-300 border border-white/10">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Customer Reviews</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Trusted by Thousands of Happy Customers Nationwide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-4">
              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Ordered with Cash on Delivery to Chattogram. Arrived in perfect packaging within 48 hours. 100% original product as described!"
                </p>
                <div className="pt-2 border-t border-slate-700/60">
                  <p className="text-xs font-bold text-white">Sabbir Hossain</p>
                  <p className="text-[10px] text-slate-400">Chattogram • Verified Buyer</p>
                </div>
              </div>

              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Dhaka express delivery was super quick. The item was completely authentic and the price is the best in Bangladesh."
                </p>
                <div className="pt-2 border-t border-slate-700/60">
                  <p className="text-xs font-bold text-white">Nusrat Jahan</p>
                  <p className="text-[10px] text-slate-400">Dhaka • Verified Buyer</p>
                </div>
              </div>

              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Order tracking page updated in realtime from confirmation to rider delivery in Rajshahi. Top notch customer support!"
                </p>
                <div className="pt-2 border-t border-slate-700/60">
                  <p className="text-xs font-bold text-white">Mahmudul Karim</p>
                  <p className="text-[10px] text-slate-400">Rajshahi • Verified Buyer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
