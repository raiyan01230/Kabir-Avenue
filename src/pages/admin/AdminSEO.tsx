import React, { useEffect, useState } from 'react';
import { Globe, Search, Save, Share2, Sparkles, Image, CheckCircle2 } from 'lucide-react';

export default function AdminSEO() {
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
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading SEO configuration...</div>;

  const currentTitle = settings['seo_title'] || `${settings['store_name'] || 'HYPERDRIVE'} | Authentic Enthusiast Hardware Bangladesh`;
  const currentDesc = settings['seo_description'] || 'Shop genuine enthusiast electronics, premium PC hardware, and gaming peripherals in Bangladesh. Nationwide express delivery.';
  const currentOgImage = settings['seo_og_image'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const currentUrl = settings['seo_site_url'] || 'https://hyperdrive.bd';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">SEO &amp; Meta Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Configure search engine titles, Open Graph meta tags, social share graphics, and keywords</p>
        </div>
        <button
          onClick={() => handleSave()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save SEO Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>SEO parameters successfully synchronized with Supabase!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Search Engine &amp; Social Graph Fields</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Global Website Title (Meta Title)</label>
            <input
              type="text"
              value={settings['seo_title'] || ''}
              placeholder="e.g. HYPERDRIVE | Authentic Enthusiast Hardware Bangladesh"
              onChange={e => handleChange('seo_title', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Recommended length: 50–60 characters</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Description</label>
            <textarea
              rows={3}
              value={settings['seo_description'] || ''}
              placeholder="Shop genuine enthusiast electronics, premium PC hardware, and gaming peripherals in Bangladesh with nationwide express delivery."
              onChange={e => handleChange('seo_description', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs resize-none focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Recommended length: 150–160 characters</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Default Keywords (Comma Separated)</label>
            <input
              type="text"
              value={settings['seo_keywords'] || ''}
              placeholder="ecommerce, bangladesh, hardware, pc components, graphics cards, mechanical keyboards"
              onChange={e => handleChange('seo_keywords', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Open Graph / Social Share Image URL (`og:image`)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings['seo_og_image'] || ''}
                placeholder="https://images.unsplash.com/... or Supabase Storage image URL"
                onChange={e => handleChange('seo_og_image', e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Image displayed when links are shared on Facebook, WhatsApp, LinkedIn, Discord (Recommended: 1200x630px)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Twitter Handle</label>
              <input
                type="text"
                value={settings['seo_twitter_handle'] || ''}
                placeholder="@hyperdrive_bd"
                onChange={e => handleChange('seo_twitter_handle', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Canonical Base URL</label>
              <input
                type="text"
                value={settings['seo_site_url'] || ''}
                placeholder="https://hyperdrive.bd"
                onChange={e => handleChange('seo_site_url', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Right Col: Live Previews */}
        <div className="space-y-6">
          {/* Google Search Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Search Preview</span>
            </div>
            <div className="bg-white text-slate-900 p-4 rounded-xl space-y-1 font-sans shadow-sm">
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <span>{currentUrl}</span>
                <span>› store</span>
              </div>
              <div className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                {currentTitle}
              </div>
              <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {currentDesc}
              </div>
            </div>
          </div>

          {/* Social Share Card Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Social Share Preview (Open Graph)</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="h-36 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                {currentOgImage ? (
                  <img
                    src={currentOgImage}
                    alt="OG Preview"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-slate-600 text-xs flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    <span>No OG Image Set</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-950 border-t border-slate-800/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                  {currentUrl.replace(/^https?:\/\//, '')}
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">
                  {currentTitle}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {currentDesc}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
