import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Grid, 
  List as ListIcon, 
  Heart, 
  ShoppingBag, 
  Zap, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Package,
  Layers
} from 'lucide-react';
import { getFilteredCatalog, getCategories, Product, Category, subscribeToStoreUpdates } from '../lib/queries';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { useSEO, injectStructuredData } from '../hooks/useSEO';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeCategorySlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const selectedCategory = routeCategorySlug || searchParams.get('category') || 'all';
  const [minPrice, setMinPrice] = useState<number>(Number(searchParams.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams.get('maxPrice')) || 0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest' | 'name'>(
    (searchParams.get('sort') as any) || 'featured'
  );

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setBuyNow } = useCart();
  const { user } = useAuth();

  const currentCategoryObj = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
  const dynamicTitle = currentCategoryObj 
    ? `${currentCategoryObj.name} Price in Bangladesh` 
    : (selectedCategory !== 'all' ? `${selectedCategory.toUpperCase()} Collection` : 'Shop All Genuine Gadgets & Electronics');
  const dynamicDesc = currentCategoryObj?.description 
    ? currentCategoryObj.description 
    : 'Explore our catalog of genuine smart gadgets, mobile accessories, audio gear, and lifestyle electronics in Bangladesh with official warranty.';

  // Apply SEO and Google Structured Data (ItemList)
  useSEO({
    title: dynamicTitle,
    description: dynamicDesc,
    ogImage: currentCategoryObj?.image_url || undefined,
    canonicalUrl: window.location.href,
  });

  useEffect(() => {
    if (products.length > 0) {
      injectStructuredData({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: products.slice(0, 24).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${window.location.origin}/products/${p.slug || p.id}`,
          name: p.name,
        })),
      });
    }
  }, [products]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      setCategories(cats);
    }
    loadCategories();
    const unsubscribe = subscribeToStoreUpdates(loadCategories);
    return () => unsubscribe();
  }, []);

  // Fetch products whenever filters change
  const loadProducts = async () => {
    setLoading(true);
    try {
      const items = await getFilteredCatalog({
        search: searchTerm,
        categorySlug: selectedCategory,
        minPrice: minPrice > 0 ? minPrice : undefined,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        inStockOnly,
        sortBy,
      });
      setProducts(items);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeToStoreUpdates(loadProducts);
    return () => unsubscribe();
  }, [searchTerm, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy]);

  // Sync state to URL params
  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '0' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleCategorySelect = (slug: string) => {
    if (routeCategorySlug) {
      if (slug === 'all') {
        navigate('/shop');
      } else {
        navigate(`/category/${slug}`);
      }
    } else {
      updateQueryParam('category', slug === 'all' ? null : slug);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setMinPrice(0);
    setMaxPrice(0);
    setInStockOnly(false);
    setSortBy('featured');
    if (routeCategorySlug) {
      navigate('/shop');
    } else {
      setSearchParams({});
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const isNowIn = await toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
    });
    showToast(isNowIn ? `Added "${product.name}" to Wishlist!` : `Removed from Wishlist`);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      setActionLoadingId(product.id);
      await addToCart(product, 1);
      showToast(`Added "${product.name}" to cart!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add product to cart', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setBuyNow(product, 1);
    navigate('/checkout?buyNow=1');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Dynamic Toast */}
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

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12 px-4 border-b border-slate-800">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                <Link to="/" className="hover:text-white transition">Home</Link>
                <span>/</span>
                <span className="text-white">
                  {currentCategoryObj ? currentCategoryObj.name : 'Catalog & Shop'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {currentCategoryObj ? currentCategoryObj.name : 'Explore All Products'}
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {currentCategoryObj?.description || 'Authentic quality products with genuine guarantee and express nationwide delivery across Bangladesh.'}
              </p>
            </div>

            {/* Quick stats pill */}
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
              <span className="font-semibold text-white">{products.length} Products Available</span>
              <span className="text-slate-600">•</span>
              <span>Nationwide Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, category, SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateQueryParam('q', e.target.value);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  updateQueryParam('q', null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  updateQueryParam('sort', e.target.value);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>

            {/* View Grid / List Mode */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6">
            {/* Categories Filter Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <span>Categories</span>
                </h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-700" />
                <span>Price Range (৳)</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">Min (৳)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinPrice(val);
                      updateQueryParam('minPrice', val > 0 ? String(val) : null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">Max (৳)</label>
                  <input
                    type="number"
                    placeholder="350000"
                    value={maxPrice || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxPrice(val);
                      updateQueryParam('maxPrice', val > 0 ? String(val) : null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Availability Filter Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                <span>Availability</span>
              </h3>

              <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    updateQueryParam('inStock', e.target.checked ? 'true' : null);
                  }}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                />
                <span>In Stock Ready to Ship</span>
              </label>
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Reset All Filters
            </button>
          </aside>

          {/* Product Listing Area */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 font-medium text-sm">Searching hardware inventory...</p>
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No hardware matching your criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  We could not find any products matching your specific combination of filters. Try broadening your search or resetting filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {products.map((product) => {
                  const inWishlist = isInWishlist(product.id);
                  const isProcessing = actionLoadingId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-semibold rounded-full">
                            In Stock ({product.stockQuantity || 10})
                          </span>
                          <span className="text-[11px] text-slate-400">SKU: {product.sku}</span>
                        </div>
                        <Link to={`/products/${product.slug}`}>
                          <h3 className="font-bold text-slate-900 text-lg hover:text-slate-700 transition">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 max-w-xl">
                          {product.description || 'Authentic quality, Bangladesh warranty supported, ready for immediate dispatch.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900">৳{Number(product.price).toLocaleString()}</span>
                          {product.comparePrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ৳{Number(product.comparePrice).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={(e) => handleWishlistToggle(e, product)}
                            className={`p-2.5 rounded-xl border transition ${
                              inWishlist
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleAddToCart(e, product)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold rounded-xl transition"
                          >
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleBuyNow(e, product)}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-900 text-base">Filter Products</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Categories</label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleCategorySelect('all');
                    setIsMobileFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                    selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleCategorySelect(cat.slug);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      selectedCategory === cat.slug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Price Range (৳)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice || ''}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice || ''}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Mobile Stock */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-slate-900"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
