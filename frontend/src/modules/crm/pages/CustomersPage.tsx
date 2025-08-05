import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';

const CustomersPage: React.FC = () => {
  const { token } = useAuthStore();
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    isError: customersError 
  } = useQuery({
    queryKey: ['crmCustomers'],
    queryFn: async () => {
      const res = await apiFetch(`/customers?limit=100`, token);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    }
  });
  const customers = customersData?.customers || [];
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {customersLoading ? (
          <p className="text-gray-500">Loading customers...</p>
        ) : customersError ? (
          <p className="text-red-500">Failed to load customers.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer: any) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
