import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, ShoppingCart, Users, Truck,
  Star, Tag, Image, BarChart3, Settings, Activity, ShieldAlert,
  LogOut, ChevronRight, Store, Database, Printer, Globe, ShieldCheck, Download, Sparkles, MapPin
} from 'lucide-react';

export default function AdminLayout() {
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate('/admin/login');
      return;
    }
    try {
      setAdmin(JSON.parse(session));
    } catch {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Loading Admin Portal...
      </div>
    );
  }

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'ORDERS',
      items: [
        { name: 'Orders & VIP', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Create VIP Order', path: '/admin/orders/create', icon: Sparkles },
        { name: 'Deliveries', path: '/admin/deliveries', icon: Truck },
        { name: 'Printing Center', path: '/admin/printing', icon: Printer }
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { name: 'Customers List', path: '/admin/customers', icon: Users },
        { name: 'Advanced CRM', path: '/admin/crm', icon: Users }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { name: 'Products', path: '/admin/products', icon: Package },
        { name: 'Categories', path: '/admin/categories', icon: Layers },
        { name: 'Inventory', path: '/admin/inventory', icon: Database },
        { name: 'Reviews', path: '/admin/reviews', icon: Star },
        { name: 'Promo Codes', path: '/admin/promo-codes', icon: Tag }
      ]
    },
    {
      title: 'STORE & CONTENT',
      items: [
        { name: 'Store Identity', path: '/admin/store', icon: Store },
        { name: 'Homepage & Content', path: '/admin/content', icon: Image },
        { name: 'Banners', path: '/admin/banners', icon: Image },
        { name: 'About Us Editor', path: '/admin/about-us', icon: Globe },
        { name: 'Contact Info & Locations', path: '/admin/contact-locations', icon: MapPin }
      ]
    },
    {
      title: 'CONTROL & OPS',
      items: [
        { name: 'Staff & Admin Users', path: '/admin/users', icon: ShieldCheck },
        { name: 'Operations', path: '/admin/operations', icon: Activity },
        { name: 'Maintenance & Toggles', path: '/admin/maintenance', icon: ShieldAlert },
        { name: 'SEO Settings', path: '/admin/seo', icon: Globe }
      ]
    },
    {
      title: 'SYSTEM & SECURITY',
      items: [
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Security & Roles', path: '/admin/security', icon: ShieldCheck },
        { name: 'Data Backups & CSV', path: '/admin/data', icon: Download },
        { name: 'Activity Log', path: '/admin/activity', icon: Activity },
        { name: 'System Health', path: '/admin/system-health', icon: ShieldAlert }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="print:hidden w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-emerald-600/30">
            A
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight">Admin Portal</h2>
            <p className="text-[10px] text-emerald-400 font-medium">Store Management</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{sec.title}</h3>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition mb-2"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>View Storefront</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 print:bg-white print:!block">
        <header className="print:hidden h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              Live Mode
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Connected to Supabase PostgreSQL & Storage
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{admin?.fullName || 'Administrator'}</div>
              <div className="text-[10px] text-slate-400">{admin?.email}</div>
            </div>
            <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xs">
              {(admin?.fullName?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-950 print:p-0 print:overflow-visible print:bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
