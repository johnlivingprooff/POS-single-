import React, { Suspense } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardSkeleton from '../../../components/skeletons/DashboardSkeleton';
import { useAppToast } from '../../../hooks/useAppToast';
import Modal from '../../../components/Modal';
import ProductForm from '../../../components/ProductForm';


const DashboardPage: React.FC = () => {
  const [showAddProductModal, setShowAddProductModal] = React.useState(false);
  const [addProductLoading, setAddProductLoading] = React.useState(false);
  const [currency, setCurrency] = React.useState<string>(''); 
  const handleAddProduct = async (data: any) => {
    setAddProductLoading(true);
    try {
      const res = await apiFetch('/products', token, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to add product');
      showToast('Product added successfully!', 'success');
      setShowAddProductModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      setAddProductLoading(false);
    }
  };
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const handleError = (msg: string) => showToast(msg, 'error');

  // Check if user can create products (admin and manager only)
  const canCreateProducts = user?.role === 'admin' || user?.role === 'manager';

  // Fetch sales stats (today)
  const {
    data: salesStats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrObj
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiFetch('/sales/stats/summary?period=today', token);
      if (!res.ok) {
        const errText = await res.text();
        const err = new Error(errText || 'Failed to fetch sales stats');
        // Attach status for error handling
        // @ts-ignore
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    onError: () => handleError('Failed to load sales stats.')
  });

  // Fetch recent transactions (limit 5)
  const {
    data: recentTxData,
    isLoading: txLoading,
    isError: txError,
    error: txErrObj
  } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const res = await apiFetch('/sales?limit=5', token);
      if (!res.ok) {
        const errText = await res.text();
        const err = new Error(errText || 'Failed to fetch transactions');
        // @ts-ignore
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    onError: () => handleError('Failed to load recent transactions.')
  });
  const recentTransactions = recentTxData?.sales || [];

  // Fetch inventory stats
  const {
    data: inventoryStats,
    isLoading: invLoading,
    isError: invError,
    error: invErrObj
  } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: async () => {
      const res = await apiFetch('/inventory/stats', token);
      if (!res.ok) {
        const errText = await res.text();
        const err = new Error(errText || 'Failed to fetch inventory stats');
        // @ts-ignore
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    onError: () => handleError('Failed to load inventory stats.')
  });

  // Fetch currency setting
  const { data: currencyData } = useQuery(['currency', token], async () => {
    if (!token) return null;
    const res = await apiFetch('/settings/currency', token);
    if (!res.ok) throw new Error('Failed to fetch currency');
    return res.json();
  }, {
    enabled: !!token,
    onSuccess: (data) => {
      if (data?.currency) {
        // Map currency codes to symbols
        const currencySymbols: Record<string, string> = {
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'JPY': '¥',
          'CNY': '¥',
          'INR': '₹'
        };
        setCurrency(currencySymbols[data.currency] || data.currency);
      }
    }
  });

  // Fetch total customers (pagination metadata)
  const {
    data: customersData,
    isLoading: custLoading,
    isError: custError,
    error: custErrObj
  } = useQuery({
    queryKey: ['totalCustomers'],
    queryFn: async () => {
      const res = await apiFetch('/customers?limit=1', token);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
    onError: () => handleError('Failed to load customer stats.')
  });
  const totalCustomers = customersData?.pagination?.total || 0;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Hello, {user?.name}</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading || invLoading || custLoading ? (
            <DashboardSkeleton />
          ) : statsError || invError || custError ? (
            <div className="col-span-4 py-8 text-center text-gray-500">
              {statsErrObj && (statsErrObj as any).status === 404
                ? 'Nothing found in the database.'
                : 'Failed to load stats.'}
            </div>
          ) : (
            <>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(typeof salesStats?.totalRevenue === 'number'
                        ? salesStats.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: currency })
                        : (Number(salesStats?.totalRevenue) ? Number(salesStats.totalRevenue).toLocaleString(undefined, { style: 'currency', currency: currency }) : '0.00'))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{salesStats?.totalSales || 0}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryStats?.lowStockProducts || 0}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Transactions</h2>
              {txLoading ? (
                <div className="py-8 text-center text-gray-500">Loading transactions...</div>
              ) : txError ? (
                <div className="py-8 text-center text-gray-500">
                  {txErrObj && (txErrObj as any).status === 404
                    ? 'Nothing found in the database.'
                    : 'Failed to load transactions.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions?.length === 0 ? (
                    <div className="text-gray-500">No recent transactions.</div>
                  ) : (
                    recentTransactions?.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.customer?.name || transaction.customerId || 'Walk-in Customer'}</p>
                            <p className="text-sm text-gray-300">
                            {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          {typeof transaction.total === 'number' ? transaction.total.toFixed(2) : (Number(transaction.total) ? Number(transaction.total).toFixed(2) : '0.00')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  className="w-full px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate('/pos')}
                >
                  Open POS Terminal
                </button>
                {/* {canCreateProducts && (
                  <button
                    className="w-full px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setShowAddProductModal(true)}
                  >
                    Add New Product
                  </button>
                )} */}
      {/* Modal for Add New Product */}
      {canCreateProducts && (
        <Modal open={showAddProductModal} onClose={() => setShowAddProductModal(false)} title="Add New Product">
          <ProductForm onSubmit={handleAddProduct} onCancel={() => setShowAddProductModal(false)} loading={addProductLoading} />
        </Modal>
      )}
                <button
                  className="w-full px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => navigate('/reports')}
                >
                  View Reports
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{inventoryStats?.lowStockProducts || 0} items are running low on stock</p>
                <p className="text-sm text-gray-600">
                  {inventoryStats?.pendingProcurements ?? 0} pending supplier orders{' '}
                  <button
                  className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                  onClick={() => navigate('/suppliers?tab=procurement')}
                  >
                  View
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}


export default DashboardPage;
