import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SupplierSelect from './SupplierSelect';

interface CategoryOrSupplier {
  id: string;
  name: string;
}

interface ProductFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialValues?: Partial<{
    name: string;
    sku: string;
    costPrice: number;
    stock: number;
    category: CategoryOrSupplier | string | null;
    supplier: CategoryOrSupplier | string | null;
    reorderLevel: number;
    stockType: 'raw_material' | 'asset_equipment' | 'finished_good';
    pricingMethod: 'markup' | 'margin' | 'fixed';
    pricingOverride: boolean;
    measurementType: string;
    measurementValue: number;
  }>;
  isFinishedGood?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, onCancel, loading, initialValues, isFinishedGood }) => {
  // Determine if editing
  const isEdit = !!initialValues?.name;
  // Only restrict fields for raw_material edit
  const isEditRawMaterial = isEdit && (initialValues?.stockType === 'raw_material');

  // If finished good, show info and disable form
    const isFG = isFinishedGood || initialValues?.stockType === 'finished_good'; // This line remains unchanged
  // Fetch categories for dropdown
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });
  const categories = categoryData?.categories || [];
  // Helper to get id from value
  const getId = (val: CategoryOrSupplier | string | null | undefined) => {
    if (val && typeof val === 'object' && 'id' in val) {
      return val.id;
    }
    return typeof val === 'string' ? val : '';
  };

  const [form, setForm] = useState<{
    name: string;
    sku: string;
    costPrice?: number;
    stock: number;
    categoryId: string;
    supplierId: string;
    reorderLevel: number;
    stockType: 'raw_material' | 'asset_equipment'; // Remove 'finished_good' from allowed types
    pricingMethod: 'markup' | 'margin' | 'fixed';
    pricingOverride: boolean;
    measurementType: string;
    measurementValue: string | number;
  }>({
    name: initialValues?.name || '',
    sku: initialValues?.sku || '',
    costPrice: initialValues?.costPrice || 0,
    stock: initialValues?.stock || 0,
    categoryId: getId(initialValues?.category),
    supplierId: getId(initialValues?.supplier),
    reorderLevel: initialValues?.reorderLevel || 0,
        stockType: (initialValues?.stockType === 'finished_good') ? 'raw_material' : (initialValues?.stockType || 'raw_material'), // This line remains unchanged
    pricingMethod: initialValues?.pricingMethod || 'markup',
    pricingOverride: initialValues?.pricingOverride || false,
    measurementType: initialValues?.measurementType || '',
    measurementValue: initialValues?.measurementValue || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Map category and supplier to their respective ids
    if (name === 'categoryId' || name === 'supplierId') {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'pricingOverride') {
      setForm((prev) => ({ ...prev, pricingOverride: (e.target as HTMLInputElement).checked }));
    } else if (name === 'measurementValue') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: name === 'costPrice' || name === 'stock' || name === 'reorderLevel' ? Number(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
        if (isFG) return; // Prevent submit for finished goods
    let submitData = { ...form };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
            {isFG && (
        <div className="p-2 mb-2 text-xs text-red-700 rounded bg-red-50">
          <b>Direct creation of finished goods is disabled.</b><br />
          Please use the BOM workflow to create finished goods products. This form is for raw materials and assets only.
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" disabled={isFG} />
      </div>
            {!isFG && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Type</label>
          <select name="stockType" value={form.stockType} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
            <option value="raw_material">Raw Material</option>
            <option value="asset_equipment">Asset/Equipment</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">SKU</label>
        <input name="sku" value={form.sku} onChange={handleChange} required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" disabled={isEditRawMaterial} />
      </div>
      {!isEditRawMaterial && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            name="costPrice"
            type="number"
            value={form.costPrice}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
            disabled={isFG && !form.pricingOverride}
          />
          {isFG && (
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="pricingOverride" checked={!!form.pricingOverride} onChange={handleChange} />
              <label className="text-xs text-gray-700">Override backend-calculated price</label>
            </div>
          )}
        </div>
      )}
      {/* Pricing method and override are not used for raw materials; backend uses entered price directly */}
      {!isFG && !isEditRawMaterial && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              disabled={isEdit}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">Stock can only be updated via procurement or inventory adjustment.</p>
            )}
          </div>
          {/* Measurement fields for raw materials only */}
          {form.stockType === 'raw_material' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Measurement Type</label>
                <select
                  name="measurementType"
                  value={form.measurementType}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                >
                  <option value="">Select unit...</option>
                  <option value="grams">Grams (g)</option>
                  <option value="kilograms">Kilograms (kg)</option>
                  <option value="milliliters">Milliliters (ml)</option>
                  <option value="liters">Liters (l)</option>
                  <option value="units">Units (pcs)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Measurement Value</label>
                <input
                  name="measurementValue"
                  type="number"
                  value={form.measurementValue}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                  min={1}
                />
              </div>
            </div>
          )}
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          disabled={categoriesLoading}
        >
          <option value="">Select category...</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
            {!isFG && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <SupplierSelect value={form.supplierId} onChange={val => setForm(f => ({ ...f, supplierId: val }))} />
        </div>
      )}
            {!isFG && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
          <input name="reorderLevel" type="number" value={form.reorderLevel} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
