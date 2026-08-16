import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Truck, ShoppingBag, Clock, Copy, Check } from 'lucide-react';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order_number') || '';
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(orderNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = orderNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy order reference:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border border-emerald-200 shadow-sm animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
        Order Placed Successfully!
      </h1>
      <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
        Thank you for your purchase. We have received your order and our fulfillment team is preparing your package.
      </p>

      {orderNumber && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Order Reference #
              </span>
              <span className="font-mono font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                {orderNumber}
              </span>
            </div>
            <button
              id="copy-order-reference-btn"
              type="button"
              onClick={handleCopyOrderNumber}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 active:scale-95'
              }`}
              title="Copy Order Reference Number"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Payment Method</span>
            <span className="font-bold text-slate-900">Cash on Delivery</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Pending Confirmation
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {orderNumber ? (
          <Link
            to={`/track/${orderNumber}`}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow transition gap-2"
          >
            <Truck className="w-4 h-4" />
            Track Order Live
          </Link>
        ) : (
          <Link
            to="/orders"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow transition gap-2"
          >
            <Clock className="w-4 h-4" />
            View Order History
          </Link>
        )}

        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
