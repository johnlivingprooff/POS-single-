import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';
import { apiFetch } from '../../../lib/api-utils';
import {
  PlusIcon,
  MapPinIcon,
  TruckIcon,
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  X
} from 'lucide-react';
import RequisitionForm from '../components/RequisitionForm';
import ReturnForm from '../components/ReturnForm';

const OffsitePage: React.FC = () => {
  const { token, user } = useAuthStore();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'requisitions' | 'returns'>('overview');
  const [showRequisitionForm, setShowRequisitionForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [viewRequisition, setViewRequisition] = useState<any>(null);
  const [editRequisition, setEditRequisition] = useState<any>(null);

  // Role-based access controls
  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const canCreateAndEdit = true; // All roles can create and edit their own requisitions

  // Fetch off-site requisitions
  const {
    data: requisitions,
    isLoading: requisitionsLoading,
    isError: requisitionsError
  } = useQuery({
    queryKey: ['offsiteRequisitions'],
    queryFn: async () => {
      const res = await apiFetch('/offsite/requisitions', token);
      if (!res.ok) throw new Error('Failed to fetch requisitions');
      return res.json();
    }
  });

  // Fetch summary statistics
  const { data: summary } = useQuery({
    queryKey: ['offsiteSummary'],
    queryFn: async () => {
      const res = await apiFetch('/offsite/summary', token);
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    }
  });

  // Create requisition mutation
  const createRequisitionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch('/offsite/requisitions', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create requisition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offsiteRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['offsiteSummary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowRequisitionForm(false);
      showToast('Requisition created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create requisition', 'error');
    }
  });

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: async ({ requisitionId, data }: { requisitionId: string; data: any }) => {
      const res = await fetch(`/api/offsite/requisitions/${requisitionId}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create return');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offsiteRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['offsiteSummary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowReturnForm(false);
      setSelectedRequisition(null);
      showToast('Return processed successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to process return', 'error');
    }
  });

  // Approve requisition mutation
  const approveRequisitionMutation = useMutation({
    mutationFn: async (requisitionId: string) => {
      const res = await fetch(`/api/offsite/requisitions/${requisitionId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve requisition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offsiteRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['offsiteSummary'] });
      showToast('Requisition approved successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to approve requisition', 'error');
    }
  });

  // Reject requisition mutation
  const rejectRequisitionMutation = useMutation({
    mutationFn: async (requisitionId: string) => {
      const res = await fetch(`/api/offsite/requisitions/${requisitionId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject requisition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offsiteRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['offsiteSummary'] });
      showToast('Requisition rejected successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject requisition', 'error');
    }
  });

  // Update requisition mutation
  const updateRequisitionMutation = useMutation({
    mutationFn: async ({ requisitionId, data }: { requisitionId: string; data: any }) => {
      const res = await fetch(`/api/offsite/requisitions/${requisitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update requisition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offsiteRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['offsiteSummary'] });
      setEditRequisition(null);
      showToast('Requisition updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update requisition', 'error');
    }
  });

  const handleCreateRequisition = (data: any) => {
    createRequisitionMutation.mutate(data);
  };

  const handleCreateReturn = (data: any) => {
    if (selectedRequisition) {
      createReturnMutation.mutate({
        requisitionId: selectedRequisition.id,
        data
      });
    }
  };

  const handleApproveRequisition = (requisitionId: string) => {
    if (window.confirm('Are you sure you want to approve this requisition?')) {
      approveRequisitionMutation.mutate(requisitionId);
    }
  };

  const handleRejectRequisition = (requisitionId: string) => {
    if (window.confirm('Are you sure you want to reject this requisition?')) {
      rejectRequisitionMutation.mutate(requisitionId);
    }
  };

  const handleUpdateRequisition = (data: any) => {
    if (editRequisition) {
      updateRequisitionMutation.mutate({
        requisitionId: editRequisition.id,
        data
      });
    }
  };

  const canEditRequisition = (requisition: any) => {
    // Users can edit their own pending requisitions, admins/managers can edit any pending requisition
    return requisition.status === 'pending' && 
           (requisition.requesterId === user?.id || canApprove);
  };

  const handleViewRequisition = (requisition: any) => {
    setViewRequisition(requisition);
  };

  const handleEditRequisition = (requisition: any) => {
    setEditRequisition(requisition);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'dispatched':
        return <TruckIcon className="w-4 h-4 text-blue-500" />;
      case 'returned':
        return <ArrowRightIcon className="w-4 h-4 text-gray-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (requisitionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (requisitionsError) {
    return (
      <div className="py-12 text-center">
        <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">Error Loading Off-Site Inventory</h3>
        <p className="text-gray-500">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Off-Site Inventory</h1>
          <p className="mt-2 text-gray-600">Manage field requisitions and returns</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowRequisitionForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-dark"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Requisition
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PackageIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Requisitions</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary?.totalRequisitions || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary?.pendingRequisitions || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active (Out)</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary?.activeRequisitions || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowRightIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Returns</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary?.totalReturns || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', name: 'Recent Activity' },
              { id: 'requisitions', name: 'All Requisitions' },
              { id: 'returns', name: 'Returns History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Requisitions</h3>
              <div className="space-y-3">
                {(requisitions || []).slice(0, 5).map((req: any) => (
                  <div key={req.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{req.destination}</p>
                          <p className="text-xs text-gray-500">by {req.requester.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                          {getStatusIcon(req.status)}
                          <span className="ml-1">{req.status.toUpperCase()}</span>
                        </span>
                        {(req.status === 'approved' || req.status === 'dispatched') && (
                          <button
                            onClick={() => {
                              setSelectedRequisition(req);
                              setShowReturnForm(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Process Return
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">{req.items.length} items</p>
                      {req.purpose && <p className="text-xs text-gray-500">{req.purpose}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requisitions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">All Requisitions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Destination</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Requester</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(requisitions || []).map((req: any) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(req.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{req.destination}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{req.requester.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{req.items.length} items</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                            {getStatusIcon(req.status)}
                            <span className="ml-1">{req.status.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* View Action - Available for all */}
                            <button
                              onClick={() => handleViewRequisition(req)}
                              className="p-1 text-blue-600 rounded hover:text-blue-800"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {/* Edit Action - Available for own pending requisitions or admin/manager */}
                            {canEditRequisition(req) && (
                              <button
                                onClick={() => handleEditRequisition(req)}
                                className="p-1 text-indigo-600 rounded hover:text-indigo-800"
                                title="Edit Requisition"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* Approve Action - Only for admin/manager on pending requisitions */}
                            {canApprove && req.status === 'pending' && (
                              <button
                                onClick={() => handleApproveRequisition(req.id)}
                                className="p-1 text-green-600 rounded hover:text-green-800"
                                title="Approve Requisition"
                                disabled={approveRequisitionMutation.isPending}
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reject Action - Only for admin/manager on pending requisitions */}
                            {canApprove && req.status === 'pending' && (
                              <button
                                onClick={() => handleRejectRequisition(req.id)}
                                className="p-1 text-red-600 rounded hover:text-red-800"
                                title="Reject Requisition"
                                disabled={rejectRequisitionMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {/* Process Return Action - For approved/dispatched requisitions */}
                            {(req.status === 'approved' || req.status === 'dispatched') && (
                              <button
                                onClick={() => {
                                  setSelectedRequisition(req);
                                  setShowReturnForm(true);
                                }}
                                className="p-1 text-orange-600 rounded hover:text-orange-800"
                                title="Process Return"
                              >
                                <ArrowRightIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Returns History</h3>
              <div className="space-y-3">
                {(requisitions || [])
                  .filter((req: any) => req.returns && req.returns.length > 0)
                  .map((req: any) => (
                    <div key={req.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{req.destination}</p>
                          <p className="text-sm text-gray-500">Requested by {req.requester.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{req.returns.length} return(s) processed</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {req.returns.map((ret: any) => (
                          <div key={ret.id} className="p-2 rounded bg-gray-50">
                            <p className="text-xs text-gray-600">
                              Returned on {new Date(ret.returnDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">{ret.items.length} items returned</p>
                            {ret.notes && <p className="text-xs text-gray-500">Note: {ret.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRequisitionForm && (
        <RequisitionForm
          onSubmit={handleCreateRequisition}
          onCancel={() => setShowRequisitionForm(false)}
          loading={createRequisitionMutation.isPending}
        />
      )}

      {showReturnForm && selectedRequisition && (
        <ReturnForm
          requisition={selectedRequisition}
          onSubmit={handleCreateReturn}
          onCancel={() => {
            setShowReturnForm(false);
            setSelectedRequisition(null);
          }}
          loading={createReturnMutation.isPending}
        />
      )}

      {/* View Requisition Modal */}
      {viewRequisition && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Requisition Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Destination:</p>
                  <p className="text-sm text-gray-900">{viewRequisition.destination}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Requester:</p>
                  <p className="text-sm text-gray-900">{viewRequisition.requester?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Request Date:</p>
                  <p className="text-sm text-gray-900">{new Date(viewRequisition.requestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewRequisition.status)}`}>
                    {getStatusIcon(viewRequisition.status)}
                    <span className="ml-1">{viewRequisition.status.toUpperCase()}</span>
                  </span>
                </div>
                {viewRequisition.purpose && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Purpose:</p>
                    <p className="text-sm text-gray-900">{viewRequisition.purpose}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Items:</p>
                  <div className="mt-2 space-y-2">
                    {viewRequisition.items?.map((item: any, index: number) => (
                      <div key={index} className="p-2 rounded bg-gray-50">
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewRequisition(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requisition Modal */}
      {editRequisition && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative max-w-md p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Edit Requisition</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <input
                    type="text"
                    value={editRequisition.destination}
                    onChange={(e) => setEditRequisition({...editRequisition, destination: e.target.value})}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <textarea
                    value={editRequisition.purpose || ''}
                    onChange={(e) => setEditRequisition({...editRequisition, purpose: e.target.value})}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Items (view only):</p>
                  <div className="mt-2 space-y-2">
                    {editRequisition.items?.map((item: any, index: number) => (
                      <div key={index} className="p-2 rounded bg-gray-50">
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setEditRequisition(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateRequisition(editRequisition);
                    setEditRequisition(null);
                  }}
                  disabled={updateRequisitionMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateRequisitionMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffsitePage;
