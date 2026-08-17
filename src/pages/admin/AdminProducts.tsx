import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, ExternalLink, Eye, EyeOff, Star, TrendingUp, History } from 'lucide-react';
import ProductImageUploader, { ProductImageItem } from '../../components/admin/ProductImageUploader';
import ProductPurchaseHistoryModal from '../../components/admin/ProductPurchaseHistoryModal';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedHistoryProductId, setSelectedHistoryProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [featured, setFeatured] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@store.bd';

  const fetchProducts = () => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin products:', err);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch categories:', err));
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setPrice('');
    setComparePrice('');
    setStockQuantity('15');
    setCategoryId(categories[0]?.id || '');
    setNewCategoryName('');
    setStatus('active');
    setFeatured(false);
    setShortDescription('');
    setDescription('');
    setProductImages([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setName(prod.name || '');
    setSlug(prod.slug || '');
    setSku(prod.sku || '');
    setPrice(prod.price?.toString() || '');
    setComparePrice(prod.compare_price?.toString() || '');
    setStockQuantity(prod.stock_quantity?.toString() || '0');
    setCategoryId(prod.category_id || '');
    setNewCategoryName('');
    setStatus(prod.status === 'draft' || prod.status === 'archived' ? prod.status : 'active');
    setFeatured(Boolean(prod.featured));
    setShortDescription(prod.short_description || '');
    setDescription(prod.description || '');

    // Populate images from relational product_images or fallback
    let imgs: ProductImageItem[] = [];
    if (prod.product_images && Array.isArray(prod.product_images) && prod.product_images.length > 0) {
      const sorted = [...prod.product_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      imgs = sorted.map((pi: any, idx: number) => ({
        id: pi.id,
        image_url: pi.image_url,
        storage_path: pi.storage_path || pi.image_url,
        alt_text: pi.alt_text || prod.name,
        sort_order: pi.sort_order ?? idx,
        is_primary: pi.is_primary ?? idx === 0,
        uploading: false
      }));
    } else if (prod.image_url) {
      imgs = [{
        image_url: prod.image_url,
        storage_path: prod.image_url,
        alt_text: prod.name,
        sort_order: 0,
        is_primary: true,
        uploading: false
      }];
    }
    setProductImages(imgs);
    setIsModalOpen(true);
  };

  const handleQuickToggleStatus = async (prod: any) => {
    const newStatus = prod.status === 'active' || prod.status === 'published' ? 'draft' : 'active';
    try {
      const res = await fetch(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_email
        })
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Product name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      alert('Please provide a valid price');
      return;
    }

    // Check if any images are still in uploading state
    if (productImages.some(img => img.uploading)) {
      alert('Please wait for image uploads to complete before saving.');
      return;
    }

    setIsSaving(true);

    let finalCategoryId = categoryId;
    if (categoryId === 'CREATE_NEW') {
      if (!newCategoryName.trim()) {
        alert('Please enter a name for the new category.');
        setIsSaving(false);
        return;
      }
      try {
        const catRes = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCategoryName.trim(),
            slug: newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            admin_email
          })
        });
        const catData = await catRes.json();
        if (catRes.ok && catData.category) {
          finalCategoryId = catData.category.id;
          fetchCategories();
        } else {
          alert(catData.error || 'Failed to create new category');
          setIsSaving(false);
          return;
        }
      } catch (err: any) {
        alert(`Failed to create category: ${err.message}`);
        setIsSaving(false);
        return;
      }
    }

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const generatedSku = sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    const payload = {
      name: name.trim(),
      slug: generatedSlug,
      sku: generatedSku,
      price: parseFloat(price),
      compare_price: comparePrice && !isNaN(parseFloat(comparePrice)) ? parseFloat(comparePrice) : null,
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      category_id: finalCategoryId || null,
      status: status || 'active',
      featured: Boolean(featured),
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      images: productImages.map((img, idx) => ({
        image_url: img.image_url,
        storage_path: img.storage_path || img.image_url,
        alt_text: img.alt_text || name,
        sort_order: img.sort_order ?? idx,
        is_primary: img.is_primary ?? idx === 0
      })),
      admin_email
    };

    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Are you sure you want to delete "${name || 'this product'}"? If it has historical customer orders, it will be safely archived from the store catalog.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.archived) {
          alert(data.message || 'Product is referenced by past orders and was archived from catalog.');
        }
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const filtered = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.slug && p.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Product Catalog &amp; Multi-Image Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage general e-commerce products, multiple images with Supabase Storage, pricing, and instant customer website sync</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total: {filtered.length} products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Product</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading products from Supabase...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No products found in the catalog.</td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const primaryImgObj = prod.product_images?.find((img: any) => img.is_primary) || prod.product_images?.[0];
                  const img = primaryImgObj?.image_url || prod.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                  const imageCount = prod.product_images?.length || (prod.image_url ? 1 : 0);
                  const isVisible = prod.status === 'active' || prod.status === 'published' || !prod.status;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40">
                      <td className="py-3 flex items-center gap-3">
                        <div className="relative">
                          <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-800 bg-slate-950" />
                          {imageCount > 1 && (
                            <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-slate-300 text-[9px] font-bold px-1 rounded-full">
                              +{imageCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {prod.name}
                            {prod.featured && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold rounded-md">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{prod.slug}</div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{prod.sku || 'N/A'}</td>
                      <td className="py-3 font-semibold text-emerald-400">
                        ৳{Number(prod.price).toLocaleString()}
                        {prod.compare_price && Number(prod.compare_price) > Number(prod.price) && (
                          <div className="text-[10px] text-slate-500 line-through">৳{Number(prod.compare_price).toLocaleString()}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          Number(prod.stock_quantity) > 5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          Number(prod.stock_quantity) > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {prod.stock_quantity} in stock
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{prod.categories?.name || prod.category?.name || 'Uncategorized'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleQuickToggleStatus(prod)}
                          title="Click to toggle status"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition ${
                            isVisible 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isVisible ? 'Active (Live)' : 'Draft (Hidden)'}</span>
                        </button>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedHistoryProductId(prod.id)}
                          className="inline-flex items-center gap-1 p-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-[11px] font-bold border border-purple-500/20 transition"
                          title="View Sales & Buyer Purchase History"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Sales History</span>
                        </button>
                        <a
                          href={`/products/${prod.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="View on Customer Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit Product & Multi-Image Gallery' : 'Create New Product'}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Premium Cotton Polo Shirt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">URL Slug (Unique URL)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="premium-cotton-polo-shirt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="SKU-1001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-semibold text-emerald-400"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Compare-at Price (BDT ৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="1500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 mb-2"
                  >
                    <option value="">Select Existing Category</option>
                    <option value="CREATE_NEW">+ Create New Category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {categoryId === 'CREATE_NEW' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-emerald-500 rounded-xl text-white text-xs focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Storefront Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="featured-toggle" className="text-xs font-medium text-slate-200 cursor-pointer">
                  Feature this product on homepage &amp; highlight badges
                </label>
              </div>

              {/* Advanced Multi-Image Uploader */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <ProductImageUploader
                  images={productImages}
                  onChange={setProductImages}
                  folder="products"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Short Summary (Optional)</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="Key highlights, material, guarantee..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Description &amp; Specifications</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="Detailed product information, sizing chart, instructions, warranty and care guide..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving to Database...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product Sales & Purchase History Modal */}
      {selectedHistoryProductId && (
        <ProductPurchaseHistoryModal
          productId={selectedHistoryProductId}
          onClose={() => setSelectedHistoryProductId(null)}
        />
      )}
    </div>
  );
}
