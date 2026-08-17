import React from 'react';
import { Truck, ShieldCheck, Headphones, RotateCcw, Lock, Award, Zap, CheckCircle2 } from 'lucide-react';

export default function FeatureFocusSections({ variant = 'grid' }: { variant?: 'grid' | 'strip' }) {
  const features = [
    {
      icon: Truck,
      title: 'Express Delivery in Bangladesh',
      description: 'Rapid ৳70 delivery inside Dhaka & ৳130 across all 64 districts nationwide.',
      badge: 'Fast & Reliable'
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Warranty',
      description: 'Authentic imported and domestic goods backed by official store & brand warranty.',
      badge: 'Verified Quality'
    },
    {
      icon: Headphones,
      title: '24/7 Dedicated Support',
      description: 'Friendly customer hotline, WhatsApp & email assistance whenever you need help.',
      badge: 'Always Here'
    },
    {
      icon: RotateCcw,
      title: 'Hassle-Free 7-Day Returns',
      description: 'Simple and transparent return and exchange policy for complete peace of mind.',
      badge: 'Easy Exchange'
    },
    {
      icon: Lock,
      title: 'Secure COD & Mobile Pay',
      description: 'Pay safely via Cash on Delivery, bKash, Nagad, or secure card transactions.',
      badge: '100% Safe'
    }
  ];

  if (variant === 'strip') {
    return (
      <div className="bg-slate-900 border-y border-slate-800 text-white py-8 px-4 my-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Award className="w-3.5 h-3.5" />
          <span>Why Shop With HyperDrive BD</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Built for Premium Shopping &amp; Absolute Trust
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm">
          Discover our core commitments designed to give you the ultimate online retail experience in Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {f.badge}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-950 text-sm tracking-tight">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.description}</p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Guaranteed Service</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
