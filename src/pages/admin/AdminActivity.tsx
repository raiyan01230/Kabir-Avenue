import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/activity')
      .then(r => r.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Activity &amp; Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-1">Chronological record of administrative actions and data modifications</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3">Admin</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Resource</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading audit logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No activity logged yet.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-medium text-slate-200">{log.admin_email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{log.resource}</td>
                  <td className="py-3 text-slate-300">{log.description}</td>
                  <td className="py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
