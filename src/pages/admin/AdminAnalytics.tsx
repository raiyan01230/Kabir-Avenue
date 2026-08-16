import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Sales Analytics &amp; Reports</h1>
        <p className="text-xs text-slate-400 mt-1">Real financial metrics calculated directly from Supabase orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="text-xs text-slate-400 mb-1">Gross Revenue</div>
          <div className="text-2xl font-extrabold text-emerald-400">৳{(analytics?.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="text-xs text-slate-400 mb-1">Total Orders Placed</div>
          <div className="text-2xl font-extrabold text-white">{analytics?.totalOrders || 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="text-xs text-slate-400 mb-1">Average Order Value</div>
          <div className="text-2xl font-extrabold text-blue-400">৳{Math.round(analytics?.averageOrderValue || 0).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="text-xs text-slate-400 mb-1">Completed Deliveries</div>
          <div className="text-2xl font-extrabold text-purple-400">{analytics?.deliveredCount || 0}</div>
        </div>
      </div>
    </div>
  );
}
