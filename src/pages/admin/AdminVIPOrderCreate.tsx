import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Trash2, ShoppingBag, User, Truck,
  DollarSign, Tag, CheckCircle, AlertCircle, Printer, ShieldCheck,
  Package, Sparkles, Phone, Mail, MapPin, Layers, Percent, Download
} from 'lucide-react';
import { downloadOrdersHtml } from '../../lib/invoiceDownload';
import { getStoreSettings } from '../../lib/queries';

interface SelectedProductItem {
  productId: string;
  name: string;
  sku: string;
  image_url: string;
  catalogPrice: number;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
  subtotal: number;
}

const BD_DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'
];

export default function AdminVIPOrderCreate() {
  const navigate = useNavigate();
  const admin_email = JSON.parse(localStorage.getItem('admin_session') || '{}').email || 'admin@hyperdrive.bd';

  // Master data
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Customer selection mode: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Customer Form fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // Product Selection fields
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);

  // Shipping & Address fields
  const [deliveryArea, setDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [customShippingFee, setCustomShippingFee] = useState<string>('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('Gulshan');
  const [fullAddress, setFullAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Discount & Payment
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderType, setOrderType] = useState('VIP Order');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});

  // Load products, categories, and customers
  useEffect(() => {
    getStoreSettings().then(settings => {
      if (settings) setStoreSettings(settings);
    });

    async function loadData() {
      try {
        setLoadingData(true);
        const [prodRes, catRes, custRes] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/customers')
        ]);

        const [prodData, catData, custData] = await Promise.all([
          prodRes.json(),
          catRes.json(),
          custRes.json()
        ]);

        setCatalogProducts(Array.isArray(prodData) ? prodData : []);
        setCategories(Array.isArray(catData) ? catData : []);
        setExistingCustomers(Array.isArray(custData) ? custData : []);
      } catch (err) {
        console.error('Failed to load VIP order creation data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Handle selecting an existing customer
  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setCustName(cust.full_name || '');
    setCustPhone(cust.phone || '');
    setCustEmail(cust.email || '');
    setCustomerSearch('');
  };

  // Add a product to the order
  const handleAddProduct = (prod: any) => {
    const existingIndex = selectedItems.findIndex(i => i.productId === prod.id);
    const primaryImg = prod.product_images?.find((img: any) => img.is_primary)?.image_url
      || prod.product_images?.[0]?.image_url
      || prod.image_url
      || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80';

    const price = Number(prod.price) || 0;

    if (existingIndex > -1) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        subtotal: newQty * updated[existingIndex].unitPrice
      };
      setSelectedItems(updated);
    } else {
      const newItem: SelectedProductItem = {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku || 'N/A',
        image_url: primaryImg,
        catalogPrice: price,
        unitPrice: price,
        quantity: 1,
        stockQuantity: prod.stock_quantity ?? 0,
        subtotal: price
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Update quantity of an item
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...selectedItems];
    updated[index] = {
      ...updated[index],
      quantity: newQty,
      subtotal: newQty * updated[index].unitPrice
    };
    setSelectedItems(updated);
  };

  // Update custom VIP unit price
  const handleUpdateUnitPrice = (index: number, newPrice: number) => {
    const updated = [...selectedItems];
    const priceVal = Math.max(0, newPrice);
    updated[index] = {
      ...updated[index],
      unitPrice: priceVal,
      subtotal: updated[index].quantity * priceVal
    };
    setSelectedItems(updated);
  };

  // Remove an item
  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  // Financial calculations
  const itemsSubtotal = selectedItems.reduce((acc, item) => acc + item.subtotal, 0);

  let calculatedDiscount = 0;
  const numDiscountVal = parseFloat(discountValue) || 0;
  if (discountType === 'percent') {
    calculatedDiscount = (itemsSubtotal * Math.min(100, numDiscountVal)) / 100;
  } else if (discountType === 'fixed') {
    calculatedDiscount = Math.min(itemsSubtotal, numDiscountVal);
  }

  const shippingFee = customShippingFee !== ''
    ? (parseFloat(customShippingFee) || 0)
    : (deliveryArea === 'Outside Dhaka' ? 130 : 70);

  const grandTotal = Math.max(0, itemsSubtotal - calculatedDiscount + shippingFee);

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!custName.trim()) {
      setErrorMessage('Customer Name is required');
      return;
    }
    if (!custPhone.trim()) {
      setErrorMessage('Customer Phone number is required');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMessage('Please add at least one product to the order.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_name: custName.trim(),
        customer_email: custEmail.trim() || `vip_${Date.now()}@hyperdrive.bd`,
        customer_phone: custPhone.trim(),
        items: selectedItems.map(item => ({
          productId: item.productId,
          productName: item.name,
          productImageSnapshot: item.image_url,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        shipping_info: {
          full_name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim() || `vip_${Date.now()}@hyperdrive.bd`,
          division,
          district,
          thana,
          full_address: fullAddress.trim() || `${thana}, ${district}, ${division}`,
          delivery_area: deliveryArea
        },
        discount: calculatedDiscount,
        discount_type: discountType,
        discount_value: numDiscountVal,
        custom_shipping_fee: customShippingFee !== '' ? shippingFee : null,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_type: orderType,
        order_note: orderNote.trim() || `Manual ${orderType} created by Admin (${admin_email})`,
        admin_email
      };

      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedOrder(data.order || {
          order_number: data.orderNumber,
          total: grandTotal,
          customer_name: custName,
          customer_phone: custPhone,
          items: selectedItems,
          shipping_fee: shippingFee,
          discount: calculatedDiscount,
          subtotal: itemsSubtotal
        });
      } else {
        setErrorMessage(data.error || 'Failed to create VIP order');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (createdOrder) {
      navigate(`/admin/orders/${createdOrder.id || createdOrder.order_number}/print`);
    }
  };

  const handleDownload = () => {
    if (createdOrder) {
      downloadOrdersHtml([createdOrder], 'invoice', storeSettings);
    }
  };

  const handleResetForm = () => {
    setCreatedOrder(null);
    setSelectedItems([]);
    setSelectedCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setFullAddress('');
    setOrderNote('');
    setDiscountType('none');
    setDiscountValue('0');
    setCustomShippingFee('');
  };

  // Filter products for the product picker
  const filteredCatalog = catalogProducts.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(productSearch.toLowerCase())
      || (prod.sku && prod.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || prod.category_id === categoryFilter;
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'in_stock' && (prod.stock_quantity ?? 0) > 0)
      || (stockFilter === 'out_of_stock' && (prod.stock_quantity ?? 0) <= 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders List</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <span>Create VIP &amp; Offline Order</span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Real DB Integration
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manually create customer orders with custom VIP pricing, real stock deduction, Bangladesh shipping, and email dispatch
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Modal / Order Card */}
      {createdOrder && (
        <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Order Created Successfully!</h2>
                <p className="text-xs text-emerald-400 font-mono">Order Number: #{createdOrder.order_number}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Download invoice file directly"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                + Create Another Order
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Customer</span>
              <span className="font-bold text-white">{custName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Phone</span>
              <span className="font-mono text-slate-300">{custPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Delivery Area</span>
              <span className="text-slate-300">{deliveryArea} (৳{shippingFee})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Grand Total</span>
              <span className="font-extrabold text-emerald-400 text-sm">৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Customer Details & Product Picker */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Customer Information Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Customer Information</h2>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${customerMode === 'new' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    New Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${customerMode === 'existing' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Select Existing ({existingCustomers.length})
                  </button>
                </div>
              </div>

              {/* Mode: Existing Customer Search */}
              {customerMode === 'existing' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search existing customer by Name, Email, or Phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {customerSearch && (
                    <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
                      {existingCustomers
                        .filter(c => (c.full_name || '').toLowerCase().includes(customerSearch.toLowerCase())
                          || (c.email || '').toLowerCase().includes(customerSearch.toLowerCase())
                          || (c.phone || '').includes(customerSearch))
                        .slice(0, 5)
                        .map(cust => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full text-left p-3 hover:bg-slate-900 flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <div className="font-bold text-white">{cust.full_name}</div>
                              <div className="text-[10px] text-slate-400">{cust.email} &bull; {cust.phone || 'No phone'}</div>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                              Select
                            </span>
                          </button>
                        ))}
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-emerald-400 font-bold">Selected Customer: </span>
                        <span className="text-white font-medium">{selectedCustomer.full_name}</span>
                        <span className="text-slate-400 ml-2">({selectedCustomer.email})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[10px] text-slate-400 hover:text-rose-400"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Tanvir Hossain"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+880 1700 000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Product Picker & Catalog Search */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Product Catalog Selector</h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Stock</option>
                    <option value="in_stock">In Stock (&gt;0)</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search products by Name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Product Catalog Grid */}
              <div className="max-h-64 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {loadingData ? (
                  <div className="col-span-2 text-center py-6 text-slate-500 text-xs">
                    Loading product catalog...
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-slate-500 text-xs">
                    No products match your criteria.
                  </div>
                ) : (
                  filteredCatalog.slice(0, 10).map((prod) => {
                    const primaryImg = prod.product_images?.find((img: any) => img.is_primary)?.image_url
                      || prod.product_images?.[0]?.image_url
                      || prod.image_url
                      || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80';
                    const stock = prod.stock_quantity ?? 0;

                    return (
                      <div
                        key={prod.id}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition"
                      >
                        <img src={primaryImg} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-emerald-400">৳{Number(prod.price).toLocaleString()}</span>
                            <span>&bull;</span>
                            <span className={stock > 5 ? 'text-emerald-400' : stock > 0 ? 'text-amber-400' : 'text-rose-400'}>
                              {stock} in stock
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Selected Order Items Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    3. Selected Order Items ({selectedItems.length})
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  Subtotal: ৳{itemsSubtotal.toLocaleString()}
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                  No products added yet. Click &quot;Add&quot; from the catalog selector above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Unit Price (VIP ৳)</th>
                        <th className="pb-2 text-center">Quantity</th>
                        <th className="pb-2 text-right">Subtotal</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-3 flex items-center gap-3">
                            <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-800" />
                            <div>
                              <div className="font-bold text-white truncate max-w-[180px]">{item.name}</div>
                              <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateUnitPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
                            />
                            {item.unitPrice !== item.catalogPrice && (
                              <span className="block text-[9px] text-slate-500 line-through mt-0.5">
                                Std: ৳{item.catalogPrice.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <div className="inline-flex items-center border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 font-bold text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              >
                                +
                              </button>
                            </div>
                            {item.quantity > item.stockQuantity && (
                              <div className="text-[9px] text-amber-400 font-semibold mt-1">
                                Warning: {item.stockQuantity} in stock
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-white">
                            ৳{item.subtotal.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Bangladesh Delivery, VIP Discount & Financial Summary */}
          <div className="space-y-6">
            {/* 4. Bangladesh Shipping Address */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Bangladesh Delivery Address</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Delivery Zone</label>
                  <select
                    value={deliveryArea}
                    onChange={(e: any) => setDeliveryArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (Standard: ৳70)</option>
                    <option value="Outside Dhaka">Outside Dhaka (Standard: ৳130)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Custom Courier Fee (Optional Override)</label>
                  <input
                    type="number"
                    placeholder="Leave blank for standard zone fee"
                    value={customShippingFee}
                    onChange={(e) => setCustomShippingFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Division</label>
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      {BD_DIVISIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Thana / Upazila</label>
                  <input
                    type="text"
                    value={thana}
                    onChange={(e) => setThana(e.target.value)}
                    placeholder="e.g. Gulshan / Dhanmondi"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Street Address &amp; Landmark</label>
                  <textarea
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="House, Road, Block, Landmark..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. VIP Discount & Payment Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">5. VIP Discount &amp; Payment</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('none')}
                      className={`py-1.5 rounded-lg font-semibold transition ${discountType === 'none' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`py-1.5 rounded-lg font-semibold transition ${discountType === 'percent' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`py-1.5 rounded-lg font-semibold transition ${discountType === 'fixed' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      ৳ Fixed
                    </button>
                  </div>
                </div>

                {discountType !== 'none' && (
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {discountType === 'percent' ? 'Discount Percentage (%)' : 'Fixed Discount Amount (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="bKash / Mobile Banking">bKash / Nagad</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="POS / Card">POS / Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Order Classification</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="VIP Order">VIP Order</option>
                      <option value="Phone Order">Phone Order</option>
                      <option value="Social Media Order">Social Media Order</option>
                      <option value="Offline Store">Walk-in Offline</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Internal Note / VIP Instructions</label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Special priority packing, delivery instructions..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 6. Order Summary & Submit Button */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Order Financial Summary
              </h2>

              <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal ({selectedItems.length} items)</span>
                  <span className="font-semibold">৳{itemsSubtotal.toLocaleString()}</span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Applied VIP Discount ({discountType === 'percent' ? `${discountValue}%` : 'Fixed'})</span>
                    <span>-৳{calculatedDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300">
                  <span>Shipping Fee ({deliveryArea})</span>
                  <span className="font-semibold">৳{shippingFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold text-white pt-1">
                <span>Grand Total:</span>
                <span className="text-xl font-black text-emerald-400">৳{grandTotal.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || selectedItems.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Processing VIP Order...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm &amp; Place Order in Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
