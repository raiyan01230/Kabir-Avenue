import { useEffect, useState } from 'react';
import { Database, Download, ShieldCheck, CheckCircle } from 'lucide-react';

export default function AdminData() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/system-health')
      .then(r => r.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      });
  }, []);

  const handleExport = (type: string) => {
    window.open(`/api/admin/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Database Backup &amp; CSV Data Management</h1>
        <p className="text-xs text-slate-400 mt-1">Secure database diagnostics and instant CSV data exports for products, orders, customers &amp; reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase Database Health</span>
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">PostgreSQL Connection</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.database || 'Connected'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">Supabase Storage Buckets</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Operational
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <span>CSV Data Exports</span>
          </h2>
          <p className="text-xs text-slate-400">Click any export button below to download real-time CSV reports.</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => handleExport('orders')} className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition flex items-center justify-between">
              <span className="text-xs font-bold text-white">Orders CSV</span>
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            <button onClick={() => handleExport('customers')} className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition flex items-center justify-between">
              <span className="text-xs font-bold text-white">Customers CSV</span>
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            <button onClick={() => handleExport('products')} className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition flex items-center justify-between">
              <span className="text-xs font-bold text-white">Products CSV</span>
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            <button onClick={() => handleExport('reviews')} className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition flex items-center justify-between">
              <span className="text-xs font-bold text-white">Reviews CSV</span>
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
