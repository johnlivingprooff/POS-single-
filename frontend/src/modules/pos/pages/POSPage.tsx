import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';
import { Scan, Plus, Minus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { useAppToast } from '../../../hooks/useAppToast';
import { generateReceiptPDF } from '../../../components/ReceiptPDF';
import { downloadReceipt, ReceiptData } from '../../../utils/receiptFormatter';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ProductGridSkeleton from '../../../components/ProductGridSkeleton';
import { usePostMutationRefresh } from '../../../hooks/useRealTimeRefresh';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface TaxSettings {
  taxEnabled: boolean;
  taxType: 'inclusive' | 'exclusive';
  taxPercentage: number;
  taxName: string;
}

const POSPage: React.FC = () => {
  const { showToast } = useAppToast();
  const { refreshAfterMutation } = usePostMutationRefresh();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [otherPayment, setOtherPayment] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [currency, setCurrency] = useState('$'); // Default to $ symbol
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxEnabled: false,
    taxType: 'exclusive',
    taxPercentage: 0,
    taxName: 'Tax'
  });
  const { token } = useAuthStore();
  // Fetch tax settings
  const {
    data: taxData,
    isLoading: taxLoading
  } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const res = await apiFetch('/settings/tax', token);
      if (!res.ok) throw new Error('Failed to fetch tax settings');
      return res.json();
    }
  });

  // Update tax settings when data is fetched
  React.useEffect(() => {
    if (taxData) {
      setTaxSettings(taxData);
    }
  }, [taxData]);

  
    // Fetch currency setting
    const { data: currencyData } = useQuery(['currency', token], async () => {
      if (!token) return null;
      const res = await apiFetch('/settings/currency', token);
      if (!res.ok) throw new Error('Failed to fetch currency');
      return res.json();
    }, {
      enabled: !!token,
      onSuccess: (data) => {
        if (data?.currency) {
          // Map currency codes to symbols
          const currencySymbols: Record<string, string> = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥',
            'INR': '₹'
          };
          setCurrency(currencySymbols[data.currency] || data.currency);
        }
      }
    });

  // Fetch customers for dropdown
  const {
    data: customersData,
    isLoading: customersLoading,
    isError: customersError
  } = useQuery({
    queryKey: ['posCustomers'],
    queryFn: async () => {
      const res = await apiFetch('/customers?limit=100', token);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    }
  });
  const customers = customersData?.customers || [];

  // Fetch products from backend
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError
  } = useQuery({
    queryKey: ['posProducts'],
    queryFn: async () => {
      const res = await apiFetch('/products?limit=100', token);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  // Filter state and search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'finished_good' | 'raw_material'>('finished_good');
  
  // Filter products based on active filter and search term
  const displayedProducts = (productsData?.products || [])
    .filter((p: any) => {
      if (activeFilter === 'all') {
        return p.stockType === 'finished_good' || p.stockType === 'raw_material';
      }
      return p.stockType === activeFilter;
    })
    .filter((p: any) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term))
      );
    });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      // Check if we can increase quantity without exceeding stock
      if (existingItem.quantity >= product.stock) {
        showToast(`Only ${product.stock} units available for ${product.name}`, 'warning');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Check if product has any stock available
      if (product.stock <= 0) {
        showToast(`${product.name} is out of stock`, 'warning');
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    // Find the product to check its stock
    const product = displayedProducts.find((p: any) => p.id === id);
    if (product && quantity > product.stock) {
      showToast(`Only ${product.stock} units available for ${product.name}`, 'warning');
      return;
    }
    
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * discountPercentage) / 100;
  };

  const getSubtotalAfterDiscount = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const getTaxAmount = () => {
    if (!taxSettings.taxEnabled) return 0;
    
    if (taxSettings.taxType === 'inclusive') {
      // Tax is already included in the price, calculate what portion is tax
      const subtotalAfterDiscount = getSubtotalAfterDiscount();
      return subtotalAfterDiscount - (subtotalAfterDiscount / (1 + taxSettings.taxPercentage / 100));
    } else {
      // Tax is added on top
      return (getSubtotalAfterDiscount() * taxSettings.taxPercentage) / 100;
    }
  };

  const getTotal = () => {
    const subtotalAfterDiscount = getSubtotalAfterDiscount();
    
    if (!taxSettings.taxEnabled) {
      return subtotalAfterDiscount;
    }
    
    if (taxSettings.taxType === 'inclusive') {
      // Tax is already included, total is the subtotal after discount
      return subtotalAfterDiscount;
    } else {
      // Tax is added on top
      return subtotalAfterDiscount + getTaxAmount();
    }
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    // Lookup product by SKU/barcode from fetched products
    const product = displayedProducts.find((p: any) => p.sku === barcode);
    if (product) {
      addToCart(product);
      setBarcode('');
    } else {
      showToast('Product not found', 'error');
    }
  };

  // Navigation to purchase order form
  const navigate = useNavigate();
  const goToPurchaseOrder = () => navigate('/pos/purchase-order');

  const handleShowPaymentModal = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let method = paymentMethod;
    if (paymentMethod === 'other') {
      method = otherPayment.trim() || 'Other';
    }
    if (!method) return;
    setShowPaymentModal(false);
    try {
      const salePayload: any = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod: method,
        discount: getDiscountAmount(),
        tax: getTaxAmount(),
        notes: ''
      };
      if (selectedCustomerId) {
        salePayload.customerId = selectedCustomerId;
      }
      const res = await apiFetch('/sales', token, {
        method: 'POST',
        body: JSON.stringify(salePayload)
      });
      if (!res.ok) {
        let errMsg = 'Failed to record sale';
        try {
          const errText = await res.text();
          if (errText) {
            if (errText.startsWith('{')) {
              const errObj = JSON.parse(errText);
              errMsg = errObj.message || errObj.error || errText;
            } else {
              errMsg = errText;
            }
          }
        } catch {}
        showToast(errMsg, 'error');
        throw new Error(errMsg);
      }
      const saleResult = await res.json();
      setCart([]);
      setSelectedCustomerId('');
      setPaymentMethod('');
      setOtherPayment('');
      setDiscountPercentage(0);
      showToast('Sale recorded successfully!', 'success');
      // Trigger real-time refresh for inventory and sales data
      refreshAfterMutation(['inventory', 'sales']);
      
      // Generate receipt with new formatter
      const receiptData: ReceiptData = {
        companyName: 'Habicore POS Store', // This should come from settings
        address: '123 Business Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        saleNumber: saleResult?.saleNumber || 'N/A',
        date: new Date().toLocaleDateString(),
        customerName: selectedCustomerId ? (customers.find((c: any) => c.id === selectedCustomerId)?.name || '-') : 'Walk-in',
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: getSubtotal(),
        tax: getTaxAmount(),
        discount: getDiscountAmount(),
        total: getTotal(),
        paymentMethod: paymentMethod === 'other' ? otherPayment : paymentMethod,
        currency: currencyData?.currency || 'USD', // Use actual currency from settings
        currencySymbol: currency
      };
      
      // Download receipt as centered, printable HTML
      downloadReceipt(receiptData, 'A4', true);
    } catch (error: any) {
      showToast(error.message || 'Payment failed. Please try again.', 'error');
    }
  };

  return (
    <div className="flex h-full">
      {/* Product Selection Area */}
      <div className="flex-1 p-6 bg-gray-50">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">POS Terminal</h1>
        {/* Barcode Scanner */}
        <div className="p-4 mb-6 bg-white border rounded-lg shadow-sm">
          <form onSubmit={handleBarcodeScan} className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="barcode" className="block mb-2 text-sm font-medium text-gray-700">
                Scan Barcode or Enter SKU / Search by Name
              </label>
              <input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Scan or type product code"
                autoFocus
              />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Search by product name or SKU"
              />
            </div>
            <button
              type="submit"
              className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Scan className="w-4 h-4 mr-2" />
              Add
            </button>
          </form>
        </div>
        {/* Filter Pills */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1 text-sm font-medium border rounded-full transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setActiveFilter('finished_good')}
            className={`px-4 py-1 text-sm font-medium border rounded-full transition-colors ${
              activeFilter === 'finished_good'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Finished Goods
          </button>
          <button
            onClick={() => setActiveFilter('raw_material')}
            className={`px-4 py-1 text-sm font-medium border rounded-full transition-colors ${
              activeFilter === 'raw_material'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Raw Materials
          </button>
        </div>
        {/* Product Grid */}
        {productsLoading ? (
          <ProductGridSkeleton count={12} columns="lg" />
        ) : productsError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mb-2 text-red-500">Failed to load products</div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-primary hover:text-primary/80"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((product: any) => (
              <div key={product.id} className="p-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="mb-2 text-sm text-gray-600">SKU: {product.sku}</p>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-bold text-primary">{currency}{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-sm font-medium text-gray-500">
                    {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                  </p>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`w-full px-4 py-2 transition-colors rounded-md ${
                    product.stock <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Cart */}
      <div className="flex flex-col p-6 bg-white border-l w-96">
        <div className="flex items-center mb-6">
          <ShoppingCart className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Cart ({cart.length})</h2>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <label htmlFor="customer" className="block mb-2 text-sm font-medium text-gray-700">
            Customer (Optional)
          </label>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((customer: any) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          {customersLoading && <div className="mt-1 text-sm text-gray-500">Loading customers...</div>}
          {customersError && <div className="mt-1 text-sm text-red-500">Failed to load customers.</div>}
        </div>

        {/* Cart Items */}
        <div className="flex-1 mb-6 space-y-4 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Cart is empty</p>
          ) : (
            cart.map((item) => {
              // Find the corresponding product to get current stock
              const product = displayedProducts.find((p: any) => p.id === item.id);
              const currentStock = product?.stock || 0;
              const isAtMaxQuantity = item.quantity >= currentStock;
              
              return (
              <div key={item.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">{currency}{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-500">{currentStock} available</p>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isAtMaxQuantity}
                      className={`p-1 ${
                        isAtMaxQuantity 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title={isAtMaxQuantity ? 'Maximum stock reached' : 'Increase quantity'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-2 text-right">
                  <p className="font-bold">
                    Subtotal: {currency}{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {isAtMaxQuantity && (
                    <p className="mt-1 text-xs text-amber-600">Maximum stock reached</p>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Total and Checkout */}
        {cart.length > 0 && (
          <div className="pt-4 space-y-4 border-t">
            {/* Discount Input */}
            <div>
              <label htmlFor="discount" className="block mb-2 text-sm font-medium text-gray-700">
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter discount percentage"
              />
            </div>

            {/* Order Summary */}
            <div className="p-4 space-y-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{currency}{getSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {discountPercentage > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discountPercentage}%):</span>
                  <span>-{currency}{getDiscountAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {taxSettings.taxEnabled && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{taxSettings.taxName} ({taxSettings.taxPercentage}% {taxSettings.taxType}):</span>
                  <span>{taxSettings.taxType === 'inclusive' ? 'included' : `${currency}${getTaxAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{currency}{getTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleShowPaymentModal}
                className="flex items-center justify-center w-full px-4 py-3 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Process Payment
              </button>
      {/* Payment Method Modal */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Select Payment Method">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="" disabled>Select method</option>
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="digital">Digital Wallet</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other (specify)</option>
            </select>
          </div>
          {paymentMethod === 'other' && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Specify Other Method</label>
              <input
                type="text"
                value={otherPayment}
                onChange={e => setOtherPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter payment method"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 text-white rounded-md bg-primary hover:bg-primary/90">Confirm</button>
          </div>
        </form>
      </Modal>
              
              <button
                onClick={() => setCart([])}
                className="w-full px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSPage;
