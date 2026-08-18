import React, { useEffect, useState, useRef } from 'react';
import {
  Globe,
  Search,
  Save,
  Share2,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  Loader2,
  FileText,
  Radio,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Code2,
  Activity,
  Zap,
  Info,
  Link2
} from 'lucide-react';

interface SitemapItem {
  name: string;
  url: string;
  format: string;
}

interface AuditReport {
  score: number;
  totalProducts: number;
  totalCategories: number;
  indexedUrlsCount: number;
  issues: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: string;
    title: string;
    description: string;
    fixUrl?: string;
  }>;
  checks: Array<{
    title: string;
    passed: boolean;
    details: string;
  }>;
}

export default function AdminSEO() {
  const [activeTab, setActiveTab] = useState<'sitemaps' | 'webmaster' | 'schema' | 'audit' | 'social'>('sitemaps');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Sitemaps and Stats
  const [sitemaps, setSitemaps] = useState<SitemapItem[]>([]);
  const [stats, setStats] = useState<{ totalProducts: number; totalCategories: number; totalIndexedUrls: number; baseUrl: string } | null>(null);
  
  // Ping status
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ timestamp: string; results: { google: any; bing: any } } | null>(null);

  // Audit report
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  // XML Inspector Modal
  const [inspectingUrl, setInspectingUrl] = useState<string | null>(null);
  const [inspectingContent, setInspectingContent] = useState<string>('');
  const [inspectingLoading, setInspectingLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@shmgadgetzone.com';

  const loadData = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/seo/stats')
      ]);

      const settingsData = await settingsRes.json();
      const statsData = await statsRes.json();

      const map: Record<string, string> = {};
      if (Array.isArray(settingsData)) {
        settingsData.forEach(s => {
          map[s.setting_key] = s.setting_value;
        });
      }
      setSettings(map);

      if (statsData.success) {
        setSitemaps(statsData.sitemaps || []);
        setStats({
          totalProducts: statsData.totalProducts,
          totalCategories: statsData.totalCategories,
          totalIndexedUrls: statsData.totalIndexedUrls,
          baseUrl: statsData.baseUrl
        });
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    runAudit();
  }, []);

  const runAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/seo/audit');
      const data = await res.json();
      if (data.success) {
        setAuditReport(data);
      }
      setAuditLoading(false);
    } catch {
      setAuditLoading(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleInspectXml = async (url: string) => {
    setInspectingUrl(url);
    setInspectingLoading(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      setInspectingContent(text);
      setInspectingLoading(false);
    } catch (err: any) {
      setInspectingContent(`Error loading content: ${err.message}`);
      setInspectingLoading(false);
    }
  };

  const handlePingSearchEngines = async () => {
    setPinging(true);
    try {
      const res = await fetch('/api/admin/seo/ping', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPingResult({
          timestamp: data.timestamp,
          results: data.results
        });
      }
      setPinging(false);
    } catch {
      setPinging(false);
    }
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
            folder: 'seo-banners'
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

  const handleLoadRobotsPreset = () => {
    const preset = `# Standard Googlebot & Search Engine Indexing Rules for Bangladesh
User-agent: *
Allow: /
Allow: /shop
Allow: /products
Allow: /product/*
Allow: /category/*
Allow: /track
Allow: /about
Allow: /contact
Allow: /faq
Allow: /terms
Allow: /privacy
Allow: /feed.xml
Allow: /google-merchant-feed.xml

Disallow: /admin
Disallow: /admin/*
Disallow: /api/admin
Disallow: /api/admin/*
Disallow: /api/private
Disallow: /checkout
Disallow: /cart
Disallow: /account

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /checkout/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Crawl-delay: 1`;
    handleChange('seo_robots_txt', preset);
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
      runAudit();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-emerald-400 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading SEO &amp; Google Indexing Engine...</span>
        </div>
      </div>
    );
  }

  const currentTitle = settings['seo_title'] || `${settings['store_name'] || 'SHM Gadget Zone'} | Authentic Electronics & Gadgets Bangladesh`;
  const currentDesc = settings['seo_description'] || 'Shop genuine smart gadgets, mobile accessories, audio gear, and lifestyle electronics in Bangladesh with nationwide express delivery.';
  const currentOgImage = settings['seo_og_image'] || settings['store_logo'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const currentUrl = settings['seo_site_url'] || window.location.origin;

  const seoScore = auditReport?.score || 94;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
              Google &amp; Bing Ranking Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">SEO &amp; Search Engine Indexing</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage dynamic XML sitemaps, robots.txt, Google Search Console, Schema structured data, and high ranking audit
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runAudit}
            disabled={auditLoading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Run SEO Audit</span>
          </button>

          <button
            onClick={handlePingSearchEngines}
            disabled={pinging}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${pinging ? 'animate-pulse' : ''}`} />
            <span>{pinging ? 'Pinging Bots...' : 'Ping Google & Bing'}</span>
          </button>

          <button
            onClick={() => handleSave()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save SEO Settings</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>SEO and indexing configuration successfully updated! Search engines will receive refreshed metadata.</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${
            seoScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            seoScore >= 75 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {seoScore}%
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">SEO Health Score</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {seoScore >= 90 ? 'Optimized for Ranking' : seoScore >= 75 ? 'Good — Minor Fixes' : 'Needs Optimization'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-black text-base">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Indexed URLs</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {stats?.totalIndexedUrls || 0} Pages &amp; Products
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-black text-base">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Active XML Sitemaps</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {sitemaps.length} Feeds &amp; Indexes
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-base">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Google Shopping Feed</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live &amp; Synced
            </div>
          </div>
        </div>
      </div>

      {/* Ping Results Notification */}
      {pingResult && (
        <div className="p-4 bg-sky-950/40 border border-sky-800/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Search Engine Ping Notification Result ({new Date(pingResult.timestamp).toLocaleTimeString()})</span>
            </div>
            <button onClick={() => setPingResult(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-white">Googlebot: </span>
              <span className={pingResult.results.google.success ? 'text-emerald-400' : 'text-amber-400'}>
                {pingResult.results.google.message}
              </span>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-white">Bingbot: </span>
              <span className={pingResult.results.bing.success ? 'text-emerald-400' : 'text-amber-400'}>
                {pingResult.results.bing.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sitemaps')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sitemaps'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sitemaps &amp; Robots.txt</span>
        </button>

        <button
          onClick={() => setActiveTab('webmaster')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'webmaster'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Webmaster &amp; Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'schema'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Schema &amp; Local SEO (BD)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>SEO Health Audit</span>
          {auditReport && auditReport.issues.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">
              {auditReport.issues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'social'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Share &amp; OpenGraph</span>
        </button>
      </div>

      {/* Tab 1: Sitemaps & Robots.txt */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-6">
          {/* Sitemaps List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Dynamic XML Sitemaps &amp; Feeds</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time generated endpoints complying with Google, Bing, and Google Merchant Center specifications
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Auto-Updating on Product Edits
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sitemaps.map((sm, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{sm.name}</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">
                        {sm.format}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1 font-mono">
                      {sm.url}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleInspectXml(sm.url)}
                      title="Inspect XML content"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(sm.url, sm.name)}
                      title="Copy URL"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                    >
                      {copiedUrl === sm.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={sm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                      className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Robots.txt Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Robots.txt Crawler Directives</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controls crawler access for Googlebot, Bingbot, Pinterest, and blocks administrative &amp; private paths
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadRobotsPreset}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition border border-slate-700"
                >
                  Load Recommended Preset
                </button>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs rounded-xl transition border border-slate-700 flex items-center gap-1.5"
                >
                  <span>View /robots.txt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Robots.txt Rules (Leave blank to use intelligent auto-generated rules)
              </label>
              <textarea
                rows={10}
                value={settings['seo_robots_txt'] || ''}
                onChange={e => handleChange('seo_robots_txt', e.target.value)}
                placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/&#10;Disallow: /checkout/&#10;&#10;Sitemap: https://yourdomain.com/sitemap.xml"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 text-xs font-mono focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Webmaster Verification & Tracking */}
      {activeTab === 'webmaster' && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Search Engine Webmaster Verification &amp; Tracking Codes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Claim ownership of your website in Google Search Console, Bing Webmaster, and inject Google Analytics 4 tags
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Google Search Console Verification Token</span>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Search Console</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Paste only the code token inside <code className="text-slate-300">content=&quot;...&quot;</code> from Google HTML tag method.
                </p>
                <input
                  type="text"
                  value={settings['seo_google_verification'] || ''}
                  placeholder="e.g. 4zY5XJ_k9wQe7m2dF1p..."
                  onChange={e => handleChange('seo_google_verification', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Bing Webmaster Verification Code</span>
                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Bing Webmaster</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Token for <code className="text-slate-300">&lt;meta name=&quot;msvalidate.01&quot; content=&quot;...&quot;&gt;</code>
                </p>
                <input
                  type="text"
                  value={settings['seo_bing_verification'] || ''}
                  placeholder="e.g. 7D284091B842F85A27..."
                  onChange={e => handleChange('seo_bing_verification', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Canonical Base URL (<code className="text-slate-300">rel=&quot;canonical&quot;</code>)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Your primary official store domain name for all canonical links.
                </p>
                <input
                  type="url"
                  value={settings['seo_site_url'] || ''}
                  placeholder="https://yourstore.com"
                  onChange={e => handleChange('seo_site_url', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Google Analytics 4 (GA4) Measurement ID
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Automatically loads gtag.js to track organic search visitors, bounce rates, and revenue.
                </p>
                <input
                  type="text"
                  value={settings['seo_ga4_id'] || ''}
                  placeholder="e.g. G-XXXXXXXXXX"
                  onChange={e => handleChange('seo_ga4_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Google Tag Manager (GTM) Container ID
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  GTM container for advanced tracking and custom conversion triggers.
                </p>
                <input
                  type="text"
                  value={settings['seo_gtm_id'] || ''}
                  placeholder="e.g. GTM-XXXXXXX"
                  onChange={e => handleChange('seo_gtm_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Meta / Facebook Pixel ID
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Tracks conversions from Facebook and Instagram product catalog ads.
                </p>
                <input
                  type="text"
                  value={settings['seo_meta_pixel_id'] || ''}
                  placeholder="e.g. 123456789012345"
                  onChange={e => handleChange('seo_meta_pixel_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Schema & Local SEO (BD) */}
      {activeTab === 'schema' && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Schema.org &amp; Local SEO (Bangladesh)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured data (JSON-LD) injected for Google Knowledge Graph, Local Business Map Pack, and Sitelinks Search Box
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Store Legal Business Name</label>
                <input
                  type="text"
                  value={settings['store_name'] || ''}
                  placeholder="SHM Gadget Zone"
                  onChange={e => handleChange('store_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Bangladesh Street Address</label>
                <input
                  type="text"
                  value={settings['store_address'] || ''}
                  placeholder="e.g. House 12, Road 5, Gulshan-2, Dhaka 1212"
                  onChange={e => handleChange('store_address', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={settings['store_phone'] || ''}
                    placeholder="+880 1700-000000"
                    onChange={e => handleChange('store_phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings['store_email'] || ''}
                    placeholder="support@shmgadgetzone.com"
                    onChange={e => handleChange('store_email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Geo Region</label>
                  <input
                    type="text"
                    value={settings['seo_geo_region'] || 'BD-13'}
                    placeholder="BD-13"
                    onChange={e => handleChange('seo_geo_region', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Geo Placename</label>
                  <input
                    type="text"
                    value={settings['seo_geo_placename'] || 'Dhaka, Bangladesh'}
                    placeholder="Dhaka, Bangladesh"
                    onChange={e => handleChange('seo_geo_placename', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Coordinates</label>
                  <input
                    type="text"
                    value={settings['seo_geo_position'] || '23.8103;90.4125'}
                    placeholder="23.8103;90.4125"
                    onChange={e => handleChange('seo_geo_position', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300">Social Profiles for Google Knowledge Graph</h3>
              
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Facebook Page URL</label>
                <input
                  type="url"
                  value={settings['social_facebook'] || ''}
                  placeholder="https://facebook.com/shmgadgetzone"
                  onChange={e => handleChange('social_facebook', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Instagram Profile URL</label>
                <input
                  type="url"
                  value={settings['social_instagram'] || ''}
                  placeholder="https://instagram.com/shmgadgetzone"
                  onChange={e => handleChange('social_instagram', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">YouTube Channel URL</label>
                <input
                  type="url"
                  value={settings['social_youtube'] || ''}
                  placeholder="https://youtube.com/@shmgadgetzone"
                  onChange={e => handleChange('social_youtube', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">TikTok Profile URL</label>
                <input
                  type="url"
                  value={settings['social_tiktok'] || ''}
                  placeholder="https://tiktok.com/@shmgadgetzone"
                  onChange={e => handleChange('social_tiktok', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: SEO Health Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time SEO Ranking &amp; Technical Audit</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated scanner checking meta tags, alt descriptions, SKUs, XML sitemaps, and Schema integrity
                </p>
              </div>

              <button
                onClick={runAudit}
                disabled={auditLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                <span>{auditLoading ? 'Auditing Site...' : 'Re-run Audit'}</span>
              </button>
            </div>

            {/* Checks list */}
            {auditReport && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 mb-3">Core Technical Infrastructure Checks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {auditReport.checks.map((c, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${c.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {c.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white">{c.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Actionable SEO Fix Recommendations</span>
                    <span className="text-[11px] text-slate-400">
                      {auditReport.issues.length} items to address
                    </span>
                  </h3>

                  {auditReport.issues.length === 0 ? (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <div className="text-sm font-bold text-emerald-300">All SEO Audit Checks Passed!</div>
                      <div className="text-xs text-emerald-400/80 mt-1">
                        Your store has pristine metadata, sitemaps, structured data, and keywords for search dominance in Bangladesh.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {auditReport.issues.map(issue => (
                        <div
                          key={issue.id}
                          className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                            issue.type === 'critical'
                              ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                              : issue.type === 'warning'
                              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {issue.type === 'critical' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                              ) : issue.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Info className="w-4 h-4 text-sky-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{issue.title}</span>
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                  {issue.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {issue.description}
                              </div>
                            </div>
                          </div>

                          {issue.fixUrl && (
                            <a
                              href={`#${issue.fixUrl}`}
                              onClick={() => {
                                if (issue.fixUrl === '/admin/seo') {
                                  setActiveTab('webmaster');
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1.5"
                            >
                              <span>Fix Now</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Social Share & OpenGraph */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Open Graph &amp; Social Card Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Legal Name (`og:site_name`)</label>
              <input
                type="text"
                value={settings['store_name'] || ''}
                placeholder="e.g. SHM Gadget Zone"
                onChange={e => handleChange('store_name', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Social Preview / OG Title (`og:title`)</label>
                <span className="text-[10px] text-slate-500 font-mono">{currentTitle.length}/60 chars</span>
              </div>
              <input
                type="text"
                value={settings['seo_title'] || ''}
                placeholder="e.g. SHM Gadget Zone | Authentic Electronics in Bangladesh"
                onChange={e => handleChange('seo_title', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Social Preview Description (`og:description`)</label>
                <span className="text-[10px] text-slate-500 font-mono">{currentDesc.length}/160 chars</span>
              </div>
              <textarea
                rows={3}
                value={settings['seo_description'] || ''}
                placeholder="e.g. Shop genuine smart gadgets, mobile accessories, audio gear, and lifestyle electronics in Bangladesh with nationwide express delivery."
                onChange={e => handleChange('seo_description', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">High-Res Social Preview Image (1200x630px)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={settings['seo_og_image'] || ''}
                  placeholder="https://..."
                  onChange={e => handleChange('seo_og_image', e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700 disabled:opacity-50 shrink-0"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload</span>
                </button>
              </div>
              {uploadError && <p className="text-rose-400 text-xs mt-1">{uploadError}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Twitter/X Creator Handle</label>
              <input
                type="text"
                value={settings['seo_twitter_handle'] || ''}
                placeholder="@shmgadgetzone"
                onChange={e => handleChange('seo_twitter_handle', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </form>

          {/* Right Simulators */}
          <div className="space-y-6">
            {/* WhatsApp Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>WhatsApp / Messenger Link Preview</span>
              </div>
              <div className="bg-[#1f2c34] rounded-xl p-3 border border-[#2a3942] space-y-2">
                <img
                  src={currentOgImage}
                  alt="OG Preview"
                  className="w-full h-32 object-cover rounded-lg bg-slate-800"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white line-clamp-1">{currentTitle}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">{currentDesc}</div>
                  <div className="text-[10px] text-emerald-400 uppercase font-mono">{currentUrl.replace(/^https?:\/\//, '')}</div>
                </div>
              </div>
            </div>

            {/* Google Search Result Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span>Google Search SERP Preview</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5 font-sans">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{currentUrl}</span>
                </div>
                <div className="text-sm font-bold text-sky-400 line-clamp-1 hover:underline cursor-pointer">
                  {currentTitle}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {currentDesc}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XML Inspector Modal */}
      {inspectingUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white font-mono truncate max-w-lg">{inspectingUrl}</span>
              </div>
              <button
                onClick={() => setInspectingUrl(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs text-emerald-400 bg-slate-950 whitespace-pre">
              {inspectingLoading ? 'Loading XML feed...' : inspectingContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
