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
  Link2,
  Plus,
  Trash2,
  ArrowRight,
  Eye,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Tag,
  Monitor,
  Smartphone
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
  missingAltCount: number;
  missingDescCount: number;
  duplicateSlugsCount: number;
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

interface SEORedirect {
  id: string;
  source: string;
  destination: string;
  status: 301 | 302;
  hits: number;
  created_at: string;
  is_active: boolean;
  notes?: string;
}

interface SEOPageConfig {
  path: string;
  name: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const DEFAULT_PAGES_LIST: SEOPageConfig[] = [
  { path: '/', name: 'Homepage', title: '{storeName} | Best Online Gadget Store in Bangladesh', description: 'Shop genuine smart gadgets, mobile accessories, audio gear, and lifestyle electronics in Bangladesh with official warranty and fast delivery.' },
  { path: '/shop', name: 'Shop / All Products', title: 'Shop All Authentic Gadgets & Electronics | {storeName}', description: 'Browse our complete collection of genuine gadgets with best prices, official warranty, and express delivery across Bangladesh.' },
  { path: '/track', name: 'Track Order', title: 'Track Your Delivery & Order Status | {storeName}', description: 'Track your real-time order delivery progress with your tracking code or order phone number.' },
  { path: '/wishlist', name: 'My Wishlist', title: 'My Saved Items & Wishlist | {storeName}', description: 'View and manage your saved tech favorites and gadgets.' },
  { path: '/account', name: 'Customer Account', title: 'My Account & Order History | {storeName}', description: 'Manage your profile, shipping addresses, and past orders.' },
  { path: '/about', name: 'About Us', title: 'About {storeName} | Trusted Tech Retailer in BD', description: 'Learn about our mission to bring genuine technology, authentic warranty, and reliable service to Bangladesh.' },
  { path: '/contact', name: 'Contact Us', title: 'Contact Support & Helpdesk | {storeName}', description: 'Get in touch with our customer service team via phone, email, or live chat in Dhaka, Bangladesh.' },
  { path: '/faq', name: 'FAQs', title: 'Frequently Asked Questions | {storeName}', description: 'Find answers to common questions about ordering, nationwide shipping, payments, and product warranties.' },
  { path: '/shipping', name: 'Shipping & Delivery', title: 'Shipping Policy & Delivery Rates | {storeName}', description: 'Fast delivery inside Dhaka for ৳70 and all 64 districts across Bangladesh for ৳130.' },
  { path: '/returns', name: 'Returns & Refunds', title: 'Hassle-Free Return & Warranty Policy | {storeName}', description: 'Learn about our transparent 7-day replacement warranty and return guidelines.' }
];

export default function AdminSEO() {
  type TabType = 'audit' | 'global' | 'templates' | 'pages' | 'images' | 'redirects' | 'sitemaps' | 'robots' | 'webmaster' | 'analytics' | 'social';
  const [activeTab, setActiveTab] = useState<TabType>('audit');
  
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Redirects
  const [redirects, setRedirects] = useState<SEORedirect[]>([]);
  const [newRedirectSource, setNewRedirectSource] = useState('');
  const [newRedirectDest, setNewRedirectDest] = useState('');
  const [newRedirectStatus, setNewRedirectStatus] = useState<301 | 302>(301);
  const [newRedirectNotes, setNewRedirectNotes] = useState('');

  // Static Pages Config
  const [pagesConfig, setPagesConfig] = useState<SEOPageConfig[]>(DEFAULT_PAGES_LIST);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Bulk actions status
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionMsg, setBulkActionMsg] = useState<string | null>(null);

  // SERP Preview Mode
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@shmgadgetzone.com';

