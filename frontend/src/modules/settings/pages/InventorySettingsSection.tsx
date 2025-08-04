import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';

const calculationOptions = [
  { value: 'fifo', label: 'FIFO (First In, First Out)' },
  { value: 'lifo', label: 'LIFO (Last In, First Out)' },
  { value: 'wac', label: 'Weighted Average Cost (WAC)' }
];

const roundingOptions = [
  { value: 'nearest_cent', label: 'Nearest Cent' },
  { value: 'end_in_99', label: 'End in .99' },
  { value: 'round_to_5', label: 'Round to 5' }
];

const InventorySettingsSection: React.FC = () => {
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
  // Rounding rule state (could fetch from backend if available)
  const [roundingRule, setRoundingRule] = useState('nearest_cent');

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
    // Extend to send roundingRule if backend supports
    mutation.mutate(selectedMethod);
  };

  return (
    <div className="w-full mt-4">
      <h2 className="mb-8 text-2xl font-semibold text-gray-800">Inventory Settings</h2>
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
        <div>
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
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Rounding Rule</label>
          <select
            value={roundingRule}
            onChange={e => setRoundingRule(e.target.value)}
            className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md"
          >
            {roundingOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={mutation.isLoading}
        className="px-6 py-2 mt-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {mutation.isLoading ? 'Saving...' : 'Save'}
      </button>
      {isLoading && <p className="mt-4 text-gray-500">Loading current setting...</p>}
    </div>
  );
};

export default InventorySettingsSection;
