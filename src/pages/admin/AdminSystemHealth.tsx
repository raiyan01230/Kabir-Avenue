import { useEffect, useState } from 'react';
import { ShieldAlert, Download, CheckCircle, Database } from 'lucide-react';

export default function AdminSystemHealth() {
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading system health...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Health &amp; Data Exports</h1>
        <p className="text-xs text-slate-400 mt-1">Infrastructure diagnostics and secure CSV data export tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Infrastructure Status</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">Supabase Database</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.database}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">Storage Service</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.storage}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">Email Gateway (Resend)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {health?.emailService}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
              <span className="text-xs text-slate-300">Node.js Runtime</span>
              <span className="text-xs font-mono text-slate-400">{health?.nodeVersion}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Data Exports (CSV)</h2>
          <p className="text-xs text-slate-400">Download formatted CSV reports for offline analysis.</p>

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
