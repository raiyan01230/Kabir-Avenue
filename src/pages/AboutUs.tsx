import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Truck, Users, CheckCircle2, ArrowRight, Sparkles, HeartHandshake } from 'lucide-react';
import { getStoreSettings, subscribeToStoreUpdates } from '@/lib/queries';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  const [content, setContent] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadAboutData = async () => {
    try {
      const [aboutRes, stRes] = await Promise.all([
        fetch('/api/about-us').then(r => r.json()),
        getStoreSettings()
      ]);
      setContent(aboutRes);
      setSettings(stRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutData();
    const unsub = subscribeToStoreUpdates(loadAboutData);
    return () => unsub();
  }, []);

  const storeName = settings['store_name'] || content?.pageTitle || 'SHM Gadget Zone';

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500">
        Loading About Us...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            About {storeName}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {content.pageTitle || `Redefining E-Commerce in Bangladesh`}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {content.subtitle || content.mainDescription}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-20">
        {/* Main Introduction & Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Our Journey &amp; Core Philosophy
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {content.mainDescription}
            </p>
            {content.enabledSections?.story !== false && content.ourStory && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Our Story</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{content.ourStory}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3]">
              <img
                src={content.imageUrl || "https://images.unsplash.com/photo-1556742049-0a67d553c24d?auto=format&fit=crop&q=80&w=1200"}
                alt="About Store"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        {content.enabledSections?.missionVision !== false && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-900 text-white rounded-3xl space-y-4 shadow-lg">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center font-bold border border-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold">Our Mission</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {content.mission || "To empower every Bangladeshi household and professional with cutting-edge gear, unbeatable prices, and lightning-fast nationwide delivery."}
              </p>
            </div>

            <div className="p-8 bg-slate-100 border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-bold border border-slate-200 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Our Vision</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {content.vision || "To become the most trusted and customer-centric e-commerce brand in South Asia."}
              </p>
            </div>
          </div>
        )}

        {/* Why Choose Us */}
        {content.enabledSections?.whyChooseUs !== false && Array.isArray(content.whyChooseUs) && content.whyChooseUs.length > 0 && (
          <div className="space-y-8 text-center">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Excellence Guaranteed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Why Choose {storeName}?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.whyChooseUs.map((item: string, i: number) => (
                <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{item}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Commitment */}
        {content.enabledSections?.commitment !== false && content.customerCommitment && (
          <div className="p-8 sm:p-12 bg-emerald-900 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-800/80 px-3 py-1 rounded-lg">
                Customer First
              </span>
              <h3 className="text-2xl font-bold">Our Unwavering Commitment</h3>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                {content.customerCommitment}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <HeartHandshake className="w-8 h-8 text-emerald-300" />
            </div>
          </div>
        )}

        {/* Call To Action */}
        {content.enabledSections?.cta !== false && (
          <div className="text-center space-y-6 pt-6">
            <h3 className="text-2xl font-black text-slate-900">{content.callToAction || "Ready to explore our collection?"}</h3>
            <div>
              <Link
                to={content.buttonLink || "/shop"}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-lg"
              >
                <span>{content.buttonText || "Explore Shop Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
