import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Plus, Trash2, Edit, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';

export default function AdminContactLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Head Office',
    address: '',
    phone: '',
    email: '',
    hours: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/contact-locations');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const url = editingId ? `/api/contact-locations/${editingId}` : '/api/contact-locations';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save contact location');

      setSuccess(true);
      setShowModal(false);
      setEditingId(null);
      setFormData({ title: '', type: 'Head Office', address: '', phone: '', email: '', hours: '' });
      loadLocations();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (loc: any) => {
    setEditingId(loc.id);
    setFormData({
      title: loc.title || '',
      type: loc.type || 'Head Office',
      address: loc.address || '',
      phone: loc.phone || '',
      email: loc.email || '',
      hours: loc.hours || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact location?')) return;
    try {
      const res = await fetch(`/api/contact-locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadLocations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Store Contact Information &amp; Locations</h1>
          <p className="text-xs text-slate-400 mt-1">Add, edit, and delete official store branches, warehouses, hotlines, and contact addresses displayed on the public website</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', type: 'Head Office', address: '', phone: '', email: '', hours: '' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact Location</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Contact location successfully updated and synchronized with storefront!</span>
        </div>
      )}

      {/* Locations Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading contact information...</div>
      ) : locations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Contact Locations Added Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Click the button above to add your head office, customer care hotline, regional showroom, or warehouse address.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/25">
                    {loc.type || 'Location'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(loc)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{loc.title}</h3>

                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </div>
                  {loc.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                  {loc.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{loc.email}</span>
                    </div>
                  )}
                  {loc.hours && (
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{loc.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit Contact Location */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white">
                {editingId ? 'Edit Contact Location' : 'Add New Contact Location'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Location Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Head Office & Showroom"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Location Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Showroom">Experience Showroom</option>
                    <option value="Warehouse">Warehouse Hub</option>
                    <option value="Hotline Support">Hotline Support</option>
                    <option value="Regional Branch">Regional Branch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., Level 4, Tech Plaza, Agargaon, Dhaka-1207"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone / Hotline</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +880 1700-000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., support@shmgadgetzone.bd"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Hours</label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="e.g., Saturday – Thursday: 10:00 AM – 8:00 PM"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingId ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
