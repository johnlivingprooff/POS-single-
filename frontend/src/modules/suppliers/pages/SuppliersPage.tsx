import React, { useState } from 'react';
import ProcurementHistoryTable from '../components/ProcurementHistoryTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import SupplierForm from '../../../components/SupplierForm';
import Modal from '../../../components/Modal';
import PurchaseOrderForm from '../../../components/PurchaseOrderForm';

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: any[];
}

const SuppliersPage: React.FC = () => {
  const { token } = useAuthStore();
  const { showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'procurement'>('suppliers');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    }
  });
  const suppliers: Supplier[] = data?.suppliers || [];
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const method = editSupplier ? 'PUT' : 'POST';
      const url = editSupplier ? `/api/suppliers/${editSupplier.id}` : '/api/suppliers';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save supplier');
      return res.json();
    },
    onSuccess: () => {
      showToast(editSupplier ? 'Supplier updated!' : 'Supplier added!', 'success');
      setShowForm(false);
      setEditSupplier(null);
      queryClient.invalidateQueries(['suppliers']);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save supplier', 'error');
    }
  });
  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setShowForm(true);
  };
  // Handle add
  const handleAdd = () => {
    setEditSupplier(null);
    setShowForm(true);
  };
  // Handle deactivate
  const handleDeactivate = async (id: string) => {
    if (window.confirm('Deactivate this supplier?')) {
      try {
        const res = await fetch(`/api/suppliers/${id}/deactivate`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to deactivate supplier');
        showToast('Supplier deactivated!', 'success');
        queryClient.invalidateQueries(['suppliers']);
      } catch (err: any) {
        showToast(err.message || 'Failed to deactivate supplier', 'error');
      }
    }
  };
  // Handle reactivate
  const handleReactivate = async (id: string) => {
    if (window.confirm('Reactivate this supplier?')) {
      try {
        const res = await fetch(`/api/suppliers/${id}/activate`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to reactivate supplier');
        showToast('Supplier reactivated!', 'success');
        queryClient.invalidateQueries(['suppliers']);
      } catch (err: any) {
        showToast(err.message || 'Failed to reactivate supplier', 'error');
      }
    }
  };

    const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false);

    const purchaseOrderMutation = useMutation({
        mutationFn: async (form: any) => {
            const res = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Failed to create purchase order');
            return res.json();
        },
        onSuccess: () => {
            showToast('Purchase order created!', 'success');
            setShowPurchaseOrderForm(false);
            queryClient.invalidateQueries(['procurementHistory']);
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to create purchase order', 'error');
        }
    });

    function handleCreatePurchaseOrder(form: any) {
        purchaseOrderMutation.mutate(form);
    }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          {activeTab === 'suppliers' ? 'Suppliers' : 'Procurement'} Management
        </h1>
        <div className="flex pb-2 mb-8 space-x-4 border-b">
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'suppliers' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Suppliers
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'procurement' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('procurement')}
          >
            Procurement
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-8 min-h-[500px]">
          {activeTab === 'suppliers' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Suppliers</h2>
                <button
                  onClick={handleAdd}
                  className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Supplier
                </button>
                <Modal open={showForm} onClose={() => { setShowForm(false); setEditSupplier(null); }} title={editSupplier ? 'Edit Supplier' : 'Add Supplier'}>
                  <div className="max-h-[calc(100vh-100px)] overflow-y-auto p-2">
                    <SupplierForm
                      initialValues={editSupplier || undefined}
                      onSubmit={form => mutation.mutate(form)}
                      onCancel={() => { setShowForm(false); setEditSupplier(null); }}
                      loading={mutation.isLoading}
                    />
                  </div>
                </Modal>
              </div>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 p-4 bg-white border rounded-lg shadow-sm">
                  <div className="text-lg font-semibold text-gray-700">Active Suppliers</div>
                  <div className="text-2xl font-bold text-primary">{suppliers.filter(s => s.isActive).length}</div>
                </div>
                <div className="flex-1 p-4 bg-white border rounded-lg shadow-sm">
                  <div className="text-lg font-semibold text-gray-700">Inactive Suppliers</div>
                  <div className="text-2xl font-bold text-primary">{suppliers.filter(s => !s.isActive).length}</div>
                </div>
              </div>
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search suppliers by name, contact, or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
                </div>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-full h-10 mb-2 bg-gray-200 rounded" />
                      ))}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Address</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Products</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers
                          .filter(supplier =>
                            supplier.name.toLowerCase().includes(search.toLowerCase()) ||
                            (supplier.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
                            (supplier.email || '').toLowerCase().includes(search.toLowerCase())
                          )
                          .map(supplier => (
                          <tr key={supplier.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="w-8 h-8 mr-3 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    <button
                                        className="text-blue-600 underline hover:text-blue-800"
                                        onClick={() => navigate(`/suppliers/${supplier.id}`)}
                                        title="View supplier details"
                                    >
                                        {supplier.name}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{supplier.contactName}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{supplier.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{supplier.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{supplier.address}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              {supplier.products?.length || 0}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button 
                                  className="text-blue-600 hover:text-blue-900" 
                                  onClick={() => handleEdit(supplier)}
                                  title="Edit Supplier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {supplier.isActive ? (
                                    <button
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => handleDeactivate(supplier.id)}
                                        title="Deactivate supplier"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        className="text-green-600 hover:text-green-900"
                                        onClick={() => handleReactivate(supplier.id)}
                                        title="Reactivate supplier"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
          {activeTab === 'procurement' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Procurement</h2>
                <button
                  className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowPurchaseOrderForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Purchase Order
                </button>
                <Modal
                  open={showPurchaseOrderForm}
                  onClose={() => setShowPurchaseOrderForm(false)}
                  title="Create Purchase Order"
                >
                  <div className="max-h-[calc(100vh-100px)] overflow-y-auto p-2">
                    <PurchaseOrderForm
                      onSubmit={form => handleCreatePurchaseOrder(form)}
                      onCancel={() => setShowPurchaseOrderForm(false)}
                      loading={purchaseOrderMutation.isLoading}
                    />
                  </div>
                </Modal>
              </div>
              <ProcurementHistoryTable />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuppliersPage;
