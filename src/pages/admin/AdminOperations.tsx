import { useEffect, useState } from 'react';
import { Activity, Bell, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export default function AdminOperations() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Business Operations &amp; Workflows</h1>
        <p className="text-xs text-slate-400 mt-1">Automated order stage transitions, audit timestamps, and Resend email status logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Automated Order State Pipeline</h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-white">New Order Placed</div>
                <div className="text-[10px] text-slate-400">Triggered on customer checkout submission</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-white">Resend Order Confirmation Email</div>
                <div className="text-[10px] text-slate-400">Automatically dispatches invoice &amp; tracking details via Resend API</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-white">Stock Deduction on Confirmation</div>
                <div className="text-[10px] text-slate-400">Automatically decrements warehouse inventory upon order placement</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Low Stock Threshold</h2>
          <p className="text-xs text-slate-400">Products with stock ≤ 5 units are highlighted across inventory warnings.</p>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-extrabold text-amber-400">Threshold: 5</div>
            <div className="text-[11px] text-slate-400 mt-1">Configured in Database Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
}
