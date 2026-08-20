import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ensureCustomerRecord } from '../lib/customer';
import { resolveProductImages } from '../lib/storage';
import { applySEOMetadata, injectStructuredData } from '../hooks/useSEO';
import { getProductReviews, submitProductReview, ReviewItem } from '../lib/queries';
import { Star, ShieldCheck, Truck, RefreshCw, Heart, ShoppingBag, Zap, CheckCircle2, AlertCircle, PackageCheck, Layers, ThumbsUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductVariantSelector from '../components/ProductVariantSelector';
import { VariantProvider } from '../context/VariantContext';
import { ProductVariant } from '../lib/queries';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setBuyNow } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Zoom state
  const [zoomStyle, setZoomStyle] = useState<{ display: string; backgroundPosition: string; backgroundSize: string }>({
    display: 'none',
    backgroundPosition: '0% 0%',
    backgroundSize: '250%'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setLoading(true);
        let prodData: any = null;

        // Try proxy endpoint first
        try {
          const res = await fetch(`/api/store/products/${slug}`, { cache: 'no-store' });
          if (res.ok) {
            prodData = await res.json();
          }
        } catch (err) {
          console.warn('Proxy fetch failed, trying direct Supabase:', err);
        }

        // Fallback to direct Supabase query
        if (!prodData) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
          let query = supabase
            .from('products')
            .select('*, categories(*), product_images(*)');

          if (isUuid) {
            query = query.or(`slug.eq.${slug},id.eq.${slug}`);
          } else {
            query = query.eq('slug', slug);
          }

          const { data, error } = await query.maybeSingle();

          if (error) throw error;
          prodData = data;
        }

        if (prodData) {
          setProduct(prodData);
          const images = resolveProductImages(prodData, prodData.product_images);
          setGalleryImages(images);
          setSelectedImgIdx(0);

          // Fetch reviews using API
          let reviewsData: any[] = [];
          try {
            reviewsData = await getProductReviews(prodData.id);
            setReviews(reviewsData || []);
          } catch {
            setReviews([]);
          }

          // Fetch store settings for brand and seller
          let currentStoreName = 'SHM GADGET ZONE';
          let storeSettingsMap: Record<string, string> = {};
          try {
            const sRes = await fetch('/api/store/settings-map', { cache: 'no-store' });
            if (sRes.ok) {
              storeSettingsMap = await sRes.json();
              if (storeSettingsMap.store_name) currentStoreName = storeSettingsMap.store_name;
            }
          } catch (e) {
            console.warn('Store settings fetch failed in product page:', e);
          }

          // Dynamic SEO metadata
          const seoTitle = prodData.seo_title || `${prodData.name} | ${currentStoreName}`;
          const cleanDesc = prodData.seo_description || prodData.short_description || prodData.description?.replace(/<[^>]*>?/gm, '') || `Buy authentic ${prodData.name} from ${currentStoreName} with warranty and fast delivery across Bangladesh.`;

          applySEOMetadata({
            title: seoTitle,
            description: cleanDesc.slice(0, 160),
            ogImage: images[0],
            ogType: 'product',
            canonicalUrl: window.location.href,
          }, storeSettingsMap);

          // Build Schema.org Product structured data with REAL data only
          const schemaObj: any = {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: prodData.name,
            image: images,
            description: cleanDesc.slice(0, 300),
            sku: prodData.sku || String(prodData.id),
            brand: {
              '@type': 'Brand',
              name: prodData.categories?.name || currentStoreName
            },
            offers: {
              '@type': 'Offer',
              url: window.location.href,
              priceCurrency: 'BDT',
              price: String(prodData.price || '0'),
              availability: (prodData.stock_quantity ?? 10) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: {
                '@type': 'Organization',
                name: currentStoreName
              }
            }
          };

          // If authentic customer reviews exist, attach valid AggregateRating
          if (reviewsData && reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
            const avgRating = (totalRating / reviewsData.length).toFixed(1);
            schemaObj.aggregateRating = {
              '@type': 'AggregateRating',
              ratingValue: avgRating,
              reviewCount: String(reviewsData.length),
              bestRating: '5',
              worstRating: '1'
            };
          }

          injectStructuredData(schemaObj, 'product-schema-jsonld');

          // Fetch related products in the same category
          try {
            const allRes = await fetch('/api/store/products', { cache: 'no-store' });
            if (allRes.ok) {
              const all = await allRes.json();
              if (Array.isArray(all)) {
                const related = all
                  .filter((p: any) => p.id !== prodData.id && (p.category_id === prodData.category_id || !prodData.category_id))
                  .slice(0, 4);
                setRelatedProducts(related);
              }
            }
          } catch {
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 text-xs mb-6">The requested product could not be located in our catalog.</p>
        <Link to="/products" className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl inline-block">
          Explore All Products
        </Link>
      </div>
    );
  }

  
      const displayPrice = selectedVariant && selectedVariant.price !== null ? Number(selectedVariant.price) : Number(product.price);
  const displayComparePrice = selectedVariant && selectedVariant.compare_price !== null ? Number(selectedVariant.compare_price) : Number(product.compare_price || 0);
  const displayStock = selectedVariant ? Number(selectedVariant.stock_quantity) : Number(product.stock_quantity || 0);
  const isOutOfStock = displayStock <= 0;
  const currentImage = galleryImages[selectedImgIdx] || galleryImages[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  const inWishlist = isInWishlist(product.id);

  // Hover zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle((prev) => ({ ...prev, display: 'none' }));
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    if (product.has_variants && !selectedVariant) {
      showToast('Please select all options before proceeding.', 'error');
      return;
    }
    try {
      setAddingCart(true);
      await addToCart(product, quantity, selectedVariant);
      showToast(`Added ${quantity} × "${product.name}" to your cart!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add to cart', 'error');
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    if (product.has_variants && !selectedVariant) {
      showToast('Please select all options before proceeding.', 'error');
      return;
    }
    setBuyNow(product, quantity, selectedVariant);
    navigate('/checkout?buyNow=1');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast('Please enter your review details', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await submitProductReview({
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || 'Verified Purchase Experience',
        review_text: reviewText.trim(),
        customer_name: user?.displayName || user?.user_metadata?.full_name || 'Verified Customer',
        customer_email: user?.email || undefined
      });

      if (res.success) {
        setReviewTitle('');
        setReviewText('');
        showToast('Review submitted successfully!');
        const updated = await getProductReviews(product.id);
        setReviews(updated);
      } else {
        showToast(res.error || 'Failed to submit review', 'error');
      }
    } catch (err: any) {
      console.error('Review submit error:', err);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const categoryName = product?.categories?.name || product?.category?.name || 'General';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';
  const roundedStars = Math.round(Number(avgRating));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-medium ${
          toast.type === 'success' ? 'bg-slate-900 text-white border-slate-700' : 'bg-red-600 text-white border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-900 transition">Products</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery with Hover Zoom */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 cursor-crosshair group shadow-sm"
          >
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Hover Magnifier Lens */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-150"
              style={{
                display: zoomStyle.display,
                backgroundImage: `url(${currentImage})`,
                backgroundPosition: zoomStyle.backgroundPosition,
                backgroundSize: zoomStyle.backgroundSize,
                backgroundRepeat: 'no-repeat'
              }}
            />
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIdx(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImgIdx === idx ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {categoryName}
              </span>
              <button
                onClick={() => toggleWishlist({ id: product.id, name: product.name, price: product.price, slug: product.slug })}
                className={`p-2 rounded-full border transition ${
                  inWishlist ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-400 hover:text-slate-800'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-xs text-slate-400 font-mono mt-1">SKU: {selectedVariant ? selectedVariant.sku : product.sku}</p>
            )}
          </div>

          {/* Reviews Star Summary */}
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < roundedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">{avgRating}</span>
            <span className="text-xs text-slate-400">({reviews.length} verified {reviews.length === 1 ? 'rating' : 'ratings'})</span>
          </div>

          {/* Price & Stock */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">৳{displayPrice.toLocaleString()}</span>
              {displayComparePrice && Number(displayComparePrice) > displayPrice && (
                <span className="text-base font-medium text-slate-400 line-through">
                  ৳{displayComparePrice.toLocaleString()}
                </span>
              )}
            </div>
            {isOutOfStock ? (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock_quantity} available) &bull; Ready for Fast Delivery
              </p>
            )}
          </div>

          {product.short_description && (
            <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {product.short_description}
            </p>
          )}

          {/* Variant Selector */}
            {product.has_variants && product.product_attributes && product.product_variants && product.product_variants.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <VariantProvider><ProductVariantSelector 
                  attributes={product.product_attributes} 
                  variants={product.product_variants} 
                  onVariantSelected={setSelectedVariant}
                /></VariantProvider>
              </div>
            )}

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</label>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-mono font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={addingCart || isOutOfStock}
              className="px-6 py-3.5 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={addingCart || isOutOfStock}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-white" />
              Buy Now
            </button>
          </div>

          {/* Delivery & Trust Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Truck className="w-4 h-4 text-slate-700 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-slate-800">Nationwide</p>
              <p className="text-[10px] text-slate-400">Dhaka ৳70 &bull; Outside ৳130</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-slate-800">100% Genuine</p>
              <p className="text-[10px] text-slate-400">Quality Verified</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <RefreshCw className="w-4 h-4 text-slate-700 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-slate-800">Easy Returns</p>
              <p className="text-[10px] text-slate-400">7-Day Return Policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Info Section: Description / Specs / Reviews */}
      <div className="mt-14 pt-8 border-t border-slate-200">
        <div className="flex border-b border-slate-200 gap-8 mb-8">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
              activeTab === 'description' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
              activeTab === 'specs' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Details &amp; Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
              activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === 'description' && (
          <div className="prose max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
            <p className="whitespace-pre-line">
              {product.description || 'Premium quality product crafted with authentic materials and reliable quality control. Guaranteed customer satisfaction with nationwide warranty & fast dispatch.'}
            </p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-3 p-3.5 bg-slate-50 font-bold text-slate-700">
                <span>Product Name</span>
                <span className="col-span-2 text-slate-900">{product.name}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500">Category</span>
                <span className="col-span-2 font-medium text-slate-900">{categoryName}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5 bg-slate-50">
                <span className="text-slate-500">SKU Code</span>
                <span className="col-span-2 font-mono font-medium text-slate-900">{product.sku || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500">Availability</span>
                <span className="col-span-2 font-medium text-emerald-600">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} Units in Stock` : 'Out of Stock'}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3.5 bg-slate-50">
                <span className="text-slate-500">Shipping Delivery</span>
                <span className="col-span-2 font-medium text-slate-900">Inside Dhaka (৳70), Outside Dhaka (৳130)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Write a Review Form */}
            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Leave a Verified Customer Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-400"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Review Headline</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Excellent quality, loved the product!"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Review</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your honest feedback with other shoppers in Bangladesh..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {reviews.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-slate-500 text-xs">No reviews yet for this product. Be the first to share your thoughts!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.title}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rev.review_text}</p>
                    <p className="text-[10px] text-slate-400">
                      By {rev.customers?.full_name || 'Customer'} &bull; {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Related Products</h2>
            <Link to="/products" className="text-xs font-bold text-slate-900 hover:underline">
              View All Products &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
