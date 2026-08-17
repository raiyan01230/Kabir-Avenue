import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PrintableOrders from '../../components/admin/PrintableOrders';
import { Printer, CheckSquare, Square, FileText, Package, Tag, Download, ExternalLink } from 'lucide-react';
import { downloadOrdersHtml, openPrintWindow, getResolvedStoreName } from '../../lib/invoiceDownload';
import { getStoreSettings } from '../../lib/queries';

export default function AdminPrinting() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [printFilter, setPrintFilter] = useState('all');
  const [printMode, setPrintMode] = useState<'invoice' | 'label' | 'packing'>('invoice');
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});

  // Selective printing checkboxes
  const [sections, setSections] = useState({
    customer: true,
    shipping: true,
    products: true,
    pricing: true,
    payment: true,
    notes: true,
    tracking: true
  });

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load orders:', err);
        setLoading(false);
      });

    getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (printFilter === 'pending') return o.order_status === 'pending';
    if (printFilter === 'shipped') return o.order_status === 'shipped' || o.order_status === 'out_for_delivery';
    if (printFilter === 'cod') return o.payment_method?.toLowerCase().includes('cash');
    return true;
  });

  const selectedOrdersData = orders.filter(o => selectedOrderIds.includes(o.id));

  const handlePrintSelected = () => {
    if (selectedOrderIds.length === 0) return;
    navigate(`/admin/orders/print?ids=${selectedOrderIds.join(',')}`);
  };

  const handleDownloadSelected = () => {
    const targetOrders = selectedOrdersData.length > 0 ? selectedOrdersData : filteredOrders;
    if (targetOrders.length === 0) return;
    downloadOrdersHtml(targetOrders, printMode, storeSettings);
  };

  const handlePrintSingle = (orderId: string) => {
    navigate(`/admin/orders/${orderId}/print`);
  };

  const handleDownloadSingle = (ord: any) => {
    downloadOrdersHtml([ord], printMode, storeSettings);
  };

  const liveStoreName = getResolvedStoreName(storeSettings);

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Printing &amp; Document Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate A4 tax invoices, delivery shipping labels &amp; packing slips with live website branding (<strong className="text-slate-300">{liveStoreName}</strong>)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSelected}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-extrabold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700 shadow-lg cursor-pointer"
                title="Download selected orders as standalone styled file"
              >
                <Download className="w-4 h-4" />
                <span>Download ({selectedOrderIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintSelected}
              disabled={selectedOrderIds.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected ({selectedOrderIds.length})</span>
            </button>
          </div>
        </div>

        {/* Print Controls & Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Document Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('invoice')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  printMode === 'invoice'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>A4 Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('label')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  printMode === 'label'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Shipping Label</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('packing')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  printMode === 'packing'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Packing Slip</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Order Filter</label>
            <select
              value={printFilter}
              onChange={e => setPrintFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="pending">Pending Orders</option>
              <option value="shipped">Shipped Orders</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Invoice Sections to Include</label>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <input type="checkbox" checked={sections.customer} onChange={e => setSections({...sections, customer: e.target.checked})} /> Customer
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <input type="checkbox" checked={sections.shipping} onChange={e => setSections({...sections, shipping: e.target.checked})} /> Shipping
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <input type="checkbox" checked={sections.products} onChange={e => setSections({...sections, products: e.target.checked})} /> Products
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <input type="checkbox" checked={sections.pricing} onChange={e => setSections({...sections, pricing: e.target.checked})} /> Pricing
              </label>
            </div>
          </div>
        </div>

        {/* Orders Selection Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-300">
              Showing {filteredOrders.length} orders ({selectedOrderIds.length} selected for print / export)
            </span>
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 w-10">
                    <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">No matching orders found.</td></tr>
                ) : (
                  filteredOrders.map(ord => {
                    const isSelected = selectedOrderIds.includes(ord.id);
                    const addr = ord.shipping_addresses?.[0];
                    return (
                      <tr key={ord.id} className={`hover:bg-slate-800/40 ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                        <td className="py-3">
                          <button type="button" onClick={() => toggleSelectOrder(ord.id)} className="text-slate-400 hover:text-white">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 font-bold text-white">
                          <Link to={`/admin/orders/${ord.id}/print`} className="hover:text-emerald-400 underline decoration-dotted font-mono">
                            {ord.order_number}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-200">{ord.customers?.full_name || addr?.full_name || 'Customer'}</td>
                        <td className="py-3 text-slate-400">{addr?.district || 'Dhaka'}</td>
                        <td className="py-3 font-bold text-emerald-400">৳{Number(ord.total).toLocaleString()}</td>
                        <td className="py-3 text-slate-300 capitalize">{ord.payment_method || 'COD'}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ord.order_status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(ord)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            title="Download standalone invoice file (.html)"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintSingle(ord.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                            title="Open A4 Print &amp; Document View"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400 hover:text-white" />
                            <span>Print</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hidden printable container that triggers when window.print() is called directly on this page */}
      <div className="hidden print:block">
        <PrintableOrders
          orders={selectedOrdersData.length > 0 ? selectedOrdersData : orders}
          mode={printMode}
          sections={sections}
          storeSettings={storeSettings}
        />
      </div>
    </>
  );
}
