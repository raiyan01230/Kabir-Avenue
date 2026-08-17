import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@hyperdrive.bd');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.admin) {
          localStorage.setItem('admin_session', JSON.stringify(data.admin));
          navigate('/admin/dashboard');
          return;
        }
      }
      
      // Fallback for static hosts or when API is unreachable but credentials match default
      if (email === 'admin@hyperdrive.bd' && password === 'admin123') {
        const fallbackAdmin = { email, fullName: 'Super Administrator', role: 'super_admin' };
        localStorage.setItem('admin_session', JSON.stringify(fallbackAdmin));
        navigate('/admin/dashboard');
        return;
      }

      throw new Error('Invalid admin credentials');
    } catch (err: any) {
      // If network error / static host, allow default demo login
      if (email === 'admin@hyperdrive.bd' && password === 'admin123') {
        const fallbackAdmin = { email, fullName: 'Super Administrator', role: 'super_admin' };
        localStorage.setItem('admin_session', JSON.stringify(fallbackAdmin));
        navigate('/admin/dashboard');
        return;
      }
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const fallbackAdmin = { email: 'admin@hyperdrive.bd', fullName: 'Super Administrator', role: 'super_admin' };
    localStorage.setItem('admin_session', JSON.stringify(fallbackAdmin));
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-xs text-slate-400 mt-1">Secure authentication required for store management</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                placeholder="admin@store.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Access Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-600"
            >
              <span>⚡ One-Click Demo Admin Login</span>
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center text-[11px] text-slate-500">
          Default Demo Login: <code className="text-slate-300">admin@hyperdrive.bd</code> / <code className="text-slate-300">admin123</code>
        </div>
      </div>
    </div>
  );
}
