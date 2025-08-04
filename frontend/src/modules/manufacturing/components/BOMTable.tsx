import React, { useState, useEffect } from 'react';
import { useAppToast } from '../../../hooks/useAppToast';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import TableSkeleton from '../../../components/TableSkeleton';
import FormSkeleton from '../../../components/FormSkeleton';
import { Search, Package, Plus, Edit, Trash2 } from 'lucide-react';
// Removed FinishedGoodForm; finished good fields will be inlined below
// Fetch products for finished goods/raw materials
function fetchProducts(token: any, stockType?: string) {
  let url = '/api/products?limit=100';
  if (stockType) url += `&stockType=${stockType}`;
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  });
}
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';

// Fetch BOMs for manufacturing
function fetchBOMs(token: any) {
  return fetch('/api/manufacturing/bom', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch BOMs');
    return res.json();
  });
}

export default function BOMTable() {
  const { showToast } = useAppToast();
  // Real-time price calculation for BOM modal (client-side, for preview only)
  function getLivePriceDetails() {
    if (!form.components.length) return null;
    let costBreakdown = [];
    let costPrice = 0;
    for (const c of form.components) {
      const rm = rawMaterials.find((r: any) => r.id === c.rawMaterialId);
      if (!rm || !c.quantity || c.quantity <= 0) continue;
      // Use unitCost if available, fallback to costPrice
      const unitCost = typeof rm.unitCost !== 'undefined' ? Number(rm.unitCost) : (Number(rm.costPrice) || 0);
      const total = unitCost * c.quantity;
      costBreakdown.push({
        name: rm.name,
        sku: rm.sku,
        unitCost,
        quantity: c.quantity,
        total
      });
      costPrice += total;
    }
    // Use markup for preview (25%)
    let price = costPrice * 1.25;
    let priceFormula = `costPrice * 1.25 = ${costPrice} * 1.25`;
    price = Math.round(price * 100) / 100;
    return { costPrice, price, priceFormula, costBreakdown };
  }
  const token = useAuthStore(state => state.token);
  const { data, isLoading, error, refetch } = useQuery(['manufacturingBOMs', token], () => fetchBOMs(token));

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [form, setForm] = useState<any>({
    finishedGood: {
      name: '',
      sku: '',
      price: 0,
      category: '',
      reorderLevel: 0,
      pricingMethod: 'markup',
      pricingOverride: false,
      description: ''
    },
    components: []
  });
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Helper: format measurement info
  function formatMeasurement(rm: any) {
    if (rm.measurementType && rm.measurementValue) {
      if (rm.measurementType === 'gram' || rm.measurementType === 'grams') {
        return `${rm.measurementValue}g per unit`;
      }
      return `${rm.measurementValue} ${rm.measurementType}${rm.measurementValue > 1 ? 's' : ''} per pack`;
    }
    return '';
  }
  // Helper: total available units
  function formatAvailable(rm: any) {
    if (rm.measurementType && rm.measurementValue) {
      const total = (rm.stock || 0) * (rm.measurementValue || 1);
      if (rm.measurementType === 'gram' || rm.measurementType === 'grams') {
        return `${total}g (${rm.stock} unit${rm.stock === 1 ? '' : 's'})`;
      }
      return `${rm.stock} ${rm.measurementType}${rm.stock > 1 ? 's' : ''} (${total} units)`;
    }
    return `${rm.stock} units`;
  }
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch products for dropdowns
  useEffect(() => {
    if (!showModal) return;
    setLoadingProducts(true);
    Promise.all([
      fetchProducts(token, 'finished_good'),
      fetchProducts(token, 'raw_material'),
      fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.ok ? res.json() : { categories: [] })
    ]).then(([fg, rm, cat]) => {
      setFinishedGoods(fg.products || []);
      setRawMaterials(rm.products || []);
      setCategories(cat.categories || []);
    }).catch(() => {
      setFinishedGoods([]);
      setRawMaterials([]);
      setCategories([]);
    }).finally(() => setLoadingProducts(false));
  }, [showModal, token]);

  // Open modal for create
  const openCreateModal = () => {
    setForm({
      finishedGood: {
        name: '',
        sku: '',
        price: 0,
        categoryId: '',
        supplier: '',
        reorderLevel: 0,
        pricingMethod: 'markup',
        pricingOverride: false,
        measurementType: '',
        measurementValue: '',
        description: ''
      },
      components: []
    });
    setModalMode('create');
    setShowModal(true);
    setFormError('');
  };

  // Price calculation state
  const [priceDetails, setPriceDetails] = useState<any>(null);

  // Open modal for edit
  const openEditModal = (bom: any) => {
    setForm({
      finishedGood: {
        name: bom.product?.name || '',
        sku: bom.product?.sku || '',
        price: bom.product?.price || 0,
        categoryId: bom.product?.categoryId || '',
        reorderLevel: bom.product?.reorderLevel || 0,
        pricingMethod: bom.product?.pricingMethod || 'markup',
        pricingOverride: bom.product?.pricingOverride || false,
        description: bom.product?.description || ''
      },
      components: (bom.items || []).map((item: any) => ({
        rawMaterialId: item.rawMaterialId,
        quantity: item.quantity
      }))
    });
    setModalMode('edit');
    setShowModal(true);
    setFormError('');
    // Fetch price details for this BOM
    fetch(`/api/manufacturing/bom/${bom.id}/price`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPriceDetails(data.priceDetails || null))
      .catch(() => setPriceDetails(null));
  };

  // Handle add/remove component
  const addComponent = () => {
    setForm((f: any) => ({ ...f, components: [...f.components, { rawMaterialId: '', quantity: 1 }] }));
  };
  const removeComponent = (idx: number) => {
    setForm((f: any) => ({ ...f, components: f.components.filter((_: any, i: number) => i !== idx) }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    // Validate finished good fields
    const fg = form.finishedGood;
    if (!fg.name || !fg.sku) {
      setFormError('Please enter all required finished good details.');
      return;
    }
    if (!form.components.length || form.components.some((c: any) => !c.rawMaterialId || c.quantity <= 0)) {
      setFormError('Add at least one valid raw material.');
      return;
    }
    setSubmitting(true);
    try {
      // Map category/categoryId for backend compatibility
      const finishedGoodToSend = { ...fg };
      if (fg.categoryId === undefined && fg.category) {
        finishedGoodToSend.categoryId = fg.category;
        delete finishedGoodToSend.category;
      }
      const res = await fetch('/api/manufacturing/bom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          finishedGood: finishedGoodToSend,
          components: form.components
        })
      });
      if (!res.ok) throw new Error('Failed to save BOM');
      const data = await res.json();
      setPriceDetails(data.priceDetails || null);
      setShowModal(false);
      showToast('BOM saved successfully!','success');
      refetch();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save BOM');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Bill of Materials (BOM)</h2>
        <button className="px-4 py-2 text-white rounded bg-primary" onClick={openCreateModal}>+ Create BOM</button>
      </div>
      {isLoading ? (
        <TableSkeleton 
          rows={6} 
          columns={3} 
          actions={true}
          headerWidths={['w-48', 'w-24', 'w-20']}
          cellWidths={['w-40', 'w-20', 'w-16']}
        />
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mb-2 text-red-500">Failed to load BOMs</div>
            <button 
              onClick={() => refetch()} 
              className="text-sm text-primary hover:text-primary/80"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="p-2">Finished Good</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.boms.map((bom: any) => (
              <tr key={bom.id} className="border-b">
                <td className="p-2">{bom.product?.name || '-'}</td>
                <td className="p-2">{bom.product?.sku || '-'}</td>
                <td className="flex items-center gap-2 p-2">
                  <button
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit BOM"
                    onClick={() => openEditModal(bom)}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete BOM"
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete this BOM?')) return;
                      try {
                        const res = await fetch(`/api/manufacturing/bom/${bom.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error('Failed to delete BOM');
                        showToast('BOM deleted successfully!','success');
                        refetch();
                      } catch (err: any) {
                        showToast('Error', err.message || 'Failed to delete BOM');
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for create/edit BOM */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={modalMode === 'create' ? 'Create BOM' : 'Edit BOM'}>
        {loadingProducts ? (
          <FormSkeleton fields={6} buttons={2} showTitle={false} />
        ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
          {formError && <div className="text-red-500">{formError}</div>}
          {/* Finished Good Product Input */}
          {/* Finished Good Product Input fields (inlined) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                name="name"
                value={form.finishedGood.name}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, name: e.target.value } }))}
                required
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input
                name="sku"
                value={form.finishedGood.sku}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, sku: e.target.value } }))}
                required
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                value={form.finishedGood.categoryId || ''}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, categoryId: e.target.value } }))}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              >
                <option value="">Select category...</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.finishedGood.description}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, description: e.target.value } }))}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
              <input
                name="reorderLevel"
                type="number"
                value={form.finishedGood.reorderLevel}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, reorderLevel: Number(e.target.value) } }))}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pricing Method</label>
              <select
                name="pricingMethod"
                value={form.finishedGood.pricingMethod}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, pricingMethod: e.target.value } }))}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              >
                <option value="markup">Markup</option>
                <option value="margin">Margin</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="flex items-center mt-2">
              <input
                id="pricingOverride"
                name="pricingOverride"
                type="checkbox"
                checked={form.finishedGood.pricingOverride}
                onChange={e => setForm((f: any) => ({ ...f, finishedGood: { ...f.finishedGood, pricingOverride: e.target.checked } }))}
                className="mr-2"
              />
              <label htmlFor="pricingOverride" className="text-sm font-medium text-gray-700">Override Price Calculation</label>
            </div>
          </div>
          {/* Price Calculation Display */}
          {/* Real-time price calculation (client-side) */}
          {showModal && modalMode === 'create' && getLivePriceDetails() && (() => {
            const live = getLivePriceDetails();
            if (!live) return null;
            return (
              <div className="p-3 mb-2 border rounded bg-gray-50">
                <div className="mb-1 font-semibold">Price Calculation (Preview):</div>
                <div className="mb-1 text-sm">Cost Price: <b>${live.costPrice.toFixed(2)}</b></div>
                <div className="mb-1 text-sm">Formula: <span className="font-mono">{live.priceFormula}</span></div>
                <div className="mb-1 text-sm">Final Price: <b>${live.price.toFixed(2)}</b></div>
                <div className="mb-1 text-sm">Breakdown:</div>
                <ul className="pl-4 text-xs list-disc">
                  {live.costBreakdown.map((item: any, idx: number) => (
                    <li key={idx}>{item.name} ({item.sku}): {item.quantity} × ${item.unitCost} = ${item.total.toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
          {/* Backend-calculated price after save/edit */}
          {showModal && modalMode === 'edit' && priceDetails && priceDetails.costBreakdown.length > 0 && (
            <div className="p-3 mb-2 border rounded bg-gray-50">
              <div className="mb-1 font-semibold">Price Calculation:</div>
              <div className="mb-1 text-sm">Cost Price: <b>${priceDetails.unitCost.toFixed(2)}</b></div>
              <div className="mb-1 text-sm">Formula: <span className="font-mono">{priceDetails.priceFormula}</span></div>
              <div className="mb-1 text-sm">Final Price: <b>${priceDetails.price.toFixed(2)}</b></div>
              <div className="mb-1 text-sm">Breakdown:</div>
              <ul className="pl-4 text-xs list-disc">
                {priceDetails.costBreakdown.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} ({item.sku}): {item.quantity} × $
                    {typeof item.unitCost !== 'undefined' ? (
                      <>{item.unitCost}</>
                    ) : (
                      <span className="font-semibold text-red-600">MISSING UNIT COST</span>
                    )}
                    {' '}= ${item.total.toFixed(2)}
                  </li>
                ))}
              </ul>
              {priceDetails.costBreakdown.some((item: any) => typeof item.unitCost === 'undefined') && (
                <div className="mt-2 text-xs text-red-600">Warning: Some raw materials are missing <b>unitCost</b>. Please update their product details.</div>
              )}
            </div>
          )}
          <div>
            <label className="block mb-1 font-medium">Raw Materials</label>
            {form.components.map((c: any, idx: number) => {
              const rm = rawMaterials.find((r: any) => r.id === c.rawMaterialId) || {};
              // Determine available units for this raw material
              const unitOptions = rm.measurementType ? [rm.measurementType, ...(rm.altUnits || [])] : [];
              return (
                <div key={idx} className="flex flex-col w-full gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 border rounded"
                      value={c.rawMaterialId}
                      onChange={e => setForm((f: any) => ({
                        ...f,
                        components: f.components.map((comp: any, i: number) => i === idx ? { ...comp, rawMaterialId: e.target.value } : comp)
                      }))}
                      required
                    >
                      <option value="">Select raw material</option>
                      {rawMaterials.map((rm: any) => (
                        <option key={rm.id} value={rm.id}>{rm.name} ({rm.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border rounded"
                      value={c.quantity}
                      min={1}
                      onChange={e => setForm((f: any) => ({
                        ...f,
                        components: f.components.map((comp: any, i: number) => i === idx ? { ...comp, quantity: Number(e.target.value) } : comp)
                      }))}
                      required
                      placeholder="Qty"
                    />
                    {/* Unit select for measurement-aware raw materials */}
                    {unitOptions.length > 0 && (
                      <select
                        className="px-2 py-1 border rounded"
                        value={c.unit || unitOptions[0]}
                        onChange={e => setForm((f: any) => ({
                          ...f,
                          components: f.components.map((comp: any, i: number) => i === idx ? { ...comp, unit: e.target.value } : comp)
                        }))}
                      >
                        {unitOptions.map((u: string) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    )}
                    <button type="button" className="px-2 text-lg font-bold text-red-600" aria-label="Remove" onClick={() => removeComponent(idx)}>&times;</button>
                  </div>
                  {/* Measurement info below dropdown */}
                  {rm.measurementType && rm.measurementValue && (
                    <div className="pl-1 text-xs text-gray-500">{formatMeasurement(rm)}</div>
                  )}
                  {/* Available units below dropdown */}
                  {typeof rm.stock !== 'undefined' && (
                    <div className="pl-1 text-xs text-blue-600">{formatAvailable(rm)}</div>
                  )}
                </div>
              );
            })}
            <button type="button" className="px-2 py-1 text-sm text-white bg-green-600 rounded" onClick={addComponent}>+ Add Raw Material</button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-white rounded bg-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save BOM'}</button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}
