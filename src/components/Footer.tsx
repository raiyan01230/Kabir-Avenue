import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, RefreshCw, Mail, Phone, MapPin, Layers } from "lucide-react";
import { getCategories, Category, getStoreSettings, getDeliveryZones, subscribeToStoreUpdates } from "../lib/queries";

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [zones, setZones] = useState<Record<string, number>>({});

  const loadFooterData = async () => {
    try {
      const [cats, st, dz] = await Promise.all([
        getCategories(),
        getStoreSettings(),
        getDeliveryZones()
      ]);
      setCategories(cats);
      setSettings(st);
      setZones(dz);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadFooterData();
    const unsubscribe = subscribeToStoreUpdates(loadFooterData);
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900">
      <div className="container mx-auto max-w-7xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1: Brand & Bangladesh Identity */}
        <div className="space-y-4">
          <Link to="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>{settings['store_name'] || 'HYPERDRIVE'}</span>
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            {settings['store_description'] || "Bangladesh's premier destination for genuine enthusiast hardware, high-refresh displays, and ergonomic mechanical peripherals."}
          </p>
          <div className="pt-2 text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{settings['contact_address'] || "Level 4, Tech Plaza, Agargaon, Dhaka-1207"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{settings['contact_phone'] || "+880 1700-000000"} {settings['business_hours'] && `(${settings['business_hours']})`}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{settings['contact_email'] || "support@hyperdrive.bd"}</span>
            </p>
          </div>
        </div>

        {/* Col 2: Dynamic Categories */}
        <div>
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wider">
            Shop Categories
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/category/${cat.slug}`}
                  className="hover:text-white transition flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/products" className="text-slate-200 font-bold hover:underline transition">
                View All Categories →
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Quick Navigation */}
        <div>
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wider">
            Quick Navigation
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
            <li><Link to="/track" className="hover:text-white transition font-bold text-white">Live Order Tracking</Link></li>
            <li><Link to="/account" className="hover:text-white transition">Customer Account</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">Order History</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition">Saved Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-white transition">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Col 4: Dispatch & Bangladesh Delivery Rates */}
        <div>
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wider">
            Delivery Coverage
          </h3>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex justify-between font-bold text-white mb-0.5">
                <span>Inside Dhaka</span>
                <span className="text-emerald-400">৳{zones['Inside Dhaka'] || 70}</span>
              </div>
              <p className="text-[11px] text-slate-400">Express delivery within 24–48 hours with live courier tracking.</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex justify-between font-bold text-white mb-0.5">
                <span>Outside Dhaka (All BD)</span>
                <span className="text-emerald-400">৳{zones['Outside Dhaka'] || 130}</span>
              </div>
              <p className="text-[11px] text-slate-400">Nationwide courier delivery covering all 64 districts &amp; Upazilas.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {settings['copyright_year'] || new Date().getFullYear().toString()} {settings['store_name'] || 'Hyperdrive Bangladesh'}. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span>Official Warranty Verified</span>
          <span>Cash on Delivery Supported</span>
        </div>
      </div>
    </footer>
  );
}
