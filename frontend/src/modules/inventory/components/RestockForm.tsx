import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { usePostMutationRefresh } from '../../../hooks/useRealTimeRefresh';

export default function RestockForm({ productId, onClose, onSuccess }: { productId: string; onClose: () => void; onSuccess?: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Restock');
  const { token } = useAuthStore();
  const { refreshAfterMutation } = usePostMutationRefresh();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/inventory/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to restock');
      return res.json();
    },
    onSuccess: () => {
      // Trigger real-time refresh for inventory data
      refreshAfterMutation('inventory');
      if (onSuccess) onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ stock: quantity, reason });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form onSubmit={handleSubmit} className="w-full max-w-lg p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Restock Product</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            name="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            required
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <input
            name="reason"
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
          <button type="submit" disabled={mutation.isLoading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            {mutation.isLoading ? 'Restocking...' : 'Restock'}
          </button>
        </div>
        {mutation.isError && <div className="mt-2 text-red-500">{(mutation.error as Error).message}</div>}
      </form>
    </div>
  );
}
