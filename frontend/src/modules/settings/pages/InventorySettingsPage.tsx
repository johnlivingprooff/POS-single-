import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';

const calculationOptions = [
  { value: 'fifo', label: 'FIFO (First In, First Out)' },
  { value: 'lifo', label: 'LIFO (Last In, First Out)' },
  { value: 'wac', label: 'Weighted Average Cost (WAC)' }
];

const InventorySettingsPage: React.FC = () => {
  const { token } = useAuthStore();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();

  // Fetch current setting
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryCalculationMethod'],
    queryFn: async () => {
      const res = await fetch('/api/settings/inventoryCalculationMethod', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    }
  });

  const currentMethod = data?.value || 'fifo';
  const [selectedMethod, setSelectedMethod] = useState(currentMethod);

  // Update setting
  const mutation = useMutation({
    mutationFn: async (method: string) => {
      const res = await fetch('/api/settings/inventoryCalculationMethod', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value: method })
      });
      if (!res.ok) throw new Error('Failed to update setting');
      return res.json();
    },
    onSuccess: () => {
      showToast('Calculation method updated!', 'success');
      queryClient.invalidateQueries(['inventoryCalculationMethod']);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update setting', 'error');
    }
  });

  const handleSave = () => {
    mutation.mutate(selectedMethod);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Inventory Calculation Settings</h1>
      <label className="block mb-2 text-sm font-medium text-gray-700">Calculation Method</label>
      <select
        value={selectedMethod}
        onChange={e => setSelectedMethod(e.target.value)}
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md"
      >
        {calculationOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={mutation.isLoading}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {mutation.isLoading ? 'Saving...' : 'Save'}
      </button>
      {isLoading && <p className="mt-4 text-gray-500">Loading current setting...</p>}
    </div>
  );
};

export default InventorySettingsPage;
