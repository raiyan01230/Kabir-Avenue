import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Layers, Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { notifyStoreDataChanged } from '../../lib/queries';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchCats = () => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setSortOrder('0');
    setIsActive(true);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditing(c);
    setName(c.name || '');
    setSlug(c.slug || '');
    setDescription(c.description || '');
    setImageUrl(c.image_url || c.imageUrl || '');
    setSortOrder((c.sort_order ?? 0).toString());
    setIsActive(c.is_active ?? true);
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
            folder: 'categories'
          })
        });

        const data = await res.json();
        if (res.ok && data.publicUrl) {
          setImageUrl(data.publicUrl);
        } else {
          setUploadError(data.error || 'Failed to upload category image');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = {
      name,
      slug: finalSlug,
      description,
      image_url: imageUrl,
      storage_path: imageUrl,
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
      admin_email
    };

    const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchCats();
      notifyStoreDataChanged();
    } else {
      const data = await res.json();
      setUploadError(data.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    fetchCats();
    notifyStoreDataChanged();
  };

  const toggleStatus = async (cat: any) => {
    const newStatus = !(cat.is_active ?? true);
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus, admin_email })
    });
    fetchCats();
    notifyStoreDataChanged();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Category Management</h1>
          <p className="text-xs text-slate-400 mt-1">Organize storefront product categories, images, and sort order dynamically</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3 pl-2">Category</th>
              <th className="pb-3">Slug</th>
              <th className="pb-3">Description</th>
              <th className="pb-3 text-center">Sort Order</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {categories.map((cat) => {
              const active = cat.is_active !== false;
              return (
                <tr key={cat.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 pl-2 flex items-center gap-3">
                    {cat.image_url || cat.imageUrl ? (
                      <img src={cat.image_url || cat.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-800 bg-slate-950 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Layers className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-sm">{cat.name}</div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-400 font-mono text-[11px]">{cat.slug}</td>
                  <td className="py-3.5 text-slate-300 max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="py-3.5 text-center text-slate-300 font-bold">{cat.sort_order ?? 0}</td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => toggleStatus(cat)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{active ? 'Active' : 'Hidden'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 text-right pr-2 space-x-2">
                    <button onClick={() => handleOpenEdit(cat)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition" title="Edit Category">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition" title="Delete Category">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No categories found. Create your first category above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Category' : 'Create Category'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Gaming & PC"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. gaming-pc"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-slate-300">Active (Visible on Storefront)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. High performance gaming hardware & peripherals"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category Image / Icon</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                {imageUrl ? (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-2 flex items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-slate-900/90 text-rose-400 rounded-lg text-xs font-semibold border border-slate-700"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 text-center cursor-pointer transition bg-slate-950 flex flex-col items-center justify-center"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading image...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                        <span className="text-xs font-semibold text-slate-300">Click to upload category image</span>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Or paste image URL here..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {uploadError && <p className="text-xs text-rose-400 mt-1 font-medium">{uploadError}</p>}
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
                  disabled={uploading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-900/30"
                >
                  {editing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
