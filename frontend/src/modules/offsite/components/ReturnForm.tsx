import React, { useState } from 'react';
import { XIcon, PlusIcon, MinusIcon } from 'lucide-react';

interface ReturnFormProps {
  requisition: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface ReturnItem {
  productId: string;
  quantityReturned: number;
  quantityDamaged: number;
  quantityLost: number;
}

const ReturnForm: React.FC<ReturnFormProps> = ({ requisition, onSubmit, onCancel, loading }) => {
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReturnItem[]>(
    requisition.items.map((item: any) => ({
      productId: item.productId,
      quantityReturned: 0,
      quantityDamaged: 0,
      quantityLost: 0
    }))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - ensure quantities don't exceed what was taken out
    const validItems = items.filter(item => {
      const originalItem = requisition.items.find((orig: any) => orig.productId === item.productId);
      const totalAccounted = item.quantityReturned + item.quantityDamaged + item.quantityLost;
      return totalAccounted > 0 && totalAccounted <= originalItem.quantityOut;
    });

    if (validItems.length < 0) {
      alert('Please specify return quantities for at least one item');
      return;
    }

    onSubmit({
      items: validItems,
      notes: notes.trim() || undefined
    });
  };

  const updateItem = (index: number, field: keyof ReturnItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: Math.max(0, value) };
    setItems(newItems);
  };

  const getOriginalQuantity = (productId: string) => {
    const originalItem = requisition.items.find((item: any) => item.productId === productId);
    return originalItem?.quantityOut || 0;
  };

  const getProductName = (productId: string) => {
    const originalItem = requisition.items.find((item: any) => item.productId === productId);
    return originalItem?.product?.name || 'Unknown Product';
  };

  const getTotalAccounted = (item: ReturnItem) => {
    return item.quantityReturned + item.quantityDamaged + item.quantityLost;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
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
                Process Return - {requisition.destination}
              </h3>
              
              <div className="p-3 mb-4 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  <strong>Requested by:</strong> {requisition.requester.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(requisition.requestDate).toLocaleDateString()}
                </p>
                {requisition.purpose && (
                  <p className="text-sm text-gray-600">
                    <strong>Purpose:</strong> {requisition.purpose}
                  </p>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Items */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Return Details for Each Item
                  </label>
                  
                  <div className="space-y-3 overflow-y-auto max-h-96">
                    {items.map((item, index) => {
                      const originalQty = getOriginalQuantity(item.productId);
                      const totalAccounted = getTotalAccounted(item);
                      const remaining = originalQty - totalAccounted;
                      
                      return (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {getProductName(item.productId)}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Taken out: {originalQty}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block mb-1 text-xs font-medium text-gray-700">
                                Returned (Good)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={item.quantityReturned}
                                onChange={(e) => updateItem(index, 'quantityReturned', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            
                            <div>
                              <label className="block mb-1 text-xs font-medium text-gray-700">
                                Damaged
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={item.quantityDamaged}
                                onChange={(e) => updateItem(index, 'quantityDamaged', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            
                            <div>
                              <label className="block mb-1 text-xs font-medium text-gray-700">
                                Lost
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={item.quantityLost}
                                onChange={(e) => updateItem(index, 'quantityLost', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs">
                            <span className={`${remaining === 0 ? 'text-green-600' : remaining < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                              Accounted for: {totalAccounted} / {originalQty}
                              {remaining > 0 && ` (${remaining} remaining)`}
                              {remaining < 0 && ` (${Math.abs(remaining)} over limit)`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Any additional notes about the return..."
                  />
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
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Process Return'}
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

export default ReturnForm;
