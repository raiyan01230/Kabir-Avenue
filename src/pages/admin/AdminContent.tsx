import React, { useEffect, useState } from 'react';
import { Image, Layers, Megaphone, Save } from 'lucide-react';

export default function AdminContent() {
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading content settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Website Content &amp; Homepage Control</h1>
          <p className="text-xs text-slate-400 mt-1">Manage infinite scrolling marquee text, hero section headers, and promotional banners</p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Content</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
          Storefront content successfully synchronized with Supabase!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span>Infinite Scrolling Marquee Text</span>
          </label>
          <input
            type="text"
            value={settings['marquee_text'] || '🔥 Nationwide Express Delivery inside Dhaka & Outside Dhaka | 100% Genuine Warranty | Call 01700000000'}
            onChange={e => handleChange('marquee_text', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
          />
          <p className="text-[10px] text-slate-500 mt-1">Updates the continuous animated marquee bar across the customer homepage.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Hero Section Main Heading</label>
          <input
            type="text"
            value={settings['hero_heading'] || 'Next-Gen Tech & Lifestyle Superstore'}
            onChange={e => handleChange('hero_heading', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
          />
        </div>
      </form>
    </div>
  );
}
