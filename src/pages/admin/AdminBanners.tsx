import React, { useEffect, useState, useRef } from 'react';
import { Image as ImageIcon, Plus, Trash2, Upload, Loader2, Edit2, Eye, EyeOff, CheckCircle2, Crop, Sparkles, ArrowRight, ZoomIn, ZoomOut, Move, RotateCcw, Check } from 'lucide-react';

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

  // Cropping tool state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageSource, setRawImageSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@shmgadgetzone.com';

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

  // Open cropper for an existing or newly uploaded image
  const startCropImage = (sourceUrl: string) => {
    setRawImageSource(sourceUrl);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cropImageRef.current = img;
      setIsCropModalOpen(true);
    };
    img.onerror = () => {
      // If cross-origin fails, still open and attempt
      cropImageRef.current = img;
      setIsCropModalOpen(true);
    };
    img.src = sourceUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image file must be less than 15MB.');
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Open the crop tool immediately so admin can select the exact part of the image
      startCropImage(base64);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file');
    };
  };

  // Draw crop preview on canvas
  useEffect(() => {
    if (!isCropModalOpen || !canvasRef.current || !cropImageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = cropImageRef.current;
    const targetWidth = canvas.width; // 1200
    const targetHeight = canvas.height; // 500

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Calculate scaling to cover 1200x500
    const imgAspect = img.width / img.height;
    const targetAspect = targetWidth / targetHeight;

    let baseWidth, baseHeight;
    if (imgAspect > targetAspect) {
      baseHeight = targetHeight;
      baseWidth = targetHeight * imgAspect;
    } else {
      baseWidth = targetWidth;
      baseHeight = targetWidth / imgAspect;
    }

    const scaledWidth = baseWidth * cropZoom;
    const scaledHeight = baseHeight * cropZoom;

    // Center plus offsets
    const x = (targetWidth - scaledWidth) / 2 + cropOffsetX;
    const y = (targetHeight - scaledHeight) / 2 + cropOffsetY;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }, [isCropModalOpen, cropZoom, cropOffsetX, cropOffsetY, rawImageSource]);

  // Handle Dragging / Panning on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffsetX, y: e.clientY - cropOffsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setCropOffsetX(e.clientX - dragStart.x);
    setCropOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Apply Crop: export canvas to high-res WebP/JPEG and upload to Supabase
  const applyCropAndUpload = async () => {
    if (!canvasRef.current) return;
    setIsCropping(true);
    setUploadError(null);

    try {
      const croppedBase64 = canvasRef.current.toDataURL('image/jpeg', 0.92);

      const res = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: croppedBase64,
          fileName: `banner-crop-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folder: 'banners'
        })
      });

      const data = await res.json();
      if (res.ok && data.publicUrl) {
        setImageUrl(data.publicUrl);
        setIsCropModalOpen(false);
      } else {
        // Fallback to the local cropped base64 if storage is unreachable
        setImageUrl(croppedBase64);
        setIsCropModalOpen(false);
      }
    } catch (err: any) {
      if (canvasRef.current) {
        setImageUrl(canvasRef.current.toDataURL('image/jpeg', 0.92));
      }
      setIsCropModalOpen(false);
    } finally {
      setIsCropping(false);
    }
  };

  // Position presets
  const applyPreset = (preset: 'top' | 'center' | 'bottom' | 'left' | 'right') => {
    if (!canvasRef.current || !cropImageRef.current) return;
    const canvas = canvasRef.current;
    const img = cropImageRef.current;
    const targetWidth = canvas.width;
    const targetHeight = canvas.height;

    const imgAspect = img.width / img.height;
    const targetAspect = targetWidth / targetHeight;

    let baseWidth, baseHeight;
    if (imgAspect > targetAspect) {
      baseHeight = targetHeight;
      baseWidth = targetHeight * imgAspect;
    } else {
      baseWidth = targetWidth;
      baseHeight = targetWidth / imgAspect;
    }

    const scaledWidth = baseWidth * cropZoom;
    const scaledHeight = baseHeight * cropZoom;

    if (preset === 'center') {
      setCropOffsetX(0);
      setCropOffsetY(0);
    } else if (preset === 'top') {
      setCropOffsetX(0);
      setCropOffsetY((scaledHeight - targetHeight) / 2);
    } else if (preset === 'bottom') {
      setCropOffsetX(0);
      setCropOffsetY(-(scaledHeight - targetHeight) / 2);
    } else if (preset === 'left') {
      setCropOffsetX((scaledWidth - targetWidth) / 2);
      setCropOffsetY(0);
    } else if (preset === 'right') {
      setCropOffsetX(-(scaledWidth - targetWidth) / 2);
      setCropOffsetY(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('Banner image is required');
      return;
    }

    // Only send valid database columns to avoid schema cache errors
    const payload = {
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      image_url: imageUrl,
      button_text: buttonText.trim() || 'Shop Now',
      button_link: buttonLink.trim() || '/shop',
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
          <p className="text-xs text-slate-400 mt-1">Manage promotional banners, crop framing, and live previews on the customer storefront</p>
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
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800/80 group">
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
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-sm">No homepage banners found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first dynamic banner to display on the storefront carousel.</p>
            <button onClick={openCreateModal} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Banner Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <span>{editingBannerId ? 'Edit Homepage Banner' : 'Add Homepage Banner'}</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Recommended: 1200 × 500 px</span>
            </div>

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
                  placeholder="e.g. 20% off with promo code 'RIYA'"
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

              {/* Banner Image & Cropping Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Banner Image &amp; Crop Selection
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => startCropImage(imageUrl)}
                      className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Crop / Select Part of Image</span>
                    </button>
                  )}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                {imageUrl ? (
                  <div className="space-y-2">
                    {/* Live Storefront Preview of the Banner */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-[12/5] group">
                      <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                      
                      {/* Vignette & Gradients identical to homepage */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

                      {/* Overlaid Storefront Text Preview */}
                      <div className="absolute inset-0 flex items-center p-6 sm:p-8">
                        <div className="max-w-md space-y-2">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold text-slate-200 uppercase tracking-widest">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>Featured Highlight</span>
                          </div>
                          <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
                            {title || 'Banner Title Example'}
                          </h3>
                          {subtitle && (
                            <p className="text-xs text-slate-300 line-clamp-2">
                              {subtitle}
                            </p>
                          )}
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-950 text-xs font-black rounded-lg shadow-md">
                              <span>{buttonText || 'Shop Now'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Change Image & Re-crop Actions */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCropImage(imageUrl)}
                          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-emerald-400 rounded-xl text-xs font-bold border border-slate-700 shadow-lg flex items-center gap-1.5"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop Frame</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-rose-400 rounded-xl text-xs font-bold border border-slate-700 shadow-lg"
                        >
                          Change Image
                        </button>
                      </div>

                      <div className="absolute bottom-2 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] text-slate-400 font-mono">
                        Live Storefront Preview
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950 flex flex-col items-center justify-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-emerald-500/50 transition">
                      <Upload className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Click to upload banner image</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">You can crop and frame any section of the image after selecting</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Supports PNG, JPG, WebP up to 15MB</span>
                  </div>
                )}

                <div className="mt-2">
                  <label className="block text-[10px] text-slate-400 mb-1">Or paste Image URL directly &amp; crop:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => startCropImage(imageUrl)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Crop</span>
                      </button>
                    )}
                  </div>
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

      {/* Interactive Image Cropper & Framing Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Crop className="w-5 h-5 text-emerald-400" />
                  <span>Select &amp; Crop Part of Banner Image</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drag the image or use zoom and position controls to select exactly which part appears in the 1200×500 banner
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Aspect Ratio: 1200 × 500 px
              </span>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-2xl flex items-center justify-center cursor-move">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={500}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full h-auto max-h-[380px] object-contain"
                />

                {/* Overlaid Grid / Framing Guide */}
                <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3 opacity-30" />

                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-[11px] text-white px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
                  <Move className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Click &amp; drag anywhere on image to pan / position</span>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Zoom Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zoom / Scale: {Math.round(cropZoom * 100)}%</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setCropZoom(1); setCropOffsetX(0); setCropOffsetY(0); }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCropZoom(prev => Math.max(0.6, prev - 0.1))}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="0.6"
                        max="3"
                        step="0.05"
                        value={cropZoom}
                        onChange={e => setCropZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setCropZoom(prev => Math.min(3, prev + 0.1))}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preset Focus Positions */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Quick Framing Presets:
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['center', 'top', 'bottom', 'left', 'right'] as const).map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg border border-slate-800 transition capitalize"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCropModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCropAndUpload}
                disabled={isCropping}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {isCropping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Crop &amp; Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Crop &amp; Use Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
