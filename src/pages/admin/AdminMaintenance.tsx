import React, { useEffect, useState } from 'react';
import { ShieldAlert, Power, Calendar, Megaphone, Save } from 'lucide-react';

export default function AdminMaintenance() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach(s => {
            map[s.setting_key] = s.setting_value;
          });
        }
        setSettings(map);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const settingsArray = Object.keys(settings).map(k => ({
      settingKey: k,
      settingValue: settings[k]
    }));

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settingsArray, admin_email })
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading maintenance settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Advanced Maintenance &amp; Store Controls</h1>
          <p className="text-xs text-slate-400 mt-1">Control maintenance mode, temporary closures, checkout toggles, and site-wide announcements</p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Controls</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          Maintenance &amp; operational switches updated successfully in Supabase!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Toggles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Power className="w-4 h-4 text-rose-400" />
            <span>Store Operational Switches</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white">Maintenance Mode</label>
              <p className="text-[11px] text-slate-400">Shows maintenance page to customers while admin remains accessible.</p>
              <select
                value={settings['maintenance_mode'] || 'false'}
                onChange={e => handleChange('maintenance_mode', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold"
              >
                <option value="false">OFF (Normal)</option>
                <option value="true">ON (Store Offline)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white">Checkout Enabled</label>
              <p className="text-[11px] text-slate-400">Allows customers to place orders when active.</p>
              <select
                value={settings['checkout_enabled'] || 'true'}
                onChange={e => handleChange('checkout_enabled', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold"
              >
                <option value="true">Checkout ON</option>
                <option value="false">Checkout OFF (Browse Only)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white">Customer Registration</label>
              <p className="text-[11px] text-slate-400">Allow new user account signups.</p>
              <select
                value={settings['registration_enabled'] || 'true'}
                onChange={e => handleChange('registration_enabled', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold"
              >
                <option value="true">Registration ON</option>
                <option value="false">Registration Disabled</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white">Product Reviews</label>
              <p className="text-[11px] text-slate-400">Allow customers to submit star reviews.</p>
              <select
                value={settings['reviews_enabled'] || 'true'}
                onChange={e => handleChange('reviews_enabled', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold"
              >
                <option value="true">Reviews ON</option>
                <option value="false">Reviews Disabled</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white">Cash on Delivery (COD)</label>
              <p className="text-[11px] text-slate-400">Enable COD payment method at checkout.</p>
              <select
                value={settings['cod_enabled'] || 'true'}
                onChange={e => handleChange('cod_enabled', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold"
              >
                <option value="true">COD ON</option>
                <option value="false">COD Disabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Site-Wide Announcement Bar</span>
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Announcement Banner Text</label>
            <input
              type="text"
              value={settings['announcement_text'] || '⚡ Nationwide Express Delivery inside Dhaka & Outside Dhaka | Eid Special Discount Active!'}
              onChange={e => handleChange('announcement_text', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
