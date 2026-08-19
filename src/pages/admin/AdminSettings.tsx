import React, { useEffect, useState } from 'react';
import { Settings, Save, ShieldAlert, Globe, Phone, Mail, MapPin, DollarSign, Image, Sparkles } from 'lucide-react';
import { notifyStoreDataChanged } from '../../lib/queries';

export default function AdminSettings() {
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettingsMap(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Prepare array of settings, maintaining aliases for compatibility
    const currentName = settingsMap['store_name'] || settingsMap['storeName'] || 'HYPERDRIVE E-COMMERCE';
    const currentPhone = settingsMap['hotline_phone'] || settingsMap['contact_phone'] || '+880 1700-000000';
    const currentEmail = settingsMap['support_email'] || settingsMap['contact_email'] || 'support@hyperdrive.bd';
    const currentAddress = settingsMap['head_office_address'] || settingsMap['contact_address'] || 'Gulshan-2, Dhaka-1212, Bangladesh';

    const mergedMap = {
      ...settingsMap,
      store_name: currentName,
      storeName: currentName,
      hotline_phone: currentPhone,
      contact_phone: currentPhone,
      support_phone: currentPhone,
      support_email: currentEmail,
      contact_email: currentEmail,
      head_office_address: currentAddress,
      contact_address: currentAddress,
      address: currentAddress
    };

    const settingsArray = Object.keys(mergedMap).map(k => ({
      settingKey: k,
      settingValue: mergedMap[k]
    }));

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray, admin_email })
      });

      if (res.ok) {
        setSaved(true);
        notifyStoreDataChanged();
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading store settings from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Store Settings &amp; Branding</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure live website identity, store name on printed invoices, contact details, delivery charges, and banners.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            <strong>Store Settings Saved!</strong> The live website name, branding, and contact details have been updated and will immediately appear on customer storefronts and all printed invoices/labels.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity & Website Branding */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Website Identity &amp; Print Header
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Live Website / Store Name *
              </label>
              <input
                type="text"
                required
                value={settingsMap['store_name'] || settingsMap['storeName'] || ''}
                onChange={e => handleChange('store_name', e.target.value)}
                placeholder="e.g. HYPERDRIVE E-COMMERCE or MyShop BD"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This exact name will be displayed in the live website header, footer, and printed on all customer invoices, delivery slips, and shipping labels.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Tagline / Slogan
              </label>
              <input
                type="text"
                value={settingsMap['store_tagline'] || ''}
                onChange={e => handleChange('store_tagline', e.target.value)}
                placeholder="e.g. Premium Tech & Lifestyle Gear Across Bangladesh"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Short subtitle shown on customer storefront &amp; official documents.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Website Domain / URL
              </label>
              <input
                type="text"
                value={settingsMap['website_url'] || ''}
                onChange={e => handleChange('website_url', e.target.value)}
                placeholder="e.g. www.hyperdrive.bd"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Logo Image URL (Optional)
              </label>
              <input
                type="text"
                value={settingsMap['logo_url'] || ''}
                onChange={e => handleChange('logo_url', e.target.value)}
                placeholder="https://... or Supabase Storage image URL"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information & Official Address */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Phone className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Official Store Contact &amp; Invoice Address
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hotline / Support Phone Number *
              </label>
              <input
                type="text"
                value={settingsMap['hotline_phone'] || settingsMap['contact_phone'] || ''}
                onChange={e => handleChange('hotline_phone', e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Support Email *
              </label>
              <input
                type="email"
                value={settingsMap['support_email'] || settingsMap['contact_email'] || ''}
                onChange={e => handleChange('support_email', e.target.value)}
                placeholder="support@hyperdrive.bd"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Support Hours
              </label>
              <input
                type="text"
                value={settingsMap['business_hours'] || '9:00 AM - 10:00 PM (Daily)'}
                onChange={e => handleChange('business_hours', e.target.value)}
                placeholder="9:00 AM - 10:00 PM"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Head Office / Dispatch Warehouse Address *
              </label>
              <textarea
                rows={2}
                value={settingsMap['head_office_address'] || settingsMap['contact_address'] || ''}
                onChange={e => handleChange('head_office_address', e.target.value)}
                placeholder="Level 4, House 12, Road 45, Gulshan-2, Dhaka-1212, Bangladesh"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Storefront & Shipping Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Shipping Rates &amp; Storefront Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Inside Dhaka Shipping Fee (BDT ৳)
              </label>
              <input
                type="number"
                value={settingsMap['inside_dhaka_fee'] || '70'}
                onChange={e => handleChange('inside_dhaka_fee', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default rate for Dhaka metro delivery addresses.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Outside Dhaka Shipping Fee (BDT ৳)
              </label>
              <input
                type="number"
                value={settingsMap['outside_dhaka_fee'] || '130'}
                onChange={e => handleChange('outside_dhaka_fee', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default rate for nationwide courier delivery.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Infinite Scrolling Marquee Text
              </label>
              <input
                type="text"
                value={settingsMap['marquee_text'] || '🔥 Nationwide Express Delivery inside Dhaka (৳70) & Outside Dhaka (৳130) • 100% Genuine Products • Cash on Delivery • Easy Returns'}
                onChange={e => handleChange('marquee_text', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Maintenance Mode
              </label>
              <select
                value={settingsMap['maintenance_mode'] || 'false'}
                onChange={e => handleChange('maintenance_mode', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="false">Store Active (Online &amp; Accepting Orders)</option>
                <option value="true">Enable Maintenance Mode (Show Offline Notice)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save & Publish Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
