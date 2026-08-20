import React, { useEffect, useState } from 'react';
import { Save, Image as ImageIcon, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import ProductImageUploader from '../../components/admin/ProductImageUploader';

export default function AdminAboutUs() {
  const [content, setContent] = useState<any>({
    pageTitle: 'About Us',
    subtitle: '',
    mainDescription: '',
    ourStory: '',
    mission: '',
    vision: '',
    whyChooseUs: [],
    customerCommitment: '',
    callToAction: '',
    buttonText: 'Explore Shop Now',
    buttonLink: '/shop',
    imageUrl: '',
    enabledSections: {
      story: true,
      missionVision: true,
      whyChooseUs: true,
      commitment: true,
      cta: true
    }
  });
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/about-us')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setContent(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/about-us', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addWhyChooseItem = () => {
    if (!newItem.trim()) return;
    setContent((prev: any) => ({
      ...prev,
      whyChooseUs: [...(prev.whyChooseUs || []), newItem.trim()]
    }));
    setNewItem('');
  };

  const removeWhyChooseItem = (index: number) => {
    setContent((prev: any) => ({
      ...prev,
      whyChooseUs: prev.whyChooseUs.filter((_: any, i: number) => i !== index)
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading About Us editor...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">About Us Page Editor</h1>
          <p className="text-xs text-slate-400 mt-1">Control public About Us content and visual highlights in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#/about-us"
            target="_blank"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Preview Public Page
          </a>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>About Us content successfully updated and published to website!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Meta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Page Header &amp; Intro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Page Title</label>
              <input
                type="text"
                value={content.pageTitle || ''}
                onChange={(e) => setContent({ ...content, pageTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
              <input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Main Description / Welcome Text</label>
            <textarea
              rows={3}
              value={content.mainDescription || ''}
              onChange={(e) => setContent({ ...content, mainDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
            />
          </div>
        </div>

        {/* Hero Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Hero / Story Image</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {content.imageUrl && (
              <img src={content.imageUrl} alt="Preview" className="w-32 h-24 object-cover rounded-xl border border-slate-800" referrerPolicy="no-referrer" />
            )}
            <div className="flex-1 space-y-2 w-full">
              <label className="block text-xs font-bold text-slate-300">Image URL (Supabase Storage)</label>
              <input
                type="text"
                value={content.imageUrl || ''}
                onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
                placeholder="https://... image URL"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Story, Mission, Vision */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Story, Mission &amp; Vision</h3>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Our Story</label>
            <textarea
              rows={3}
              value={content.ourStory || ''}
              onChange={(e) => setContent({ ...content, ourStory: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mission</label>
              <textarea
                rows={3}
                value={content.mission || ''}
                onChange={(e) => setContent({ ...content, mission: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Vision</label>
              <textarea
                rows={3}
                value={content.vision || ''}
                onChange={(e) => setContent({ ...content, vision: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Why Choose Us Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Why Choose Us Points</h3>
          <div className="space-y-2">
            {(content.whyChooseUs || []).map((item: string, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200">
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeWhyChooseItem(index)}
                  className="text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new benefit point..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <button
              type="button"
              onClick={addWhyChooseItem}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Commitment & CTA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Customer Commitment &amp; Call To Action</h3>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Customer Commitment Statement</label>
            <textarea
              rows={2}
              value={content.customerCommitment || ''}
              onChange={(e) => setContent({ ...content, customerCommitment: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">CTA Heading</label>
              <input
                type="text"
                value={content.callToAction || ''}
                onChange={(e) => setContent({ ...content, callToAction: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Button Text</label>
              <input
                type="text"
                value={content.buttonText || ''}
                onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Button Link</label>
              <input
                type="text"
                value={content.buttonLink || ''}
                onChange={(e) => setContent({ ...content, buttonLink: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
