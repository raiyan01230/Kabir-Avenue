import React, { useEffect, useState, useRef } from 'react';
import { Image, Plus, Trash2, Upload, Loader2, Edit2, Eye, EyeOff, CheckCircle2, ArrowUpDown } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  storage_path?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchBanners = () => {
    fetch('/api/admin/banners')
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBannerId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setButtonText('Shop Now');
    setButtonLink('/shop');
    setSortOrder('0');
    setIsActive(true);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerItem) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.image_url || '');
    setButtonText(banner.button_text || 'Shop Now');
    setButtonLink(banner.button_link || '/shop');
    setSortOrder((banner.sort_order ?? 0).toString());
    setIsActive(banner.is_active ?? true);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file must be less than 10MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            mimeType: file.type,
            folder: 'banners'
          })
        });

        const data = await res.json();
        if (res.ok && data.publicUrl) {
          setImageUrl(data.publicUrl);
        } else {
          setUploadError(data.error || 'Failed to upload banner image');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read image file');
        setUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('Banner image is required');
      return;
    }

    const payload = {
      title,
      subtitle,
      image_url: imageUrl,
      storage_path: imageUrl,
      button_text: buttonText || 'Shop Now',
      button_link: buttonLink || '/shop',
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
      admin_email
    };

    const url = editingBannerId ? `/api/admin/banners/${editingBannerId}` : '/api/admin/banners';
    const method = editingBannerId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchBanners();
    } else {
      const data = await res.json();
      setUploadError(data.error || 'Failed to save banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  const toggleStatus = async (banner: BannerItem) => {
    const newStatus = !(banner.is_active ?? true);
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus, admin_email })
    });
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Homepage Banners</h1>
          <p className="text-xs text-slate-400 mt-1">Manage dynamic promotional carousel banners on the customer storefront</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {banners.map(b => {
          const active = b.is_active !== false;
          return (
            <div key={b.id} className={`bg-slate-900 border rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition ${active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`}>
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800/80">
                  <img src={b.image_url} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-white border border-slate-800">
                    <span>Order: {b.sort_order ?? 0}</span>
                  </div>
                  <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md ${active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-700'}`}>
                    {active ? 'Active' : 'Hidden'}
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-1">{b.title || 'Untitled Banner'}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{b.subtitle || 'No subtitle'}</p>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/50">
                  <span className="truncate max-w-[150px]">Link: <strong className="text-slate-300">{b.button_link || '/shop'}</strong></span>
                  <span className="text-emerald-400 font-semibold">{b.button_text || 'Shop Now'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-800">
                <button
                  onClick={() => toggleStatus(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${active ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                >
                  {active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{active ? 'Hide' : 'Publish'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {banners.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-sm">No homepage banners found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first dynamic banner to display on the storefront carousel.</p>
            <button onClick={openCreateModal} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingBannerId ? 'Edit Homepage Banner' : 'Add Homepage Banner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Banner Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Summer Mega Sale"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. Up to 50% off on all trending gadgets"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Button Link URL</label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={e => setButtonLink(e.target.value)}
                    placeholder="e.g. /shop or /category/smartphones"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banner Image (Recommended: 1200x500px)</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                {imageUrl ? (
                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-2">
                    <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/90 text-rose-400 rounded-lg text-xs font-semibold hover:bg-slate-900 border border-slate-700"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950 flex flex-col items-center justify-center"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to Supabase Storage...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">Click to upload banner image</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 10MB</span>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-2">
                  <label className="block text-[10px] text-slate-400 mb-1">Or paste Image URL directly</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {uploadError && <p className="text-xs text-rose-400 mt-1 font-medium">{uploadError}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerIsActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="bannerIsActive" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Publish Banner (Visible on Storefront Carousel)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !imageUrl}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition shadow-lg shadow-emerald-900/30"
                >
                  {editingBannerId ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
