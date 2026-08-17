import React, { useEffect, useState, useRef } from 'react';
import { Image, Plus, Trash2, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setUploadError('Banner image is required');
      return;
    }
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, image_url: imageUrl, button_text: 'Shop Now', button_link: '/shop', admin_email })
    });
    if (res.ok) {
      setIsModalOpen(false);
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      setUploadError(null);
      fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Homepage Banners</h1>
          <p className="text-xs text-slate-400 mt-1">Manage active promotional carousel banners on the storefront</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setImageUrl(''); setTitle(''); setSubtitle(''); setUploadError(null); }} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map(b => (
          <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 flex flex-col justify-between">
            <div className="relative h-40 rounded-xl overflow-hidden mb-3 bg-slate-950">
              <img src={b.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{b.title}</h3>
              <p className="text-xs text-slate-400">{b.subtitle}</p>
            </div>
            <div className="flex justify-end pt-3 mt-3 border-t border-slate-800">
              <button onClick={() => handleDelete(b.id)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-white mb-4">Add Homepage Banner</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banner Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Mega Sale" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle</label>
                <input type="text" required value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Up to 50% off on all gadgets" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banner Image</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                
                {imageUrl ? (
                  <div className="relative h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-2">
                    <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-rose-400 rounded-lg text-xs font-semibold hover:bg-slate-900">Change</button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950 flex flex-col items-center justify-center">
                    {uploading ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs">
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
                  <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
                </div>

                {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={uploading || !imageUrl} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition">Create Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
