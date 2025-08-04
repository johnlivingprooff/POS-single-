import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const SupplierDetailsPage: React.FC = () => {
  const { id } = useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  // Fetch purchase orders for supplier
  const { data: poData, isLoading: poLoading } = useQuery({
    queryKey: ['purchaseOrders', id],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders?supplierId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch purchase orders');
      return res.json();
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['supplierDetails', id],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch supplier details');
      return res.json();
    }
  });
  const supplier = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Details</h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          ← Back
        </button>
      </div>
      <div className="p-8 bg-white rounded-lg shadow min-h-[70vh]">
        <Suspense fallback={<div className="text-gray-500">Loading supplier details...</div>}>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-1/3 h-8 bg-gray-200 rounded" />
              <div className="w-1/4 h-4 bg-gray-200 rounded" />
              <div className="w-1/4 h-4 bg-gray-200 rounded" />
              <div className="w-1/4 h-4 bg-gray-200 rounded" />
              <div className="w-1/4 h-4 bg-gray-200 rounded" />
              <div className="w-1/6 h-6 bg-gray-200 rounded" />
              <div className="w-1/2 h-6 bg-gray-200 rounded" />
              <div className="w-full h-10 bg-gray-200 rounded" />
            </div>
          ) : supplier ? (
            <>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{supplier.name}</h2>
              <div className="mb-2 text-gray-700">Contact: {supplier.contactName}</div>
              <div className="mb-2 text-gray-700">Email: {supplier.email}</div>
              <div className="mb-2 text-gray-700">Phone: {supplier.phone}</div>
              <div className="mb-2 text-gray-700">Address: {supplier.address}</div>
              <div className="mb-6 text-gray-700">Products Supplied: {supplier.products?.length || 0}</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">Products</h3>
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplier.products?.map((product: any) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Procurement History table moved to SuppliersPage */}
            </>
          ) : (
            <p>Supplier not found.</p>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default SupplierDetailsPage;
