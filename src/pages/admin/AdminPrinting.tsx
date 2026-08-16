import { useEffect, useState } from 'react';
import PrintableOrders from '../../components/admin/PrintableOrders';
import { Printer, CheckSquare, Square, FileText, Package, Truck, Download } from 'lucide-react';

export default function AdminPrinting() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [printFilter, setPrintFilter] = useState('all');
  const [printMode, setPrintMode] = useState<'single' | 'multi' | 'invoice' | 'label' | 'packing'>('invoice');

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

  const handlePrintSelected = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Printing &amp; Document Center</h1>
          <p className="text-xs text-slate-400 mt-1">Generate professional A4 invoices, delivery shipping labels, packing slips &amp; batch prints</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintSelected}
            disabled={selectedOrderIds.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
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
          <select
            value={printMode}
            onChange={e => setPrintMode(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold"
          >
            <option value="invoice">Professional A4 Invoice</option>
            <option value="label">Delivery Shipping Label</option>
            <option value="packing">Packing Slip</option>
            <option value="multi">Batch Multi-Order Print</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Order Filter</label>
          <select
            value={printFilter}
            onChange={e => setPrintFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending Orders</option>
            <option value="shipped">Shipped Orders</option>
            <option value="cod">Cash on Delivery (COD)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Selective Sections to Include</label>
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-3 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
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
              <th className="pb-3 text-right">Quick Print</th>
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
                  <tr key={ord.id} className="hover:bg-slate-800/40">
                    <td className="py-3">
                      <button onClick={() => toggleSelectOrder(ord.id)} className="text-slate-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 font-bold text-white">{ord.order_number}</td>
                    <td className="py-3 text-slate-200">{ord.customers?.full_name || 'Customer'}</td>
                    <td className="py-3 text-slate-400">{addr?.district || 'Dhaka'}</td>
                    <td className="py-3 font-bold text-emerald-400">৳{Number(ord.total).toLocaleString()}</td>
                    <td className="py-3 text-slate-300">{ord.payment_method}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrderIds([ord.id]);
                          window.print();
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
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
    <PrintableOrders orders={orders.filter(o => selectedOrderIds.includes(o.id))} />
    </>
  );
}
