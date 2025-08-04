
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';

interface PurchaseOrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PurchaseOrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PurchaseOrderForm({ onSubmit, onCancel, loading }: PurchaseOrderFormProps) {
  const { token } = useAuthStore();
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [expectedDelivery, setExpectedDelivery] = useState(new Date().toISOString().split('T')[0]);
  const [autoConfirm, setAutoConfirm] = useState(false);

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    }
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      supplierId,
      productId,
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      autoConfirm: autoConfirm // Use the checkbox state
    };
    if (typeof onSubmit === 'function') onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Supplier</label>
        <select
          value={supplierId}
          onChange={e => setSupplierId(e.target.value)}
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select supplier...</option>
          {suppliers?.suppliers?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Product</label>
        <select
          value={productId}
          onChange={e => setProductId(e.target.value)}
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select product...</option>
          {products?.products?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          required
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cost Price</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={costPrice}
          onChange={e => setCostPrice(Number(e.target.value))}
          required
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
        <input
          type="date"
          value={expectedDelivery}
          onChange={e => setExpectedDelivery(e.target.value)}
          required
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={autoConfirm}
            onChange={e => setAutoConfirm(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Auto-confirm delivery (update inventory immediately)
            </span>
            <p className="mt-1 text-xs text-gray-600">
              {autoConfirm 
                ? "✅ Items will be marked as received and added to inventory immediately" 
                : "⏰ Order will be created as 'pending' - confirm delivery later to update inventory"
              }
            </p>
          </div>
        </label>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? 'Submitting...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
