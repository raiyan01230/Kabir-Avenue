import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, Edit, CheckCircle2, Lock, Mail, User, Shield } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = editingUserId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save admin user');

      setShowModal(false);
      setEditingUserId(null);
      setFormData({ fullName: '', email: '', password: '', role: 'staff', isActive: true });
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      fullName: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'staff',
      isActive: user.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.is_active })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Admin Users &amp; Staff Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage administrative personnel, access roles, and account permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingUserId(null);
            setFormData({ fullName: '', email: '', password: '', role: 'staff', isActive: true });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff / Admin</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
              <th className="p-4">Name &amp; Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Loading admin users...</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="space-y-2">
                    <p>No extra staff accounts created yet. Default Super Admin: <span className="text-emerald-400">admin@hyperdrive.bd</span></p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                        u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-4 text-slate-400 text-[11px]">
                    {new Date(u.created_at || u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit Staff */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white">
                {editingUserId ? 'Edit Staff Account' : 'Create New Staff / Admin'}
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
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., Rahim Uddin"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., staff@shmgadgetzone.bd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {editingUserId ? 'New Password (leave blank to keep unchanged)' : 'Password *'}
                </label>
                <input
                  type="password"
                  {...(!editingUserId ? { required: true } : {})}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Access Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="staff">Staff (Limited Operations)</option>
                  <option value="admin">Admin (Managerial Access)</option>
                  <option value="super_admin">Super Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-300">
                  Account is active and allowed to login
                </label>
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
                  {editingUserId ? 'Update Staff Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
