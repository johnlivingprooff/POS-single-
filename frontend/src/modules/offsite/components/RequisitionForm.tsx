import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { XIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { apiFetch } from '../../../lib/api-utils';

interface RequisitionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface RequisitionItem {
  productId: string;
  quantityOut: number;
}

const RequisitionForm: React.FC<RequisitionFormProps> = ({ onSubmit, onCancel, loading }) => {
  const { token } = useAuthStore();
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([{ productId: '', quantityOut: 1 }]);

  // Fetch products
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiFetch('/products', token);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if products are still loading
    if (productsLoading || productsError) {
      return;
    }
    
    // Validation
    if (!destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    
    const validItems = items.filter(item => item.productId && item.quantityOut > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid item');
      return;
    }

    onSubmit({
      destination: destination.trim(),
      purpose: purpose.trim() || undefined,
      items: validItems
    });
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantityOut: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequisitionItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-600"
              onClick={onCancel}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
                New Off-Site Requisition
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Show loading or error state for products */}
                {productsError && (
                  <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                    Error loading products: {String((productsError as Error)?.message || 'Unknown error')}
                  </div>
                )}

                {/* Destination */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Destination / Sales Location *
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Downtown Market, Client Site A"
                    required
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Sales demo, Customer delivery"
                  />
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items to Take Out *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add Item
                  </button>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto max-h-60">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="flex-1 min-w-[220px] max-w-[320px] w-[260px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary truncate"
                      required
                      style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      <option value="">
                      {productsLoading ? 'Loading products...' : 'Select Product'}
                      </option>
                      {products?.products?.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock: {product.stock}
                      </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      min="1"
                      value={item.quantityOut}
                      onChange={(e) => updateItem(index, 'quantityOut', parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Qty"
                      required
                    />
                    
                    {items.length > 1 && (
                      <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                      >
                      <MinusIcon className="w-4 h-4" />
                      </button>
                    )}
                    </div>
                  ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md bg-primary hover:bg-primary-dark disabled:opacity-50"
                    disabled={loading || productsLoading || !!productsError}
                  >
                    {loading ? 'Creating...' : 'Create Requisition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionForm;
