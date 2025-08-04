import { Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api-utils';

// Utility to find finished good name by productId
function getFinishedGoodName(productId: string, products: any[]): string {
  if (!productId) return '-';
  const p = products.find((x: any) => x.id === productId);
  return p ? `${p.name || p.sku || p.id}` : productId;
}
// --- Utility functions ---
function fetchProducts(token: string) {
  return apiFetch('/products?stockType=finished_good', token).then(res => {
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  });
}

function createOrder({ productId, quantity, notes, token }: { productId: string, quantity: number, notes?: string, token: string }) {
  return apiFetch('/manufacturing/orders', token, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, notes })
  }).then(res => {
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  });
}
// --- Utility function: updateOrderStatus ---
function updateOrderStatus({ id, status, token }: { id: string, status: string, token: string }) {
  return fetch(`/api/manufacturing/orders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  }).then(res => {
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  });
}

// --- Utility function: completeOrder ---
function completeOrder({ id, token }: { id: string, token: string }) {
  return fetch(`/api/manufacturing/orders/${id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to complete order');
    return res.json();
  });
}

// --- Types ---
type CreateOrderModalProps = {
  token: string;
  onClose: () => void;
  onCreated: () => void;
};

// --- CreateOrderModal ---
const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ token, onClose, onCreated }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery(['finishedGoods', token], () => fetchProducts(token));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedProduct) {
      setFormError('Please select a product');
      return;
    }
    if (!quantity || quantity <= 0) {
      setFormError('Quantity must be positive');
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({ productId: selectedProduct, quantity, notes, token });
      onCreated();
    } catch (e: any) {
      setFormError(e.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h3 className="mb-4 text-lg font-bold">Create Production Order</h3>
        {productsLoading ? (
          <div>Loading products...</div>
        ) : productsError ? (
          <div className="text-red-500">Failed to load products</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Finished Good</label>
              <select
                className="w-full px-2 py-1 border rounded"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                required
              >
                <option value="">Select product</option>
                {productsData?.products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                    {p.measurementType && p.measurementValue ? ` - ${p.measurementValue} ${p.measurementType}${p.measurementValue > 1 ? 's' : ''} per pack` : ''}
                  </option>
                ))}
              </select>
            </div>
            {/* Show measurement info and available units for selected product */}
            {selectedProduct && (() => {
              const p = productsData?.products?.find((x: any) => x.id === selectedProduct);
              if (!p) return null;
              const measurement = p.measurementType && p.measurementValue ? `${p.measurementValue} ${p.measurementType}${p.measurementValue > 1 ? 's' : ''} per ${p.measurementType}` : '';
              const available = p.measurementType && p.measurementValue ? `${p.stock * p.measurementValue} ${p.measurementType}${(p.stock * p.measurementValue) > 1 ? 's' : ''} (${p.stock} packs)` : `${p.stock} units`;
              return (
                <div className="mt-1 text-xs text-blue-700">
                  {measurement && <span className="mr-2">{measurement}</span>}
                  <span>Available: {available}</span>
                </div>
              );
            })()}
            <div>
              <label className="block mb-1 font-medium">Quantity to Manufacture</label>
              <input
                type="number"
                className="w-full px-2 py-1 border rounded"
                value={quantity}
                min={1}
                step={1}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Notes</label>
              <textarea
                className="w-full px-2 py-1 border rounded"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {formError && <div className="text-sm text-red-500">{formError}</div>}
            <div className="flex justify-end space-x-2">
              <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="px-4 py-2 text-white rounded bg-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


import React, { useState, FC, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import LoadingSpinner from '../../../components/LoadingSpinner';
import TableSkeleton from '../../../components/TableSkeleton';

// --- Utility functions ---
function fetchOrders(token: string) {
  return apiFetch('/manufacturing/orders', token).then(async res => {
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    // Ensure each order has product details (name, sku)
    if (Array.isArray(data.orders)) {
      data.orders = data.orders.map((order: any) => {
        if (!order.product && order.productId && Array.isArray(data.products)) {
          order.product = data.products.find((p: any) => p.id === order.productId) || {};
        }
        return order;
      });
    }
    return data;
  });
}

export default function ProductionOrdersTable() {
  const token = useAuthStore(state => state.token);
  const queryClient = useQueryClient();
  // Guard: if token is null, render nothing (or a loading/error state)
  if (!token) return <div className="text-red-500">Not authenticated</div>;

  // Fetch finished goods for lookup
  const { data: productsData } = useQuery(['finishedGoods', token], () => fetchProducts(token));
  const finishedGoods = productsData?.products || [];

  const { data, isLoading, error } = useQuery(['manufacturingOrders', token], () => fetchOrders(token));

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // orderId being acted on

  // Modal state for viewing order details
  const [viewOrder, setViewOrder] = useState<any>(null);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Production Orders</h2>
        <button className="px-4 py-2 text-white rounded bg-primary" onClick={() => setShowCreate(true)}>
          + Create Order
        </button>
      </div>
      {isLoading ? (
        <TableSkeleton 
          rows={6} 
          columns={6} 
          actions={true}
          headerWidths={['w-24', 'w-32', 'w-20', 'w-24', 'w-28', 'w-20']}
          cellWidths={['w-20', 'w-28', 'w-16', 'w-20', 'w-24', 'w-16']}
        />
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">Failed to load orders</div>
            <button 
              onClick={() => queryClient.invalidateQueries(['manufacturingOrders'])} 
              className="text-primary hover:text-primary/80 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="p-2 text-left">Order #</th>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((order: any) => {
              // Use productId to look up finished good name
              const finishedGoodName = getFinishedGoodName(order.productId, finishedGoods);
              return (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.orderNumber}</td>
                  <td className="p-2">{finishedGoodName}</td>
                  <td className="p-2">{order.quantity}</td>
                  <td className="p-2 capitalize">{order.status.replace('_', ' ')}</td>
                  <td className="p-2">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                        onClick={() => setViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Status change buttons */}
                      {order.status === 'pending' && (
                        <button
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          title="Start Production"
                          disabled={actionLoading === order.id + '-start'}
                          onClick={async () => {
                            setActionLoading(order.id + '-start');
                            try {
                              await updateOrderStatus({ id: order.id, status: 'in_progress', token });
                              queryClient.invalidateQueries(['manufacturingOrders', token]);
                            } catch (e: any) {
                              alert(`Failed to start production: ${e.message}`);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                        >
                          {actionLoading === order.id + '-start' ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <span className="text-xs">START</span>
                          )}
                        </button>
                      )}
                      
                      {order.status === 'in_progress' && (
                        <button
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          title="Reset to Pending"
                          disabled={actionLoading === order.id + '-reset'}
                          onClick={async () => {
                            setActionLoading(order.id + '-reset');
                            try {
                              await updateOrderStatus({ id: order.id, status: 'pending', token });
                              queryClient.invalidateQueries(['manufacturingOrders', token]);
                            } catch (e: any) {
                              alert(`Failed to reset status: ${e.message}`);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                        >
                          {actionLoading === order.id + '-reset' ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <span className="text-xs">RESET</span>
                          )}
                        </button>
                      )}

                      {/* Complete production button */}
                      {(order.status === 'pending' || order.status === 'in_progress') && (
                        <button
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Complete Production (will process inventory)"
                          disabled={actionLoading === order.id + '-complete'}
                          onClick={async () => {
                            if (!window.confirm(
                              `Complete production for ${getFinishedGoodName(order.productId, finishedGoods)}?\n\n` +
                              `This will:\n` +
                              `• Deduct raw materials from inventory\n` +
                              `• Add ${order.quantity} finished goods to stock\n` +
                              `• Mark the order as completed\n\n` +
                              `This action cannot be undone.`
                            )) return;
                            
                            setActionLoading(order.id + '-complete');
                            try {
                              await completeOrder({ id: order.id, token });
                              queryClient.invalidateQueries(['manufacturingOrders', token]);
                              queryClient.invalidateQueries(['products']);
                              queryClient.invalidateQueries(['inventory']);
                            } catch (e: any) {
                              alert(`Failed to complete order: ${e.message}`);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                        >
                          {actionLoading === order.id + '-complete' ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Cancel button */}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Cancel"
                          disabled={actionLoading === order.id + '-cancel'}
                          onClick={async () => {
                            setActionLoading(order.id + '-cancel');
                            try {
                              await updateOrderStatus({ id: order.id, status: 'cancelled', token });
                              queryClient.invalidateQueries(['manufacturingOrders', token]);
                            } catch (e: any) {
                              alert(`Failed to cancel order: ${e.message}`);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Delete button */}
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this order?')) return;
                          setActionLoading(order.id + '-delete');
                          try {
                            await fetch(`/api/manufacturing/orders/${order.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            queryClient.invalidateQueries(['manufacturingOrders', token]);
                          } catch (e) {
                            alert('Failed to delete order');
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        disabled={actionLoading === order.id + '-delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-full max-w-lg p-6 bg-white rounded shadow">
            <h3 className="mb-4 text-lg font-bold">Production Order Details</h3>
            <div className="mb-2"><b>Order #:</b> {viewOrder.orderNumber}</div>
            <div className="mb-2"><b>Product:</b> {getFinishedGoodName(viewOrder.productId, finishedGoods)}</div>
            <div className="mb-2"><b>Quantity:</b> {viewOrder.quantity}</div>
            <div className="mb-2"><b>Status:</b> {viewOrder.status.replace('_', ' ')}</div>
            <div className="mb-2"><b>Created:</b> {new Date(viewOrder.createdAt).toLocaleString()}</div>
            {viewOrder.notes && <div className="mb-2"><b>Notes:</b> {viewOrder.notes}</div>}
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && token && (
        <CreateOrderModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries(['manufacturingOrders', token]);
          }}
        />
      )}
    </div>
  );
}
