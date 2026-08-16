import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, User, Key, Lock } from 'lucide-react';

export default function AdminSecurity() {
  const [admin, setAdmin] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        setAdmin(JSON.parse(session));
      } catch {}
    }

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
        <h1 className="text-2xl font-extrabold text-white">Security &amp; Role Authorization</h1>
        <p className="text-xs text-slate-400 mt-1">Manage admin permissions, role-based access control, and security audit trails</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Admin Account Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Admin Session</span>
          </h2>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Name</span>
              <span className="text-xs font-bold text-white">{admin?.fullName || 'Super Administrator'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Email</span>
              <span className="text-xs font-mono text-slate-200">{admin?.email || 'admin@hyperdrive.bd'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Role &amp; Permissions</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {admin?.role || 'Super Admin'} (Full Access)
              </span>
            </div>
          </div>
        </div>

        {/* Roles Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Role-Based Access Hierarchy</span>
          </h2>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white">Super Admin</span>
                <p className="text-[10px] text-slate-400">Unrestricted access to all admin modules &amp; settings</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">Enabled</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white">Order Manager</span>
                <p className="text-[10px] text-slate-400">Access to orders, deliveries, and printing</p>
              </div>
              <span className="text-[10px] text-slate-400">Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
