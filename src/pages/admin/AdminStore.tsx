import React, { useEffect, useState } from 'react';
import { Store, Save, Globe, Phone, Mail, MapPin, Clock, Upload, Image as ImageIcon, Check } from 'lucide-react';

export default function AdminStore() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

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

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            mimeType: file.type,
            folder: 'branding'
          })
        });
        const data = await res.json();
        if (res.ok && data.publicUrl) {
          handleChange('store_favicon', data.publicUrl);
          // Dynamically update document head favicon
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          (link as HTMLLinkElement).type = 'image/x-icon';
          (link as HTMLLinkElement).rel = 'shortcut icon';
          (link as HTMLLinkElement).href = data.publicUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
        } else {
          alert(data.error || 'Failed to upload favicon');
        }
        setUploadingFavicon(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingFavicon(false);
      alert('Error uploading favicon');
    }
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
          <p className="text-xs text-slate-400 mt-1">Configure brand identity, dedicated favicon, hotline, warehouse address, and dynamic storefront footer</p>
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
        {/* Store Identity & Favicon */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Store Identity &amp; Branding (Favicon &amp; Logos)</span>
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

          {/* Dedicated Favicon Upload Option */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-200 mb-2">Dedicated Store Favicon (Browser Icon)</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {settings['store_favicon'] ? (
                  <img src={settings['store_favicon']} alt="Favicon" className="w-8 h-8 object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-slate-300 font-medium">Upload custom .ico, .png, or .jpg favicon image</p>
                <input
                  type="text"
                  placeholder="https://... or upload below"
                  value={settings['store_favicon'] || ''}
                  onChange={e => handleChange('store_favicon', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs mb-2"
                />
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingFavicon ? 'Uploading to Supabase...' : 'Upload Favicon File'}</span>
                  <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" disabled={uploadingFavicon} />
                </label>
              </div>
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
