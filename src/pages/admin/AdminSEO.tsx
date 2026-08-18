import React, { useEffect, useState, useRef } from 'react';
import { Globe, Search, Save, Share2, Sparkles, Image as ImageIcon, CheckCircle2, Upload, Loader2 } from 'lucide-react';

export default function AdminSEO() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@shmgadgetzone.com';

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            mimeType: file.type,
            folder: 'social-preview'
          })
        });

        const data = await res.json();
        if (res.ok && data.publicUrl) {
          handleChange('seo_og_image', data.publicUrl);
        } else {
          setUploadError(data.error || 'Failed to upload image');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.message || 'Upload error');
      setUploading(false);
    }
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

  if (loading) return <div className="text-slate-400 text-xs p-6">Loading Social Preview / Open Graph configuration...</div>;

  const currentTitle = settings['seo_title'] || `${settings['store_name'] || 'SHM Gadget Zone'} | Quality Products at Great Prices`;
  const currentDesc = settings['seo_description'] || 'Shop genuine electronics, smart gadgets, and mobile accessories in Bangladesh with nationwide express delivery.';
  const currentOgImage = settings['seo_og_image'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const currentUrl = settings['seo_site_url'] || window.location.origin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Social Preview &amp; Open Graph</h1>
          <p className="text-xs text-slate-400 mt-1">Configure professional link share previews for WhatsApp, Facebook, Telegram, Discord, X/Twitter, and search engines</p>
        </div>
        <button
          onClick={() => handleSave()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Open Graph Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Social Preview &amp; Open Graph settings successfully updated!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Open Graph &amp; Social Card Settings</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Store Name (`og:site_name`)</label>
            <input
              type="text"
              value={settings['store_name'] || ''}
              placeholder="e.g. SHM Gadget Zone"
              onChange={e => handleChange('store_name', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Social Preview / OG Title (`og:title`)</label>
            <input
              type="text"
              value={settings['seo_title'] || ''}
              placeholder="e.g. SHM Gadget Zone | Quality Products at Great Prices"
              onChange={e => handleChange('seo_title', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Displayed in bold as the main title of the shared link card.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Social Preview / OG Description (`og:description`)</label>
            <textarea
              rows={3}
              value={settings['seo_description'] || ''}
              placeholder="Shop genuine electronics, smart gadgets, and mobile accessories in Bangladesh with nationwide express delivery."
              onChange={e => handleChange('seo_description', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs resize-none focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Displayed below the title when shared on messaging apps or social networks.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Social Preview Image (`og:image` - Recommended: 1200 × 630 px)</label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={settings['seo_og_image'] || ''}
                placeholder="https://... absolute HTTPS image URL"
                onChange={e => handleChange('seo_og_image', e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-400" />}
                <span>Upload Image</span>
              </button>
            </div>
            {uploadError && <p className="text-xs text-rose-400 font-medium mb-1">{uploadError}</p>}
            <p className="text-[11px] text-slate-500">Must be an absolute HTTPS URL for WhatsApp, Facebook, and Discord crawlers to render the preview banner properly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Twitter Card Type</label>
              <select
                value={settings['seo_twitter_card'] || 'summary_large_image'}
                onChange={e => handleChange('seo_twitter_card', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Social Preview Canonical URL</label>
              <input
                type="text"
                value={settings['seo_site_url'] || ''}
                placeholder="https://shmgadgetzone.onrender.com"
                onChange={e => handleChange('seo_site_url', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </form>

        {/* Right Col: Live Social Preview Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Live Share Card Preview</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                WhatsApp / FB / Discord
              </span>
            </div>

            <p className="text-xs text-slate-400">
              How your link will appear when shared across social channels and chat apps:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                {currentOgImage ? (
                  <img
                    src={currentOgImage}
                    alt="Social Preview"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-slate-600 text-xs flex flex-col items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    <span>Upload or set an OG Image</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                  {currentUrl.replace(/^https?:\/\//, '')}
                </div>
                <div className="text-sm font-bold text-white line-clamp-1">
                  {currentTitle}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {currentDesc}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300">💡 Crawler Verification Tip:</div>
              <p>
                When shared, crawlers fetch this exact metadata from the initial HTML response. Dynamic product and category URLs automatically generate their own tailored share cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
