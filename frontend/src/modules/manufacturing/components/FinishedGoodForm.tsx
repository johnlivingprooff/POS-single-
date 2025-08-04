import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SupplierSelect from '../../../components/SupplierSelect';

interface CategoryOrSupplier {
  id: string;
  name: string;
}

interface FinishedGoodFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialValues?: Partial<{
    name: string;
    sku: string;
    category: CategoryOrSupplier | string | null;
    reorderLevel: number;
    pricingMethod: 'markup' | 'margin' | 'fixed';
    description: string;
    pricingOverride: boolean;
  }>;
}

const FinishedGoodForm: React.FC<FinishedGoodFormProps> = ({ onSubmit, onCancel, loading, initialValues }) => {
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
  const categories = categoryData?.categories || [];
  const getId = (val: CategoryOrSupplier | string | null | undefined) => {
    if (val && typeof val === 'object' && 'id' in val) {
      return val.id;
    }
    return typeof val === 'string' ? val : '';
  };
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    sku: initialValues?.sku || '',
    // price removed
    categoryId: getId(initialValues?.category),
    reorderLevel: initialValues?.reorderLevel || 0,
    pricingMethod: initialValues?.pricingMethod || 'markup',
    pricingOverride: initialValues?.pricingOverride || false,
    description: initialValues?.description || ''
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'categoryId' || name === 'supplierId') {
      setForm(prev => ({ ...prev, [name]: value }));
    } else if (name === 'pricingOverride') {
      setForm(prev => ({ ...prev, pricingOverride: (e.target as HTMLInputElement).checked }));
    } else if (name === 'measurementValue' || name === 'reorderLevel') {
      setForm(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let submitData = { ...form, stockType: 'finished_good' };
    onSubmit(submitData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">SKU</label>
        <input name="sku" value={form.sku} onChange={handleChange} required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select name="categoryId" value={form.categoryId} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" disabled={categoriesLoading}>
          <option value="">Select category...</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      {/* No supplier or measurement fields for finished goods */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" rows={2} />
      </div>
      {/* Price field removed: price is calculated and displayed in BOM modal only */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
        <input name="reorderLevel" type="number" value={form.reorderLevel} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default FinishedGoodForm;
