import { useEffect, useState } from 'react';
import { Database, Edit } from 'lucide-react';

export default function AdminInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  const fetchInv = () => {
    fetch('/api/admin/inventory')
      .then(r => r.json())
      .then(data => {
        setInventory(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInv();
  }, []);

  const handleUpdateStock = async (id: string, currentStock: number) => {
    const val = prompt('Enter new stock quantity:', String(currentStock));
    if (val === null) return;
    const newQty = parseInt(val, 10);
    if (isNaN(newQty)) return;

    await fetch(`/api/admin/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity: newQty, admin_email })
    });
    fetchInv();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Inventory Management</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time stock levels and warehouse inventory control</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Product Name</th>
              <th className="pb-3">SKU</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Stock Quantity</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading inventory...</td></tr>
            ) : inventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40">
                <td className="py-3 font-bold text-white">{item.name}</td>
                <td className="py-3 text-slate-400 font-mono">{item.sku || 'N/A'}</td>
                <td className="py-3 text-emerald-400 font-semibold">৳{Number(item.price).toLocaleString()}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.stock_quantity > 5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {item.stock_quantity} units
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button onClick={() => handleUpdateStock(item.id, item.stock_quantity)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                    Adjust Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
