import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

export interface SupplierOption {
  id: string;
  name: string;
}

interface SupplierSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SupplierSelect: React.FC<SupplierSelectProps> = ({ value, onChange }) => {
  const { token } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['supplierOptions'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const result = await res.json();
      return result.suppliers || [];
    }
  });
  return (
    <select
      name="supplier"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
      disabled={isLoading}
    >
      <option value="">Select Supplier</option>
      {data?.map((s: SupplierOption) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
};

export default SupplierSelect;
