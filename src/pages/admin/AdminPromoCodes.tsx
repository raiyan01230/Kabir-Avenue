import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Edit } from 'lucide-react';
import { notifyStoreDataChanged } from '../../lib/queries';

export default function AdminPromoCodes() {
  const [promos, setPromos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('1000');

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchPromos = () => {
    fetch('/api/admin/promo-codes')
      .then(r => r.json())
      .then(data => setPromos(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        discount_type: discountType,
        discount_value: Number(discountValue),
        minimum_order_amount: Number(minOrder),
        is_active: true,
        admin_email
      })
    });
    if (res.ok) {
      setIsModalOpen(false);
      setCode('');
      setDiscountValue('');
      fetchPromos();
      notifyStoreDataChanged();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete promo code?')) return;
    await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
    fetchPromos();
    notifyStoreDataChanged();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Promo Codes &amp; Coupons</h1>
          <p className="text-xs text-slate-400 mt-1">Create and manage discounts for customer checkout</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promo Code</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Code</th>
              <th className="pb-3">Discount Type</th>
              <th className="pb-3">Value</th>
              <th className="pb-3">Min Order</th>
              <th className="pb-3">Usage Count</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="py-3 font-bold text-white font-mono">{p.code}</td>
                <td className="py-3 capitalize text-slate-300">{p.discount_type}</td>
                <td className="py-3 font-semibold text-emerald-400">
                  {p.discount_type === 'percentage' ? `${p.discount_value}%` : `৳${p.discount_value}`}
                </td>
                <td className="py-3 text-slate-300">৳{p.minimum_order_amount || 0}</td>
                <td className="py-3 text-slate-400">{p.usage_count || 0}</td>
                <td className="py-3 text-right">
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create Promo Code</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Promo Code</label>
                <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs uppercase" placeholder="EID2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Value</label>
                  <input type="number" required value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" placeholder="10" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Order (BDT)</label>
                <input type="number" required value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
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
