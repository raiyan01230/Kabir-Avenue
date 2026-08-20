import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, Globe, ShieldCheck } from 'lucide-react';
import { getStoreSettings, subscribeToStoreUpdates } from '../lib/queries';
import { useSEO } from '../hooks/useSEO';

export default function ContactUs() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { settings: seoSettings } = useSEO();

  const loadSettings = async () => {
    try {
      const st = await getStoreSettings();
      setSettings(st);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSettings();
    const unsub = subscribeToStoreUpdates(loadSettings);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit message');
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const storeName = settings['store_name'] || 'SHM Gadget Zone';
  const supportEmail = settings['contact_email'] || 'support@shmgadgetzone.bd';
  const hotline = settings['contact_phone'] || '+880 1700-000000';
  const whatsapp = settings['whatsapp_url'] || '+880 1700-000000';
  const address = settings['contact_address'] || 'Level 4, Tech Plaza, Agargaon, Dhaka-1207';
  const warehouse = settings['warehouse_address'] || 'Warehouse Hub, Tejgaon Industrial Area, Dhaka';
  const hours = settings['business_hours'] || 'Saturday – Thursday: 10:00 AM – 8:00 PM';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Contact {storeName} Support
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Have questions about our genuine products, wholesale pricing, order delivery status, or warranty claims? Our customer support team in Dhaka is ready to assist you.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Official Hotline & WhatsApp</h3>
              <p className="text-xs text-slate-600 mt-1">{hotline}</p>
              {whatsapp && <p className="text-xs text-emerald-600 font-semibold mt-0.5">WhatsApp Ready</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Support Email</h3>
              <p className="text-xs text-slate-600 mt-1">{supportEmail}</p>
              <p className="text-xs text-slate-400 mt-0.5">Replies within 2 business hours</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Business Hours</h3>
              <p className="text-xs text-slate-600 mt-1">{hours}</p>
              <p className="text-xs text-rose-500 font-semibold mt-0.5">Friday: Closed</p>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Head Office & Showroom</h4>
              <p className="text-sm text-slate-700">{address}</p>
              <p className="text-xs text-slate-500">Visit our experience center to test premium audio and tech gear.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Central Warehouse Hub</h4>
              <p className="text-sm text-slate-700">{warehouse}</p>
              <p className="text-xs text-slate-500">Dispatch center for all Inside & Outside Dhaka express deliveries.</p>
            </div>
          </div>
        </div>

        {/* Contact Form & Map / Additional Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-8 sm:p-10 space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Send Us a Secure Message</h3>
              <p className="text-xs text-slate-500 mt-1">Fill out the form below and our support representatives will get back to you promptly.</p>
            </div>

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Thank you! Your message has been successfully recorded and sent to our support team. We will respond via email or phone shortly.</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tanvir Ahmed"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., tanvir@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +880 1800-000000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Order Delivery Status / Warranty Inquiry"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Bangladesh Support
              </span>
              <h3 className="text-xl font-bold">Why Contact {storeName}?</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time order verification and tracking assistance across all 64 districts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Expert consultation on mechanical keyboards, audio gear, and workstation hardware.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hassle-free warranty claims and replacement support.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="text-xs font-bold text-white">Need immediate assistance?</div>
              <p className="text-[11px] text-slate-400">Call our official hotline directly or connect with our support agents on WhatsApp during business hours.</p>
              <div className="text-xs font-extrabold text-emerald-400 pt-1">{hotline}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
