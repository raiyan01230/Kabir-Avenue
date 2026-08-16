import React, { useEffect, useState } from 'react';
import { Settings, Save, ShieldAlert } from 'lucide-react';

export default function AdminSettings() {
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
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
        setSettingsMap(map);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettingsMap(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const settingsArray = Object.keys(settingsMap).map(k => ({
      settingKey: k,
      settingValue: settingsMap[k]
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading store settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Store Control Center &amp; Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure global store behavior, marquee text, maintenance mode, and shipping fees</p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          Store settings successfully saved and updated across the live customer storefront!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Infinite Scrolling Marquee Text</label>
            <input
              type="text"
              value={settingsMap['marquee_text'] || '🔥 Nationwide Express Delivery inside Dhaka & Outside Dhaka | 100% Genuine Warranty | Call 01700000000'}
              onChange={e => handleChange('marquee_text', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Maintenance Mode</label>
            <select
              value={settingsMap['maintenance_mode'] || 'false'}
              onChange={e => handleChange('maintenance_mode', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
            >
              <option value="false">Store Active (Normal)</option>
              <option value="true">Enable Maintenance Page (Store Offline)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Inside Dhaka Shipping Fee (BDT)</label>
            <input
              type="number"
              value={settingsMap['inside_dhaka_fee'] || '70'}
              onChange={e => handleChange('inside_dhaka_fee', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Outside Dhaka Shipping Fee (BDT)</label>
            <input
              type="number"
              value={settingsMap['outside_dhaka_fee'] || '130'}
              onChange={e => handleChange('outside_dhaka_fee', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition">
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
