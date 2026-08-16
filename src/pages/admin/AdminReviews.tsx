import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchReviews = () => {
    fetch('/api/admin/reviews')
      .then(r => r.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_email })
    });
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete review?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Review Moderation</h1>
        <p className="text-xs text-slate-400 mt-1">Approve or reject customer product reviews before public storefront display</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Product</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Rating</th>
              <th className="pb-3">Review</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading reviews...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No reviews submitted yet.</td></tr>
            ) : (
              reviews.map(rev => (
                <tr key={rev.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-bold text-white">{rev.products?.name || 'Product'}</td>
                  <td className="py-3 text-slate-300">{rev.customers?.full_name || 'Customer'}</td>
                  <td className="py-3 flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-white">{rev.rating}</span>
                  </td>
                  <td className="py-3 text-slate-300 max-w-xs truncate">{rev.review_text}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rev.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {rev.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {rev.status !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(rev.id, 'approved')} className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg" title="Approve">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(rev.id, 'rejected')} className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg" title="Reject">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(rev.id)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
