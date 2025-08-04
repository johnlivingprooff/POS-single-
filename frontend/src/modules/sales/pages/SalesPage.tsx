import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { Eye, Printer, Edit } from 'lucide-react';
import { generateReceiptPDF } from '../../../components/ReceiptPDF';
import SaleViewModal from '../../../components/SaleViewModal';
import SaleEditModal from '../../../components/SaleEditModal';
import { useAppToast } from '../../../hooks/useAppToast';
import TableSkeleton from '../../../components/TableSkeleton';

const SalesPage: React.FC = () => {
  const [viewSale, setViewSale] = React.useState<any>(null);
  const [editSale, setEditSale] = React.useState<any>(null);
  const [editLoading, setEditLoading] = React.useState(false);
  const { showToast } = useAppToast();

  const handleEditSave = async (updatedSale: any) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/sales/${updatedSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedSale)
      });
      if (!res.ok) throw new Error('Failed to update sale');
      showToast('Sale updated successfully!', 'success');
      setEditSale(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update sale', 'error');
    } finally {
      setEditLoading(false);
    }
  };
  const { token, user } = useAuthStore();
  const {
    data: salesData,
    isLoading: salesLoading,
    isError: salesError
  } = useQuery({
    queryKey: ['salesRecords'],
    queryFn: async () => {
      const res = await fetch(`/api/sales?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch sales records');
      return res.json();
    }
  });
  const sales = salesData?.sales || [];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Sales Records</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {salesLoading ? (
          <TableSkeleton 
            rows={8} 
            columns={7} 
            actions={true}
            headerWidths={['w-24', 'w-32', 'w-24', 'w-20', 'w-24', 'w-20', 'w-28']}
            cellWidths={['w-20', 'w-28', 'w-20', 'w-16', 'w-20', 'w-16', 'w-24']}
          />
        ) : salesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">Failed to load sales records</div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-primary hover:text-primary/80 text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale: any) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.saleNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.user?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof sale.total === 'number' ? sale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.paymentMethod}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        title="Print Receipt"
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => generateReceiptPDF({
                          cart: sale.items || [],
                          customerName: sale.customer?.name || '-',
                          total: sale.total,
                          saleId: sale.id
                        })}
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        title="View Sale"
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => setViewSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                          title="Edit Sale"
                          className="p-2 rounded hover:bg-gray-100"
                          onClick={() => setEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
      {/* Sale View Modal */}
      <SaleViewModal open={!!viewSale} onClose={() => setViewSale(null)} sale={viewSale} />
      {/* Sale Edit Modal (admin/manager only) */}
      <SaleEditModal open={!!editSale} onClose={() => setEditSale(null)} sale={editSale} onSave={handleEditSave} loading={editLoading} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
