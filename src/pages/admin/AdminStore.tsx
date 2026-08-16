import React, { useEffect, useState } from 'react';
import { Store, Save, Globe, Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function AdminStore() {
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading store configuration...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Store Identity &amp; Footer Center</h1>
          <p className="text-xs text-slate-400 mt-1">Configure brand identity, hotline, warehouse address, and dynamic storefront footer</p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          Store settings successfully synchronized with Supabase and updated across the live customer storefront!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Identity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Store Identity &amp; Branding</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={settings['store_name'] || 'HyperDrive BD'}
                onChange={e => handleChange('store_name', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Tagline</label>
              <input
                type="text"
                value={settings['store_tagline'] || 'Bangladesh’s Premier E-Commerce Superstore'}
                onChange={e => handleChange('store_tagline', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Official Hotline Phone *</label>
              <input
                type="text"
                required
                value={settings['store_hotline'] || '01700000000'}
                onChange={e => handleChange('store_hotline', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Support Email *</label>
              <input
                type="email"
                required
                value={settings['store_email'] || 'support@hyperdrive.bd'}
                onChange={e => handleChange('store_email', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse / Head Office Address (Bangladesh) *</label>
            <input
              type="text"
              required
              value={settings['store_address'] || 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh'}
              onChange={e => handleChange('store_address', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>
        </div>

        {/* Social Links & Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-400" />
            <span>Social Links &amp; Business Hours</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Facebook URL</label>
              <input type="text" value={settings['facebook_url'] || 'https://facebook.com'} onChange={e => handleChange('facebook_url', e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Instagram URL</label>
              <input type="text" value={settings['instagram_url'] || 'https://instagram.com'} onChange={e => handleChange('instagram_url', e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Number</label>
              <input type="text" value={settings['whatsapp_number'] || '+8801700000000'} onChange={e => handleChange('whatsapp_number', e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Business Hours Description</label>
            <input type="text" value={settings['business_hours'] || 'Sat - Thu: 9:00 AM - 10:00 PM'} onChange={e => handleChange('business_hours', e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs" />
          </div>
        </div>
      </form>
    </div>
  );
}
