import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Heart, Menu, LogOut, Truck, Layers, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { getStoreSettings, getCategories, Category } from "../lib/queries";

export default function Header() {
  const { user, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { itemCount: cartItemCount } = useCart();
  const [headerSearch, setHeaderSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState("STORE BD");
  const [navCategories, setNavCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStoreSettings().then(st => {
      if (st['store_name']) {
        setStoreName(st['store_name'].toUpperCase());
      }
    });

    getCategories().then(cats => {
      setNavCategories(cats.slice(0, 5));
    });
  }, []);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/shop?q=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{storeName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
          </Link>
        </div>

        {/* Global Search with instant submit */}
        <form onSubmit={handleHeaderSearch} className="hidden md:flex flex-1 mx-4 lg:mx-8 max-w-lg">
          <div className="relative w-full">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search products by title, category, brand..."
              className="w-full pl-10 pr-10 py-2 bg-slate-100/90 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-xs font-medium transition"
            />
            <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <Layers className="w-4 h-4" />
            <span>All Products</span>
          </Link>

          <Link
            to="/track"
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
            title="Track Order"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden lg:inline">Track</span>
          </Link>

          <Link
            to="/wishlist"
            className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="My Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                {cartItemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/account"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-xl transition"
                title="Customer Account"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Account</span>
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 text-slate-700 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Subnav Bar */}
      <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 py-2 border-t border-slate-100 text-xs font-semibold text-slate-600 overflow-x-auto">
        <Link to="/" className="hover:text-slate-900 transition">Home</Link>
        <Link to="/products" className="hover:text-slate-900 transition font-bold text-slate-900">All Products</Link>
        {navCategories.map((cat, index) => (
          <Link key={cat.id || cat.slug || index} to={`/category/${cat.slug}`} className="hover:text-slate-900 transition whitespace-nowrap">
            {cat.name}
          </Link>
        ))}
        <Link to="/track" className="hover:text-slate-900 transition text-emerald-700 font-bold whitespace-nowrap">
          Order Tracking
        </Link>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-3 shadow-lg">
          <form onSubmit={handleHeaderSearch} className="relative w-full">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800 pt-2 border-t border-slate-100">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/products" className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100">All Products</Link>
            {navCategories.map((cat, index) => (
              <Link key={cat.id || cat.slug || index} onClick={() => setIsMobileMenuOpen(false)} to={`/category/${cat.slug}`} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100">
                {cat.name}
              </Link>
            ))}
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/account" className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100">My Account</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/orders" className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100">Order History</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/track" className="p-2.5 bg-slate-900 text-white rounded-xl col-span-2 text-center">Live Order Tracking</Link>
          </div>
        </div>
      )}
    </header>
  );
}
