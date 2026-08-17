import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Printer, ArrowLeft, RefreshCw, AlertCircle, FileText, Tag, Package, CheckCircle2, Download, ExternalLink, Sparkles } from 'lucide-react';
import PrintableOrders from '../../components/admin/PrintableOrders';
import { downloadOrdersHtml, openPrintWindow, getResolvedStoreName } from '../../lib/invoiceDownload';
import { getStoreSettings } from '../../lib/queries';

export default function AdminOrderPrintPage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'invoice' | 'label' | 'packing'>('invoice');
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Authenticate Admin
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Load store settings
  useEffect(() => {
    getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });
  }, []);

  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    try {
      const idsParam = searchParams.get('ids');
      const singleIdParam = searchParams.get('id') || orderId;

      if (idsParam) {
        const res = await fetch(`/api/admin/orders/by-ids?ids=${encodeURIComponent(idsParam)}`);
        if (!res.ok) throw new Error('Failed to load selected batch orders');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No valid orders found for the requested IDs.');
        }
        setOrders(data);
      } else if (singleIdParam) {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(singleIdParam)}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error(`Order "${singleIdParam}" was not found in the database.`);
          throw new Error('Failed to retrieve order details from database.');
        }
        const data = await res.json();
        if (!data || !data.id) {
          throw new Error('Invalid order record returned.');
        }
        setOrders([data]);
      } else {
        throw new Error('No order ID provided for printing.');
      }
    } catch (err: any) {
      console.error('Print page fetch error:', err);
      setError(err.message || 'Unable to load order data for printing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [orderId, searchParams]);

  const handleManualPrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('window.print iframe issue, using standalone popup print:', err);
      openPrintWindow(orders, printMode, storeSettings);
    }
  };

  const handleOpenPrintWindow = () => {
    const success = openPrintWindow(orders, printMode, storeSettings);
    if (!success) {
      // Fallback to normal window print if popup blocked
      window.print();
    }
  };

  const handleDownloadHtml = () => {
    downloadOrdersHtml(orders, printMode, storeSettings);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/20 animate-pulse">
          <Printer className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold">Preparing Order Invoice...</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Retrieving real order details, line items, and store settings from Supabase database.
        </p>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center mb-4 border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-rose-400">Unable to Load Order for Printing</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md">
          {error || 'The requested order could not be located in the database.'}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={fetchOrderData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const liveStoreName = getResolvedStoreName(storeSettings);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 print:bg-white print:min-h-auto">
      {/* On-Screen Admin Action Bar (Hidden during printing) */}
      <header className="print:hidden sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Orders</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {orders.length === 1 ? `Print Order: ${orders[0].order_number}` : `Batch Print (${orders.length} Orders)`}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {liveStoreName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live website branding applied &bull; Ready for A4 print or file download
            </p>
          </div>
        </div>

        {/* Format Selector & Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setPrintMode('invoice')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'invoice' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>
            <button
              onClick={() => setPrintMode('label')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'label' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Shipping Label</span>
            </button>
            <button
              onClick={() => setPrintMode('packing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'packing' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Packing Slip</span>
            </button>
          </div>

          {/* Download File Button */}
          <button
            onClick={handleDownloadHtml}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer"
            title="Download offline-readable styled invoice document file"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Document'}</span>
          </button>

          {/* Fullscreen Popup Print */}
          <button
            onClick={handleOpenPrintWindow}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer"
            title="Open in a fresh standalone browser window and print"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Open &amp; Print</span>
          </button>

          {/* Standard Native Print */}
          <button
            onClick={handleManualPrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
            title="Trigger browser print dialog"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document (A4)</span>
          </button>
        </div>
      </header>

      {/* Screen Preview Container */}
      <main className="p-4 sm:p-8 print:p-0 print:m-0 max-w-5xl mx-auto">
        <div className="print:hidden bg-slate-800/40 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Live Website Name:</strong> This document displays <span className="text-white font-bold">{liveStoreName}</span> with live store address &amp; hotline.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadHtml}
              className="text-emerald-400 hover:underline font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleManualPrint}
              className="text-emerald-400 hover:underline font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Open Print Dialog</span>
            </button>
          </div>
        </div>

        {/* Actual Printable Component */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:border-none">
          <PrintableOrders orders={orders} mode={printMode} storeSettings={storeSettings} />
        </div>
      </main>
    </div>
  );
}
