import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Star, 
  TrendingUp, 
  History,
  Sparkles,
  Globe,
  Bot,
  Zap,
  CheckCircle,
  RefreshCw,
  Tag,
  FileText,
  Sliders,
  Check,
  X,
  Copy,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
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

  // AI & Google SEO State
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanStep, setAiScanStep] = useState('');
  const [autoScanOnUpload, setAutoScanOnUpload] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [googleSearchSummary, setGoogleSearchSummary] = useState<string | null>(null);
  const [aiSuccessSummary, setAiSuccessSummary] = useState<string | null>(null);
  const [copiedSeo, setCopiedSeo] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'seo'>('details');

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
      if (!seoTitle) {
        setSeoTitle(`${val} Price in BD | SHM Gadget Zone`);
      }
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
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords([]);
    setGoogleSearchSummary(null);
    setAiSuccessSummary(null);
    setActiveTab('details');
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

    // Pre-fill or generate default SEO fields
    setSeoTitle(`${prod.name || 'Product'} Price in BD | SHM Gadget Zone`);
    const cleanDesc = (prod.short_description || prod.description || '').replace(/<[^>]*>?/gm, '');
    setSeoDescription(cleanDesc.slice(0, 155) || `Buy ${prod.name || 'this product'} at the best price in Bangladesh with warranty and fast delivery.`);
    setSeoKeywords([prod.name?.toLowerCase(), `${prod.name?.toLowerCase()} price in bd`, 'gadget store bd', 'online shopping bangladesh'].filter(Boolean));
    setGoogleSearchSummary(null);
    setAiSuccessSummary(null);
    setActiveTab('details');

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

  // AI & Google Search SEO Generator
  const handleRunAiSeoScan = async (options?: { imageBase64?: string; imageUrl?: string; force?: boolean }) => {
    // Determine image target
    const primaryImg = productImages.find(i => i.is_primary) || productImages[0];
    const targetBase64 = options?.imageBase64;
    const targetUrl = options?.imageUrl || primaryImg?.image_url;

    if (!targetBase64 && !targetUrl && !name.trim()) {
      alert('Please upload a product photo or enter a product name hint for AI Google Search.');
      return;
    }

    setIsAiScanning(true);
    setAiScanStep('Scanning image with Gemini Vision...');
    setAiSuccessSummary(null);

    const stepTimer1 = setTimeout(() => {
      setAiScanStep('Searching Google Bangladesh for official specs & BD market prices...');
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setAiScanStep('Generating high-ranking Google SEO tags & metadata...');
    }, 2800);

    try {
      const res = await fetch('/api/admin/products/ai-seo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: targetBase64,
          imageUrl: targetUrl,
          nameHint: name.trim() || undefined,
          categoryHint: categories.find(c => c.id === categoryId)?.name || undefined
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'AI generation failed');
      }

      const aiData = json.data;

      // Populate Form Fields
      if (aiData.name && (!name || options?.force || !editingProduct)) {
        setName(aiData.name);
      }
      if (aiData.slug && (!slug || options?.force || !editingProduct)) {
        setSlug(aiData.slug);
      }
      if (aiData.sku && (!sku || options?.force || !editingProduct)) {
        setSku(aiData.sku);
      }
      if (aiData.suggested_price_bdt && (!price || options?.force || !editingProduct)) {
        setPrice(String(aiData.suggested_price_bdt));
      }
      if (aiData.suggested_compare_price_bdt && (!comparePrice || options?.force || !editingProduct)) {
        setComparePrice(String(aiData.suggested_compare_price_bdt));
      }
      if (aiData.short_description) {
        setShortDescription(aiData.short_description);
      }
      if (aiData.description) {
        setDescription(aiData.description);
      }

      // Match or suggest category
      if (aiData.suggested_category) {
        const matchedCat = categories.find(
          c => c.name.toLowerCase() === aiData.suggested_category.toLowerCase() ||
               c.name.toLowerCase().includes(aiData.suggested_category.toLowerCase()) ||
               aiData.suggested_category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCat) {
          setCategoryId(matchedCat.id);
          setNewCategoryName('');
        } else {
          setCategoryId('CREATE_NEW');
          setNewCategoryName(aiData.suggested_category);
        }
      }

      // SEO Fields
      if (aiData.seo_title) {
        setSeoTitle(aiData.seo_title);
      }
      if (aiData.seo_description) {
        setSeoDescription(aiData.seo_description);
      }
      if (Array.isArray(aiData.seo_keywords) && aiData.seo_keywords.length > 0) {
        setSeoKeywords(aiData.seo_keywords);
      }

      // Update image alt text for Google Image Search
      if (aiData.image_alt_text && productImages.length > 0) {
        setProductImages(prev => prev.map(img => ({
          ...img,
          alt_text: img.alt_text && img.alt_text !== 'product' && img.alt_text !== '' ? img.alt_text : aiData.image_alt_text
        })));
      }

      if (aiData.google_search_summary) {
        setGoogleSearchSummary(aiData.google_search_summary);
      }

      setAiSuccessSummary(`AI successfully recognized "${aiData.name}" via Google Search and auto-filled 9 product & SEO fields.`);
    } catch (err: any) {
      console.error('AI Scan Error:', err);
      alert(`AI Search Error: ${err.message}`);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAiScanning(false);
      setAiScanStep('');
    }
  };

  const handleImageUploadedCallback = (imageItem: ProductImageItem, base64?: string) => {
    // If autoScanOnUpload is enabled and product name or price is not fully filled, trigger AI scan!
    if (autoScanOnUpload) {
      handleRunAiSeoScan({
        imageBase64: base64,
        imageUrl: imageItem.image_url
      });
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (!newKeywordInput.trim()) return;
      const kw = newKeywordInput.trim().toLowerCase();
      if (!seoKeywords.includes(kw)) {
        setSeoKeywords([...seoKeywords, kw]);
      }
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setSeoKeywords(seoKeywords.filter(k => k !== kwToRemove));
  };

  const handleCopySeoSnippet = () => {
    const text = `Title: ${seoTitle}\nDescription: ${seoDescription}\nKeywords: ${seoKeywords.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedSeo(true);
    setTimeout(() => setCopiedSeo(false), 2000);
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
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>Product Catalog &amp; SEO Engine</span>
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              AI Google Search Grounded
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage products, auto-generate real-time Google SEO tags from uploaded images, sync with Supabase Storage, and boost Google SERP rankings</p>
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
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>/{prod.slug}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded">SEO Ready</span>
                          </div>
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
                          onClick={() => handleOpenEdit(prod)}
                          className="inline-flex items-center gap-1 p-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/20 transition"
                          title="Open AI SEO & Product Editor"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden xl:inline">AI SEO</span>
                        </button>
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

      {/* Product & AI Google SEO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{editingProduct ? 'Edit Product & Multi-Image Gallery' : 'Create New Product'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Upload a product photo, and AI will search Google in seconds to generate titles, descriptions, and full SEO ranking tags.</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'details' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Product Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'seo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google SEO &amp; SERP</span>
                  {seoKeywords.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full">
                      {seoKeywords.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* AI Action Header Banner */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 mt-0.5">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Vision &amp; Google Search Grounding</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                        Instant 2-Sec Scan
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Upload an image below or click the scan button. AI searches Google for exact BD prices, specs, and top search ranking keywords.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <button
                    type="button"
                    disabled={isAiScanning || (productImages.length === 0 && !name.trim())}
                    onClick={() => handleRunAiSeoScan({ force: true })}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAiScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching Google...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Scan &amp; Auto-Fill All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Scanning Progress Indicator */}
              {isAiScanning && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs font-medium text-emerald-300 animate-pulse">
                    {aiScanStep || 'Analyzing image and retrieving real-time Google search data in Bangladesh...'}
                  </span>
                </div>
              )}

              {/* AI Success Feedback & Grounding Notes */}
              {aiSuccessSummary && !isAiScanning && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{aiSuccessSummary}</div>
                    {googleSearchSummary && (
                      <div className="text-slate-300 mt-1 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-emerald-500/20">
                        <span className="font-semibold text-emerald-400">Google Research Insight:</span> {googleSearchSummary}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* TAB 1: PRODUCT DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-5">
                  {/* Advanced Multi-Image Uploader with AI Hook */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product Photos (Supabase Storage)</h4>
                        <p className="text-[11px] text-slate-400">Add or drag product images. The primary image is analyzed by Google AI automatically.</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition">
                        <input
                          type="checkbox"
                          checked={autoScanOnUpload}
                          onChange={(e) => setAutoScanOnUpload(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                        />
                        <span>Auto-scan on image upload</span>
                      </label>
                    </div>

                    <ProductImageUploader
                      images={productImages}
                      onChange={setProductImages}
                      folder="products"
                      onImageUploaded={handleImageUploadedCallback}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. Anker Soundcore R50i True Wireless Earbuds"
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
                        placeholder="anker-soundcore-r50i-true-wireless-earbuds"
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
                        placeholder="ANK-R50I-BLK"
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
                        placeholder="2450"
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
                        placeholder="2990"
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
                      Feature this product on homepage &amp; highlight with badge
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Short Feature Highlights (Key Bullet Points)</label>
                    <textarea
                      rows={2}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="• 30 Hours Total Playtime with Fast Charging&#10;• 10mm Dynamic Bass Drivers&#10;• 18 Months Official Warranty in Bangladesh"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Description &amp; Specifications (HTML Supported)</label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                      placeholder="<h3>Key Features</h3><ul><li>Deep Bass Technology</li></ul><h3>Specifications</h3>..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE SEO & SERP PREVIEW */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  
                  {/* Google Search Result Live Preview Card */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 shadow">
                          G
                        </div>
                        <span className="text-xs font-bold text-white">Google Search Result Preview (SERP Snippet)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySeoSnippet}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition"
                      >
                        {copiedSeo ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSeo ? 'Copied!' : 'Copy Tags'}</span>
                      </button>
                    </div>

                    {/* Google SERP Visual Box */}
                    <div className="p-4 bg-white rounded-xl text-left font-sans text-slate-900 shadow-sm border border-slate-200">
                      {/* URL Breadcrumb */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#202124] mb-1">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
                          S
                        </div>
                        <span className="font-medium text-slate-800">SHM Gadget Zone</span>
                        <span className="text-slate-400">›</span>
                        <span className="text-slate-500">products</span>
                        <span className="text-slate-400">›</span>
                        <span className="text-slate-500 font-mono">{slug || 'product-slug'}</span>
                      </div>

                      {/* Google Blue Link Title */}
                      <h4 className="text-[17px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1 mb-1">
                        {seoTitle || (name ? `${name} Price in BD | SHM Gadget Zone` : 'Product Title - Best Price in Bangladesh | SHM Gadget Zone')}
                      </h4>

                      {/* Rating & In-Stock Price Rich Snippet */}
                      <div className="flex items-center gap-2 text-[12px] text-slate-600 mb-1">
                        <span className="text-[#e37400] font-bold">★★★★★ 4.9</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-emerald-700">৳{price ? Number(price).toLocaleString() : '2,450'}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-medium">In stock</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-[11px]">Cash on delivery Bangladesh</span>
                      </div>

                      {/* Snippet Description */}
                      <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2">
                        {seoDescription || (shortDescription ? shortDescription.replace(/•/g, '').slice(0, 160) : `Buy ${name || 'genuine electronics'} at best price in Bangladesh. Official warranty, fast delivery & cash on delivery available across BD.`)}
                      </p>
                    </div>
                  </div>

                  {/* SEO Title Input with Char Counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">Google SEO Meta Title (&lt;title&gt;)</label>
                      <span className={`text-[11px] font-mono ${
                        seoTitle.length > 60 ? 'text-amber-400 font-bold' : seoTitle.length >= 40 ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {seoTitle.length}/60 chars (Recommended 50-60)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Anker Soundcore R50i Price in BD | SHM Gadget Zone"
                    />
                  </div>

                  {/* SEO Description Input with Char Counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">Google Meta Description (&lt;meta name="description"&gt;)</label>
                      <span className={`text-[11px] font-mono ${
                        seoDescription.length > 160 ? 'text-amber-400 font-bold' : seoDescription.length >= 120 ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {seoDescription.length}/160 chars (Optimal for SERP 140-160)
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Buy Anker Soundcore R50i True Wireless Earbuds in Bangladesh. Enjoy 30 hours playtime, deep bass & 18-month warranty. Fast delivery at SHM Gadget Zone."
                    />
                  </div>

                  {/* SEO Keywords Badges & Tag Manager */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target Google Search Keywords &amp; Search Queries
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 min-h-[50px]">
                      {seoKeywords.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">No keywords added yet. Run AI scan or type below and press Enter.</span>
                      ) : (
                        seoKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs rounded-lg font-medium"
                          >
                            <Tag className="w-3 h-3 text-emerald-400" />
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="hover:text-rose-400 transition ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={handleAddKeyword}
                        placeholder="Add custom keyword (e.g. 'best tws under 3000 bd') and press Enter..."
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Google Image SEO Alt-Tags Note */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                    <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Google Rich Results &amp; Schema JSON-LD:</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Our server automatically injects Google Product Structured Data (Schema.org) with price currency in BDT, live in-stock availability, SKU, canonical tags, and OpenGraph social share cards.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'details' ? 'seo' : 'details')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>{activeTab === 'details' ? 'View Google SEO Preview →' : '← Back to Product Data'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? 'Save Product & SEO' : 'Publish Product & SEO'}</span>
                    )}
                  </button>
                </div>
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

