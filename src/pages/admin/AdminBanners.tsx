import React, { useEffect, useState } from 'react';
import { Image, Plus, Trash2 } from 'lucide-react';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchBanners = () => {
    fetch('/api/admin/banners')
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
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
              <button onClick={() => handleDelete(b.id)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle</label>
                <input type="text" required value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Image URL</label>
                <input type="text" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
