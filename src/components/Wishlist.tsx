import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Heart, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { addItemToCustomerCart } from '../lib/cart';

export default function Wishlist() {
  const { items, loading, removeItem } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddToCart = async (productId: string, price: string, name: string) => {
    if (!user) {
      showNotification('Please sign in to add items to your cart', 'error');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    try {
      setActionLoadingId(productId);
      await addItemToCustomerCart(user.id, productId, price, 1);
      showNotification(`Added "${name}" to your cart!`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to add item to cart', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBuyNow = async (productId: string, price: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setActionLoadingId(productId);
      await addItemToCustomerCart(user.id, productId, price, 1);
      navigate('/checkout');
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to initiate checkout', 'error');
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Heart className="w-6 h-6 fill-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Wishlist</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition"
          >
            Continue Shopping
          </Link>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Go to Cart
          </Link>
        </div>
      </div>

      {/* Guest Notice */}
      {!user && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Save your wishlist permanently</p>
              <p className="text-amber-700 text-xs mt-0.5">
                You are browsing as a guest. Create an account or sign in to sync your wishlist across all devices.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="whitespace-nowrap px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Sign In / Register
          </Link>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Explore our curated catalog and tap the heart icon on any product to save it here for easy checkout.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm"
          >
            Explore Featured Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item.product;
            const isProcessing = actionLoadingId === product.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full mb-2">
                        In Stock
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {product.description || 'Premium build, verified high performance, standard warranty.'}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(product.id)}
                      title="Remove from wishlist"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-5 py-4 bg-slate-50/50 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">৳{product.price}</span>
                      {product.comparePrice && (
                        <span className="ml-2 text-sm text-slate-400 line-through">৳{product.comparePrice}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nationwide Delivery
                    </span>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddToCart(product.id, product.price, product.name)}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isProcessing ? 'Adding...' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => handleBuyNow(product.id, product.price)}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition shadow-sm disabled:opacity-60"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
