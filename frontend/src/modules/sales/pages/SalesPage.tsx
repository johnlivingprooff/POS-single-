import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { Eye, Printer, Edit } from 'lucide-react';
import { downloadReceipt, ReceiptData } from '../../../utils/receiptFormatter';
import SaleViewModal from '../../../components/SaleViewModal';
import SaleEditModal from '../../../components/SaleEditModal';
import { apiFetch } from '../../../lib/api-utils';
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
      const res = await apiFetch(`/sales/${updatedSale.id}`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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

  const handlePrintReceipt = (sale: any) => {
    try {
      // Transform sale data to ReceiptData format
      const receiptData: ReceiptData = {
        companyName: 'Habicore POS',
        address: '123 Business Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        saleNumber: sale.saleNumber,
        date: new Date(sale.createdAt).toLocaleDateString(),
        customerName: sale.customer?.name || 'Walk-in Customer',
        items: sale.items?.map((item: any) => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity || 1,
          // CHANGED: For direct sales-from-inventory model, price equals costPrice
          price: Number(item.unitPrice) || 0,  // This now represents costPrice
          costPrice: Number(item.unitPrice) || 0, // Same as price in this business model
          total: Number(item.total) || 0 // Use the pre-calculated total from the database
        })) || [],
        subtotal: Number(sale.subtotal) || 0,
        tax: Number(sale.tax) || 0,
        discount: Number(sale.discount) || 0,
        total: Number(sale.total) || 0,
        paymentMethod: sale.paymentMethod || 'Cash',
        currency: 'USD', // Default to USD, you can make this configurable
        currencySymbol: '$'
      };

      // Generate and download the receipt
      downloadReceipt(receiptData, 'A4', true);
      showToast('Receipt generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating receipt:', error);
      showToast('Failed to generate receipt', 'error');
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
      const res = await apiFetch(`/sales?limit=100`, token);
      if (!res.ok) throw new Error('Failed to fetch sales records');
      return res.json();
    }
  });
  const sales = salesData?.sales || [];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Sales Records</h1>
      <div className="p-6 bg-white border rounded-lg shadow-sm">
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
              <div className="mb-2 text-red-500">Failed to load sales records</div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-primary hover:text-primary/80"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Sale #</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale: any) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{sale.saleNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{sale.customer?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{sale.user?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{typeof sale.total === 'number' ? sale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{sale.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{sale.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        title="Print Receipt"
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => handlePrintReceipt(sale)}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        title="View Sale"
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => setViewSale(sale)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                          title="Edit Sale"
                          className="p-2 rounded hover:bg-gray-100"
                          onClick={() => setEditSale(sale)}
                        >
                          <Edit className="w-4 h-4" />
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
