import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';

const ProcurementHistoryTable: React.FC = () => {
  const { token } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['allPurchaseOrders'],
    queryFn: async () => {
      const res = await fetch('/api/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch purchase orders');
      return res.json();
    }
  });
  const orders = data?.orders || [];

  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="p-4 text-gray-500">Loading procurement history...</div>
      ) : orders.length === 0 ? (
        <div className="p-4 text-gray-600 border rounded-md bg-gray-50">No purchase orders found.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Expected Delivery</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Created At</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((po: any) => (
              <tr key={po.id}>
                <td className="px-6 py-4 whitespace-nowrap">{po.supplier?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{po.product?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{po.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{po.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(po.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {po.status === 'pending' ? (
                    <button
                      className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/purchase-orders/${po.id}/confirm-delivery`, {
                            method: 'PUT',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error('Failed to update status');
                          window.location.reload();
                        } catch (err) {
                          alert('Failed to update status');
                        }
                      }}
                    >Confirm Delivery</button>
                  ) : (
                    <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProcurementHistoryTable;