  const loadData = async () => {
    try {
      const [settingsRes, statsRes, redirectsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/seo/stats'),
        fetch('/api/admin/seo/redirects')
      ]);

      const settingsData = await settingsRes.json();
      const statsData = await statsRes.json();
      const redirectsData = await redirectsRes.json();

      const map: Record<string, string> = {};
      if (Array.isArray(settingsData)) {
        settingsData.forEach(s => {
          map[s.setting_key] = s.setting_value;
        });
      }
      setSettings(map);

      // Parse Pages config
      if (map['seo_pages_config']) {
        try {
          const parsed = JSON.parse(map['seo_pages_config']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPagesConfig(parsed);
          }
        } catch {
          // fallback
        }
      }

      if (redirectsData.success && Array.isArray(redirectsData.redirects)) {
        setRedirects(redirectsData.redirects);
      }

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
      setInspectingContent(`Failed to fetch XML feed: ${err.message}`);
      setInspectingLoading(false);
    }
  };

  const handlePingSearchEngines = async () => {
    setPinging(true);
    setPingResult(null);
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      // Package all settings
      const settingsPayload = {
        ...settings,
        seo_pages_config: JSON.stringify(pagesConfig),
        seo_redirects: JSON.stringify(redirects)
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: settingsPayload,
          admin_email
        })
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        runAudit();
      }
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

  const handleAddRedirect = () => {
    if (!newRedirectSource.trim() || !newRedirectDest.trim()) return;
    const cleanSrc = newRedirectSource.startsWith('/') ? newRedirectSource.trim() : `/${newRedirectSource.trim()}`;
    const cleanDest = newRedirectDest.startsWith('/') || newRedirectDest.startsWith('http') ? newRedirectDest.trim() : `/${newRedirectDest.trim()}`;

    const newRed: SEORedirect = {
      id: `red_${Date.now()}`,
      source: cleanSrc,
      destination: cleanDest,
      status: newRedirectStatus,
      hits: 0,
      created_at: new Date().toISOString(),
      is_active: true,
      notes: newRedirectNotes.trim() || undefined
    };

    const updated = [newRed, ...redirects];
    setRedirects(updated);
    setNewRedirectSource('');
    setNewRedirectDest('');
    setNewRedirectNotes('');

    // Persist redirects
    fetch('/api/admin/seo/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirects: updated })
    });
  };

  const handleDeleteRedirect = (id: string) => {
    const updated = redirects.filter(r => r.id !== id);
    setRedirects(updated);
    fetch('/api/admin/seo/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirects: updated })
    });
  };

  const handleToggleRedirect = (id: string) => {
    const updated = redirects.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r);
    setRedirects(updated);
    fetch('/api/admin/seo/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirects: updated })
    });
  };

  const handleBulkImageOptimize = async () => {
    setBulkActionLoading(true);
    setBulkActionMsg(null);
    try {
      const res = await fetch('/api/admin/seo/bulk-image-optimize', { method: 'POST' });
      const data = await res.json();
      setBulkActionMsg(data.message || 'Image optimization completed.');
      setBulkActionLoading(false);
      runAudit();
    } catch (err: any) {
      setBulkActionMsg(`Optimization error: ${err.message}`);
      setBulkActionLoading(false);
    }
  };

  const handleBulkTemplateApply = async (overwrite: boolean = false) => {
    setBulkActionLoading(true);
    setBulkActionMsg(null);
    try {
      const res = await fetch('/api/admin/seo/bulk-template-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteAll: overwrite })
      });
      const data = await res.json();
      setBulkActionMsg(data.message || 'SEO templates applied.');
      setBulkActionLoading(false);
      runAudit();
    } catch (err: any) {
      setBulkActionMsg(`Template error: ${err.message}`);
      setBulkActionLoading(false);
    }
  };

  const handleOgImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must not exceed 5MB.');
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
            fileName: `seo-og-banner-${Date.now()}.jpg`,
            mimeType: file.type,
            folder: 'seo'
          })
        });

        const data = await res.json();
        if (res.ok && data.publicUrl) {
          handleChange('seo_og_image', data.publicUrl);
          handleChange('seo_twitter_image', data.publicUrl);
        } else {
          setUploadError(data.error || 'Upload failed');
        }
        setUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  const insertVariableToken = (field: string, token: string) => {
    const current = settings[field] || '';
    handleChange(field, `${current} {${token}}`.trim());
  };

  const storeName = settings['store_name'] || 'SHM Gadget Zone';
  const previewTitle = settings['seo_title'] || `${storeName} | Best Online Gadget Store in Bangladesh`;
  const previewDesc = settings['seo_description'] || 'Shop authentic smart gadgets, mobile accessories, and lifestyle electronics in Bangladesh with nationwide express delivery.';
  const previewOgImg = settings['seo_og_image'] || settings['store_logo'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const previewUrl = settings['seo_site_url'] || (typeof window !== 'undefined' ? window.location.origin : 'https://shmgadgetzone.onrender.com');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Connecting to Supabase SEO Engine &amp; Sitemaps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" id="admin-seo-control-center">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Google SEO &amp; Search Control Center
                </h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold rounded-full">
                  LIVE DATABASE-LINKED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-spectrum technical &amp; on-page SEO: Dynamic XML sitemaps, robots.txt, Schema JSON-LD, GA4 tracking, and AI image alt optimization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={runAudit}
            disabled={auditLoading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 flex items-center gap-1.5"
            title="Re-run real-time site SEO audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{auditLoading ? 'Auditing...' : 'Re-Audit'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing to DB...</span>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>SEO Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save &amp; Publish SEO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Notification Banner if bulk action ran */}
      {bulkActionMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bulkActionMsg}</span>
          </div>
          <button onClick={() => setBulkActionMsg(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: 'audit', label: 'SEO Audit', icon: Activity, badge: auditReport ? `${auditReport.score}/100` : undefined, badgeColor: auditReport && auditReport.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300' },
          { id: 'global', label: 'Global Meta', icon: Globe },
          { id: 'templates', label: 'SEO Templates', icon: Sparkles },
          { id: 'pages', label: 'Static Pages', icon: FileText, badge: `${pagesConfig.length}` },
          { id: 'images', label: 'Image SEO', icon: ImageIcon, badge: auditReport?.missingAltCount ? `${auditReport.missingAltCount} missing` : undefined, badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'redirects', label: '301 Redirects', icon: Link2, badge: `${redirects.length}` },
          { id: 'sitemaps', label: 'XML Sitemaps & Feeds', icon: Radio, badge: `${sitemaps.length}` },
          { id: 'robots', label: 'Robots.txt', icon: Code2 },
          { id: 'webmaster', label: 'Webmaster Verification', icon: ShieldCheck },
          { id: 'analytics', label: 'GA4 & Pixels', icon: Zap },
          { id: 'social', label: 'Social OG & SERP', icon: Share2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300')}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SEO AUDIT & HEALTH OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score Gauge */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-slate-950 border-4 border-emerald-500/30 flex items-center justify-center shadow-inner shrink-0">
                <span className="text-lg font-black text-white font-mono">
                  {auditReport?.score ?? '--'}
                </span>
                <span className="text-[9px] text-emerald-400 absolute bottom-1 font-bold">/100</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">SEO Health Score</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {auditReport && auditReport.score >= 85
                    ? 'Excellent technical & on-page compliance'
                    : 'Good foundation, minor improvements suggested'}
                </p>
              </div>
            </div>

            {/* Indexed URLs */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Indexable URLs</div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {auditReport?.indexedUrlsCount ?? (stats?.totalIndexedUrls || 0)}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Included in 5 XML Sitemaps
              </div>
            </div>

            {/* Catalog Coverage */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Products &amp; Categories</div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {stats?.totalProducts ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalCategories ?? 0} cats</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Real database-backed records
              </div>
            </div>

            {/* Missing Alt Image Count */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Image Alt Tag Gaps</div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-1">
                  {auditReport?.missingAltCount ?? 0}
                </div>
              </div>
              {(auditReport?.missingAltCount ?? 0) > 0 && (
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={handleBulkImageOptimize}
                  className="mt-2 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-1 rounded-lg border border-emerald-500/30 transition text-left"
                >
                  ⚡ 1-Click Fix All Image Alt Tags
                </button>
              )}
            </div>
          </div>

          {/* Core Technical Health Checks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Core Search Engine Technical Compliance Checks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(auditReport?.checks || []).map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    check.passed
                      ? 'bg-emerald-950/20 border-emerald-500/20'
                      : 'bg-amber-950/20 border-amber-500/20'
                  }`}
                >
                  <div className={`p-1 rounded-md mt-0.5 ${check.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {check.passed ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{check.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{check.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-sky-400" />
                <span>Actionable Optimization Opportunities ({(auditReport?.issues || []).length})</span>
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => handleBulkTemplateApply(false)}
                  className="text-xs font-bold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 rounded-xl border border-sky-500/30 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Product Templates</span>
                </button>
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={handleBulkImageOptimize}
                  className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Auto-Fix Alt Tags</span>
                </button>
              </div>
            </div>

            {(auditReport?.issues || []).length === 0 ? (
              <div className="p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">All Primary SEO Standards Met!</p>
                <p className="text-[11px] text-slate-400 mt-1">Your website is fully configured with optimal titles, descriptions, canonicals, and image tags.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(auditReport?.issues || []).map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                      issue.type === 'critical'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : issue.type === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-sky-950/20 border-sky-500/30 text-sky-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border mt-0.5 ${
                        issue.type === 'critical'
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : issue.type === 'warning'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      }`}>
                        {issue.category}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: GLOBAL META & STORE IDENTITY */}
      {/* ============================================================ */}
      {activeTab === 'global' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Homepage &amp; Default Meta Tags</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                These tags are served on the homepage and act as fallback values across the storefront.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200">Global Website SEO Title *</label>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {(settings['seo_title'] || '').length} / 65 characters (Optimal: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={settings['seo_title'] || ''}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="e.g. SHM Gadget Zone | Best Online Gadget Store in Bangladesh"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200">Global Meta Description *</label>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {(settings['seo_description'] || '').length} / 160 characters (Optimal: 120-160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={settings['seo_description'] || ''}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder="e.g. Shop genuine smart gadgets, mobile accessories, audio gear, and lifestyle tech in Bangladesh. Official warranty and fast nationwide delivery."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={settings['seo_keywords'] || ''}
                  onChange={(e) => handleChange('seo_keywords', e.target.value)}
                  placeholder="e.g. gadgets bd, authentic electronics bangladesh, smartwatch price in bd, shm gadget zone"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Canonical Base URL</label>
                  <input
                    type="url"
                    value={settings['seo_site_url'] || ''}
                    onChange={(e) => handleChange('seo_site_url', e.target.value)}
                    placeholder="https://shmgadgetzone.onrender.com"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Used to construct canonical links and full URLs in XML sitemaps.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Default Robots Directive</label>
                  <select
                    value={settings['seo_robots_directive'] || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
                    onChange={(e) => handleChange('seo_robots_directive', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">index, follow, max-image-preview:large (Standard Production)</option>
                    <option value="index, follow">index, follow (Basic Indexing)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Block Indexing / Staging)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Local SEO for Bangladesh */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bangladesh Local SEO &amp; Geotags</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Geo Region</label>
                <input
                  type="text"
                  value={settings['seo_geo_region'] || 'BD-13'}
                  onChange={(e) => handleChange('seo_geo_region', e.target.value)}
                  placeholder="BD-13 (Dhaka)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Geo Placename</label>
                <input
                  type="text"
                  value={settings['seo_geo_placename'] || 'Dhaka, Bangladesh'}
                  onChange={(e) => handleChange('seo_geo_placename', e.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Geo Coordinates (Lat;Long)</label>
                <input
                  type="text"
                  value={settings['seo_geo_position'] || '23.8103;90.4125'}
                  onChange={(e) => handleChange('seo_geo_position', e.target.value)}
                  placeholder="23.8103;90.4125"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Global Meta</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SEO TEMPLATES & DYNAMIC TOKENS */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic SEO Templates</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Templates auto-populate SEO tags across hundreds of products and categories using dynamic variable tokens.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => handleBulkTemplateApply(false)}
                  className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold rounded-xl border border-sky-500/30 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply to Untagged Products</span>
                </button>

                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => handleBulkTemplateApply(true)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition flex items-center gap-1.5"
                  title="Overwrite all products with current template"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Apply &amp; Overwrite All</span>
                </button>
              </div>
            </div>

            {/* Variable Tokens Legend */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Available Dynamic Tokens (Click to copy/insert into template):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { token: 'productName', label: 'Product Name' },
                  { token: 'storeName', label: 'Store Name' },
                  { token: 'categoryName', label: 'Category' },
                  { token: 'price', label: 'Price (৳)' },
                  { token: 'sku', label: 'SKU Code' },
                  { token: 'pageName', label: 'Page Name' },
                  { token: 'attribute', label: 'Image Angle' }
                ].map(item => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => handleCopy(`{${item.token}}`, item.token)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 text-[10px] font-mono font-bold rounded-lg border border-slate-800 hover:border-emerald-500/40 transition flex items-center gap-1"
                  >
                    <span>{`{${item.token}}`}</span>
                    {copiedUrl === item.token ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-50" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Templates */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">1. Product SEO Templates</h4>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-200">Product SEO Title Template</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => insertVariableToken('seo_tpl_product_title', 'productName')} className="text-[10px] text-sky-400 hover:underline">+ {`{productName}`}</button>
                    <button type="button" onClick={() => insertVariableToken('seo_tpl_product_title', 'storeName')} className="text-[10px] text-sky-400 hover:underline">+ {`{storeName}`}</button>
                  </div>
                </div>
                <input
                  type="text"
                  value={settings['seo_tpl_product_title'] || '{productName} | {storeName}'}
                  onChange={(e) => handleChange('seo_tpl_product_title', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-200">Product Meta Description Template</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => insertVariableToken('seo_tpl_product_desc', 'price')} className="text-[10px] text-sky-400 hover:underline">+ {`{price}`}</button>
                    <button type="button" onClick={() => insertVariableToken('seo_tpl_product_desc', 'storeName')} className="text-[10px] text-sky-400 hover:underline">+ {`{storeName}`}</button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={settings['seo_tpl_product_desc'] || 'Buy authentic {productName} from {storeName}. Price ৳{price}. Warranty & fast nationwide delivery in Bangladesh.'}
                  onChange={(e) => handleChange('seo_tpl_product_desc', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Category Templates */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">2. Category SEO Templates</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Category Title Template</label>
                <input
                  type="text"
                  value={settings['seo_tpl_category_title'] || '{categoryName} Collection | {storeName}'}
                  onChange={(e) => handleChange('seo_tpl_category_title', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Category Description Template</label>
                <textarea
                  rows={2}
                  value={settings['seo_tpl_category_desc'] || 'Explore genuine {categoryName} with official warranty and nationwide delivery from {storeName}.'}
                  onChange={(e) => handleChange('seo_tpl_category_desc', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Image Alt Template */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">3. Image SEO Alt Text Template</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Image Alt Text Pattern</label>
                <input
                  type="text"
                  value={settings['seo_image_alt_template'] || '{productName} - {attribute}'}
                  onChange={(e) => handleChange('seo_image_alt_template', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Example output: "Anker Soundcore R50i - Front View" or "Anker Soundcore R50i - Angle 2".</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Templates</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 4: STATIC PAGES SEO MANAGER */}
      {/* ============================================================ */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages Sidebar List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider px-2 py-1 mb-2 flex items-center justify-between">
              <span>Storefront Pages ({pagesConfig.length})</span>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {pagesConfig.map((page, idx) => (
                <button
                  key={page.path}
                  type="button"
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    selectedPageIndex === idx
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-bold">{page.name}</div>
                    <div className="text-[10px] opacity-75 font-mono">{page.path}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Page Editor Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            {pagesConfig[selectedPageIndex] && (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{pagesConfig[selectedPageIndex].name} SEO Settings</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-emerald-400 rounded-md border border-slate-800">
                      {pagesConfig[selectedPageIndex].path}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customize specific search engine metadata and OpenGraph preview for this route.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Page SEO Title</label>
                    <input
                      type="text"
                      value={pagesConfig[selectedPageIndex].title}
                      onChange={(e) => {
                        const updated = [...pagesConfig];
                        updated[selectedPageIndex].title = e.target.value;
                        setPagesConfig(updated);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Page Meta Description</label>
                    <textarea
                      rows={3}
                      value={pagesConfig[selectedPageIndex].description}
                      onChange={(e) => {
                        const updated = [...pagesConfig];
                        updated[selectedPageIndex].description = e.target.value;
                        setPagesConfig(updated);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Custom OpenGraph Image (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://... (Leave blank to use global banner)"
                      value={pagesConfig[selectedPageIndex].ogImage || ''}
                      onChange={(e) => {
                        const updated = [...pagesConfig];
                        updated[selectedPageIndex].ogImage = e.target.value;
                        setPagesConfig(updated);
                      }}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Page Meta</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: IMAGE SEO & STORAGE */}
      {/* ============================================================ */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Automated Product Image SEO</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Google Images drives significant high-intent organic traffic. Ensure every photo has a descriptive alt tag and title.
                </p>
              </div>

              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleBulkImageOptimize}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Auto-Generate Alt Tags For All Images</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-white mb-1">1. Alt Text Pattern</div>
                <p className="text-[11px] text-slate-400">
                  Calculates &#123;Product Name&#125; - Front View for primary images, and &#123;Product Name&#125; - Side Angle for gallery items.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-white mb-1">2. Sanitized Storage Filenames</div>
                <p className="text-[11px] text-slate-400">
                  Replaces random photo names like photo_0987.jpg with clean SEO slugs like anker-soundcore-r50i-photo-1.jpg.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-white mb-1">3. Google Images Sitemap</div>
                <p className="text-[11px] text-slate-400">
                  Automatically declares all photos in image sitemap tags at /sitemap-images.xml for crawler discovery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: 301 & 302 REDIRECT MANAGER */}
      {/* ============================================================ */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          {/* Add Redirect Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add New 301 Permanent / 302 Temporary Redirect</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Preserve link equity (PageRank) when changing product slugs, categories, or legacy website URLs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source Path (Old URL)</label>
                <input
                  type="text"
                  placeholder="/old-product-slug"
                  value={newRedirectSource}
                  onChange={(e) => setNewRedirectSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Path (New URL)</label>
                <input
                  type="text"
                  placeholder="/product/new-product-slug"
                  value={newRedirectDest}
                  onChange={(e) => setNewRedirectDest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">HTTP Status</label>
                <select
                  value={newRedirectStatus}
                  onChange={(e) => setNewRedirectStatus(Number(e.target.value) as 301 | 302)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddRedirect}
                  disabled={!newRedirectSource.trim() || !newRedirectDest.trim()}
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Redirect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Redirects Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Configured URL Redirects ({redirects.length})
              </h3>
              <span className="text-[11px] text-slate-400">Handled server-side before application routing</span>
            </div>

            {redirects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active URL redirects. Add one above to handle renamed products or migrated pages.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Source (Old URL)</th>
                      <th className="pb-3">Destination (Target URL)</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Hits</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {redirects.map((red) => (
                      <tr key={red.id} className="hover:bg-slate-800/30">
                        <td className="py-3 font-mono text-slate-200">{red.source}</td>
                        <td className="py-3 font-mono text-emerald-400 flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{red.destination}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            red.status === 301 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            HTTP {red.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{red.hits || 0}</td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleRedirect(red.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                              red.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {red.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRedirect(red.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Redirect"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 7: XML SITEMAPS & FEEDS */}
      {/* ============================================================ */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-6">
          {/* Top Ping & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Search Engine Sitemaps &amp; Product Feeds</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically rendered in XML format from your live Supabase database with instant caching headers.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePingSearchEngines}
              disabled={pinging}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
              <span>{pinging ? 'Pinging Search Engines...' : 'Notify / Ping Google & Bing'}</span>
            </button>
          </div>

          {/* Ping Results Banner */}
          {pingResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Search Engine Ping Dispatched ({new Date(pingResult.timestamp).toLocaleTimeString()})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Notified Googlebot and Bingbot crawlers to refresh sitemap index: <code className="text-emerald-300">{stats?.baseUrl}/sitemap.xml</code>
              </p>
            </div>
          )}

          {/* Sitemaps List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sitemaps.map((sm) => (
              <div
                key={sm.url}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{sm.name}</span>
                    <span className="px-2 py-0.5 bg-slate-950 text-emerald-400 text-[10px] font-mono font-bold rounded-md border border-slate-800">
                      {sm.format}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono break-all bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    {sm.url}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => handleCopy(sm.url, sm.url)}
                    className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-800 flex items-center justify-center gap-1.5"
                  >
                    {copiedUrl === sm.url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl === sm.url ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInspectXml(sm.url)}
                    className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition border border-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect XML</span>
                  </button>

                  <a
                    href={sm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
                    title="Open Live XML in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* XML Inspector Modal */}
          {inspectingUrl && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">{inspectingUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectingUrl(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-[11px] text-slate-300 whitespace-pre">
                  {inspectingLoading ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : (
                    inspectingContent
                  )}
                </div>

                <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(inspectingContent, 'xml_modal')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Raw XML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectingUrl(null)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 8: ROBOTS.TXT ENGINE */}
      {/* ============================================================ */}
      {activeTab === 'robots' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Robots.txt Configuration</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Controls search crawler access for Googlebot, Bingbot, and AI indexing bots. Always synchronized with disk &amp; database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Live /robots.txt</span>
                </a>
              </div>
            </div>

            <div>
              <textarea
                rows={14}
                value={settings['seo_robots_txt'] || ''}
                onChange={(e) => handleChange('seo_robots_txt', e.target.value)}
                placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\n\nSitemap: https://shmgadgetzone.onrender.com/sitemap.xml`}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Sync Robots.txt</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 9: WEBMASTER VERIFICATION */}
      {/* ============================================================ */}
      {activeTab === 'webmaster' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Search Console &amp; Webmaster Tokens</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste your verification tokens or complete `<meta name="..."/>` tags. The system automatically extracts the code and injects it into SSR output.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Google Search Console Verification Token
                </label>
                <input
                  type="text"
                  value={settings['seo_google_verification'] || ''}
                  onChange={(e) => handleChange('seo_google_verification', e.target.value)}
                  placeholder="e.g. 58x4iKvtWOTVs_O8HgwRU2w4SrtoYwvWCxrs50shOd4"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Also accessible via Google HTML verification file at <code className="text-emerald-400">/google58x4iKvtWOTVs_O8HgwRU2w4SrtoYwvWCxrs50shOd4.html</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Bing Webmaster Tools Verification Token
                </label>
                <input
                  type="text"
                  value={settings['seo_bing_verification'] || ''}
                  onChange={(e) => handleChange('seo_bing_verification', e.target.value)}
                  placeholder="e.g. BING_VERIFICATION_TOKEN_HERE"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Yandex Webmaster Token (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings['seo_yandex_verification'] || ''}
                    onChange={(e) => handleChange('seo_yandex_verification', e.target.value)}
                    placeholder="yandex-verification-token"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Pinterest Domain Verification (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings['seo_pinterest_verification'] || ''}
                    onChange={(e) => handleChange('seo_pinterest_verification', e.target.value)}
                    placeholder="p:domain_verify"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Webmaster Tokens</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 10: ANALYTICS & PIXELS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Google Analytics 4 &amp; Conversion Tracking</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically injects the official Google gtag.js snippet into the document &lt;head&gt; across all storefront pages.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Google Analytics 4 (GA4) Measurement ID *
                </label>
                <input
                  type="text"
                  value={settings['seo_ga4_id'] || 'G-HR4Z5MWEB4'}
                  onChange={(e) => handleChange('seo_ga4_id', e.target.value)}
                  placeholder="G-HR4Z5MWEB4"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono text-emerald-400 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">Configured for active analytics measurement: G-HR4Z5MWEB4.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Google Tag Manager Container ID (Optional)
                </label>
                <input
                  type="text"
                  value={settings['seo_gtm_id'] || ''}
                  onChange={(e) => handleChange('seo_gtm_id', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Meta Pixel ID (Facebook / Instagram Ads)
                </label>
                <input
                  type="text"
                  value={settings['seo_meta_pixel_id'] || ''}
                  onChange={(e) => handleChange('seo_meta_pixel_id', e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Analytics</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 11: SOCIAL OG & LIVE SERP PREVIEW */}
      {/* ============================================================ */}
      {activeTab === 'social' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* OpenGraph & Social Image Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Social OpenGraph &amp; Twitter Card Preview</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Controls the visual card rendered when your website link is shared on WhatsApp, Facebook, LinkedIn, and Twitter/X.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Upload & Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">OpenGraph Title</label>
                  <input
                    type="text"
                    value={settings['seo_og_title'] || settings['seo_title'] || ''}
                    onChange={(e) => handleChange('seo_og_title', e.target.value)}
                    placeholder="e.g. SHM Gadget Zone | Authentic Electronics BD"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">OpenGraph Description</label>
                  <textarea
                    rows={2}
                    value={settings['seo_og_description'] || settings['seo_description'] || ''}
                    onChange={(e) => handleChange('seo_og_description', e.target.value)}
                    placeholder="Short social share summary..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">Social Preview Banner (1200x630px recommended)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings['seo_og_image'] || ''}
                      onChange={(e) => handleChange('seo_og_image', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && handleOgImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
                    >
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload Banner</span>
                    </button>
                  </div>
                  {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
                </div>
              </div>

              {/* Social Card Visual Simulator */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Social Share Preview (WhatsApp / Facebook Card)</span>
                  <span className="text-emerald-400">1200 × 630</span>
                </div>
                <div className="aspect-[1.91/1] w-full bg-slate-900 relative overflow-hidden">
                  <img
                    src={previewOgImg}
                    alt="Social preview banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-slate-900 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    {previewUrl.replace(/^https?:\/\//, '').split('/')[0]}
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                    {settings['seo_og_title'] || previewTitle}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {settings['seo_og_description'] || previewDesc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Google SERP Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Real-time Google SERP Search Snippet Simulator</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Simulates how your homepage appears in organic Google search results.</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSerpDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    serpDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    serpDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Google Result Box */}
            <div className={`p-4 bg-white rounded-xl text-left font-sans text-slate-900 shadow-sm border border-slate-200 ${serpDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}`}>
              <div className="flex items-center gap-1.5 text-[11px] text-[#202124] mb-1">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
                  {storeName.charAt(0)}
                </div>
                <span className="font-medium text-slate-800">{storeName}</span>
                <span className="text-slate-400">›</span>
                <span className="text-slate-500 font-mono text-[10px]">{previewUrl.replace(/^https?:\/\//, '')}</span>
              </div>

              <div className="text-base text-[#1a0dab] hover:underline font-normal cursor-pointer leading-tight mb-1 line-clamp-1">
                {previewTitle}
              </div>

              <div className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {previewDesc}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Social &amp; SERP Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
