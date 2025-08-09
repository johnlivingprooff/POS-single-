import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { apiFetch } from '../../../lib/api-utils';
import { Search, Package, Plus, Edit, Trash2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import Modal from '../../../components/Modal';
import RestockForm from '../components/RestockForm';
import ProductForm from '../../../components/ProductForm';
import { useAppToast } from '../../../hooks/useAppToast';
import PurchaseOrderForm from '../../../components/PurchaseOrderForm';
import LoadingSpinner from '../../../components/LoadingSpinner';
import TableSkeleton from '../../../components/TableSkeleton';
import InventoryTabSkeleton from '../../../components/InventoryTabSkeleton';
import StocktakingControl from '../../../components/StocktakingControl';
import { useRealTimeRefresh, usePostMutationRefresh } from '../../../hooks/useRealTimeRefresh';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  stockType: 'raw_material' | 'asset_equipment' | 'finished_good' | 'consumable';
  assetCategory?: string | null;
  category: string | { id: string; name: string; [key: string]: any };
  supplier: string | { id: string; name: string; [key: string]: any };
  reorderLevel: number;
  measurementType?: string | null;
  measurementValue?: number | null;
  availableQuantities?: number | null;
}



const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshData } = useRealTimeRefresh();
  const { refreshAfterMutation } = usePostMutationRefresh();
  const [showPOForm, setShowPOForm] = useState(false);
  const [poFormLoading, setPOFormLoading] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editProductLoading, setEditProductLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw_material' | 'asset_equipment' | 'finished_goods'>('raw_material');
  const [showManufactureModal, setShowManufactureModal] = useState(false);
  const [manufactureForm, setManufactureForm] = useState({ bomId: '', quantity: 1 });
  const [manufactureLoading, setManufactureLoading] = useState(false);
  const [bomList, setBomList] = useState<any[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [bomError, setBomError] = useState('');
  const { token } = useAuthStore();

  // Fetch products from backend (declare only once)
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['inventoryProducts'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const res = await apiFetch(`/products?limit=100`, token);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!token
  });
  const products: Product[] = productsData?.products || [];

  // Fetch BOMs for finished goods on page load and whenever products change
  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        const res = await apiFetch('/manufacturing/bom', token);
        if (!res.ok) throw new Error('Failed to fetch BOMs');
        const data = await res.json();
        setBomList(data.boms || []);
      } catch (err: any) {
        setBomList([]);
        setBomError(err.message || 'Failed to fetch BOMs');
      }
    })();
  }, [token, products]);
  // When BOM changes, update selectedBOM
  useEffect(() => {
    if (!manufactureForm.bomId) {
      setSelectedBOM(null);
      return;
    }
    const bom = bomList.find(b => b.id === manufactureForm.bomId);
    setSelectedBOM(bom || null);
    setManufactureForm(f => ({ ...f, quantity: 1 }));
  }, [manufactureForm.bomId, bomList]);
  // Calculate max possible output based on raw material stock
  const getMaxOutput = () => {
    if (!selectedBOM || !selectedBOM.items) return 0;
    let min = Infinity;
    for (const item of selectedBOM.items) {
      const raw = products.find(p => p.id === item.rawMaterialId);
      if (!raw) return 0;
      const possible = Math.floor((raw.availableQuantities || 0) / item.quantity);
      if (possible < min) min = possible;
    }
    return isFinite(min) ? min : 0;
  };

  // Calculate cost per finished good
  const getUnitCost = () => {
    if (!selectedBOM || !selectedBOM.items) return 0;
    let cost = 0;
    for (const item of selectedBOM.items) {
      const raw = products.find(p => p.id === item.rawMaterialId);
      if (!raw) return 0;
      cost += (raw.costPrice || 0) * item.quantity;
    }
    return cost;
  };

  // Calculate suggested price - UPDATED for direct sales model
  const getSuggestedPrice = () => {
    const unitCost = getUnitCost();
    // COMMENTED OUT: Manufacturing markup disabled for direct sales-from-inventory model
    // For demo, use 25% markup (can fetch from settings)
    // return +(unitCost * 1.25).toFixed(2);
    
    // DIRECT SALES MODEL: Price equals cost price
    return +unitCost.toFixed(2);
  };
  const handleManufacture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBOM) return;
    const maxOutput = getMaxOutput();
    if (manufactureForm.quantity < 1 || manufactureForm.quantity > maxOutput) {
      showToast(`Quantity must be between 1 and ${maxOutput}`,'error');
      return;
    }
    setManufactureLoading(true);
    try {
      // Call backend to create manufacturing order and update stock
      const res = await apiFetch('/manufacturing/orders', token, {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedBOM.productId,
          quantity: manufactureForm.quantity,
          bomId: selectedBOM.id
        })
      });
      if (!res.ok) throw new Error('Failed to manufacture product');
      showToast('Manufacturing order created successfully!','success' );
      setShowManufactureModal(false);
      setManufactureForm({ bomId: '', quantity: 1 });
      setSelectedBOM(null);
      setBomList([]);
      setBomError('');
      refetchProducts();
      // Trigger real-time refresh for inventory and manufacturing data
      refreshAfterMutation(['inventory', 'manufacturing']);
      // Navigate to manufacturing page to show production orders
      navigate('/manufacturing');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to manufacture product');
    } finally {
      setManufactureLoading(false);
    }
  };
  const handleEditProduct = async (data: any) => {
    setEditProductLoading(true);
    try {
      const res = await apiFetch(`/products/${editProduct.id}`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update product');
      showToast('Product updated successfully!', 'success');
      setEditProduct(null);
      refetchProducts();
      // Trigger real-time refresh
      refreshAfterMutation('inventory');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update product');
    } finally {
      setEditProductLoading(false);
    }
  };

  // Delete product (raw material or asset)
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiFetch(`/products/${productId}`, token, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        showToast('Product deleted successfully!','success');
        refetchProducts();
        // Trigger real-time refresh
        refreshAfterMutation('inventory');
      } else {
        const error = await res.json();
        showToast('Error', error.error || 'Failed to delete product');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete product');
    }
  };

  // Delete finished good (delete BOM and product)
  const handleDeleteFinishedGood = async (bom: any) => {
    if (!window.confirm('Are you sure you want to delete this finished good and its BOM?')) return;
    try {
      // Delete BOM
      const res = await apiFetch(`/manufacturing/bom/${bom.id}`, token, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        showToast('Error', error.error || 'Failed to delete BOM');
        return;
      }
      // Delete finished good product
      if (bom.productId) {
        const res2 = await apiFetch(`/products/${bom.productId}`, token, {
          method: 'DELETE'
        });
        if (res2.status !== 204) {
          const error = await res2.json();
          showToast('Error', error.error || 'Failed to delete finished good');
          return;
        }
      }
      showToast('Finished good and BOM deleted successfully!','success');
      refetchProducts();
      // Trigger real-time refresh
      refreshAfterMutation(['inventory', 'manufacturing']);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete finished good');
    }
  };
  const { showToast } = useAppToast();

  const handleAddProduct = async (data: any) => {
    setAddProductLoading(true);
    try {
      const res = await apiFetch('/products', token, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to add product');
      showToast('Product added successfully!','success');
      setShowAddForm(false);
      refetchProducts();
      // Trigger real-time refresh
      refreshAfterMutation('inventory');
    } catch (err: any) {
      showToast(err.message || 'Failed to add product','error');
    } finally {
      setAddProductLoading(false);
    }
  };


  // Fetch products from backend
  // const {
  //   data: productsData,
  //   isLoading: productsLoading,
  //   isError: productsError,
  //   refetch: refetchProducts
  // } = useQuery({
  //   queryKey: ['inventoryProducts'],
  //   queryFn: async () => {
  //     const res = await fetch(`/api/products?limit=100`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     if (!res.ok) throw new Error('Failed to fetch products');
  //     return res.json();
  //   }
  // });
  // const products: Product[] = productsData?.products || [];

  const filteredRawMaterials = products.filter(product =>
    (product.stockType === 'raw_material' || product.stockType === 'consumable') &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredAssets = products.filter(product =>
    product.stockType === 'asset_equipment' &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredFinishedGoods = products.filter(product =>
    product.stockType === 'finished_good' &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLowStockItems = () => {
    return products.filter(product => product.stock <= product.reorderLevel);
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        </div>
        
        {/* Stocktaking Control */}
        <div className="mb-6">
          <StocktakingControl />
        </div>
        
        {productsLoading ? (
          <InventoryTabSkeleton activeTab={activeTab} />
        ) : productsError ? (
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mb-2 text-red-500">Failed to load inventory</div>
                <button 
                  onClick={() => refetchProducts()} 
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
        
        <div className="flex pb-2 mb-8 space-x-4 border-b">
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'raw_material' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('raw_material')}
          >
            Stock
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'asset_equipment' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('asset_equipment')}
          >
            Assets
          </button>
          {/* <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'finished_goods' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('finished_goods')}
          >
            Finished Goods
          </button> */}
        </div>
        <div className="bg-white rounded-lg shadow p-8 min-h-[500px]">
          {activeTab === 'raw_material' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Stock
                  </button>
                  {/* <button
                    onClick={() => setShowPOForm(true)}
                    className="flex items-center px-4 py-2 text-green-800 transition-colors bg-green-100 rounded-md hover:bg-green-200"
                  >
                    Create Purchase Order
                  </button> */}
                </div>
              </div>
              {/* Table for Raw Materials */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cost Price</th>
                      {/* <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock Value</th> */}
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Available Units</th>
                      
                      {/* <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th> */}
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRawMaterials.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-8 h-8 mr-3 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{Number(product.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${product.stock <= product.reorderLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{product.stock} packs</span>
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {typeof product.availableQuantities === 'number' && product.measurementType ? (
                            <span>{product.availableQuantities} {product.measurementType}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td> */}
                        
                       
                        {/* <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.stockType}</td> */}
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900" 
                              onClick={() => setEditProduct(product)}
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-yellow-600 hover:text-yellow-900" 
                              title="Restock Product" 
                              onClick={() => setRestockProduct(product)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900" 
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Restock Modal */}
                          {restockProduct && restockProduct.id === product.id && (
                            <RestockForm
                              productId={restockProduct.id}
                              onClose={() => setRestockProduct(null)}
                              onSuccess={() => {
                                setRestockProduct(null);
                                refetchProducts();
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'asset_equipment' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Assets & Equipment</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Asset
                </button>
              </div>
              {/* Table for Assets/Equipment */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cost Price</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                      {/* <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Supplier</th> */}
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-8 h-8 mr-3 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{Number(product.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${product.stock <= product.reorderLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{product.stock} units</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.stockType}</td>
                        {/* <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{typeof product.supplier === 'object' && product.supplier !== null ? product.supplier.name : product.supplier}</td> */}
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900" 
                              onClick={() => setEditProduct(product)}
                              title="Edit Asset"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900" 
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete Asset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'finished_goods' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Finished Goods</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManufactureModal(true)}
                    className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manufacture
                  </button>
                </div>
              </div>
              {/* Table for Finished Goods (same design as raw materials) */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      if (!bomList || bomList.length === 0) {
                        return <tr><td colSpan={6} className="py-6 text-center text-gray-500">No finished goods yet.</td></tr>;
                      }
                      let anyRow = false;
                      const rows = bomList.map((bom: any) => {
                        if (!bom.productId && !bom.product) {
                          // No product info at all
                          return null;
                        }
                        let product = filteredFinishedGoods.find(p => p.id === bom.productId) || bom.product;
                        if (!product) {
                          anyRow = true;
                          return (
                            <tr key={bom.id} className="hover:bg-yellow-50">
                              <td colSpan={6} className="px-6 py-4 text-sm text-yellow-700">No product found for BOM (ID: {bom.id})</td>
                            </tr>
                          );
                        }
                        anyRow = true;
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{product.sku}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${product.stock <= product.reorderLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{product.stock} units</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{typeof product.category === 'object' && product.category !== null ? product.category.name : product.category}</td>
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                              <button 
                                className="text-red-600 hover:text-red-900" 
                                onClick={() => handleDeleteFinishedGood(bom)}
                                title="Delete Finished Good"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      });
                      if (!anyRow) {
                        return <tr><td colSpan={6} className="py-6 text-center text-gray-500">No finished goods yet.</td></tr>;
                      }
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        {/* Modals */}
        <Modal open={showPOForm} onClose={() => setShowPOForm(false)} title="Create Purchase Order">
          <PurchaseOrderForm
            onSubmit={async (data) => {
              setPOFormLoading(true);
              try {
                const res = await apiFetch('/purchase-orders', token, {
                  method: 'POST',
                  body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Failed to create purchase order');
                const result = await res.json();
                showToast('Success', result.message || 'Purchase order created successfully!');
                setShowPOForm(false);
                refetchProducts();
                // Trigger real-time refresh for inventory and supplier data
                refreshAfterMutation(['inventory', 'suppliers']);
              } catch (err: any) {
                showToast('Error', err.message || 'Failed to create purchase order');
              } finally {
                setPOFormLoading(false);
              }
            }}
            onCancel={() => setShowPOForm(false)}
            loading={poFormLoading}
          />
        </Modal>
        <Modal open={showAddForm} onClose={() => { setShowAddForm(false); refetchProducts(); }} title={activeTab === 'finished_goods' ? 'Add Finished Good' : 'Add Stock'}>
          <ProductForm
            onSubmit={async (data) => {
              await handleAddProduct(data);
              refetchProducts();
            }}
            onCancel={() => { setShowAddForm(false); refetchProducts(); }}
            loading={addProductLoading}
            isFinishedGood={activeTab === 'finished_goods'}
          />
        </Modal>
        <Modal open={!!editProduct} onClose={() => { setEditProduct(null); refetchProducts(); }} title="Edit Product">
          <ProductForm
            onSubmit={async (data) => {
              await handleEditProduct(data);
              refetchProducts();
            }}
            onCancel={() => { setEditProduct(null); refetchProducts(); }}
            loading={editProductLoading}
            initialValues={editProduct}
          />
        </Modal>
        {/* Manufacture Product Modal (placeholder) */}
        <Modal open={showManufactureModal} onClose={() => setShowManufactureModal(false)} title="Manufacture">
          <ManufactureModalContent
            bomList={bomList}
            products={products}
            manufactureForm={manufactureForm}
            setManufactureForm={setManufactureForm}
            selectedBOM={selectedBOM}
            setSelectedBOM={setSelectedBOM}
            getMaxOutput={getMaxOutput}
            manufactureLoading={manufactureLoading}
            handleManufacture={handleManufacture}
            bomError={bomError}
            token={token || ''}
          />
        </Modal>
        </>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;

// ManufactureModalContent: separate component for manufacture modal with priceDetails logic
interface ManufactureModalContentProps {
  bomList: any[]
  products: any[]
  manufactureForm: any
  setManufactureForm: (f: any) => void
  selectedBOM: any
  setSelectedBOM: (b: any) => void
  getMaxOutput: () => number
  manufactureLoading: boolean
  handleManufacture: (e: React.FormEvent) => void
  bomError: string
  token: string
}

export function ManufactureModalContent({
  bomList,
  products,
  manufactureForm,
  setManufactureForm,
  selectedBOM,
  setSelectedBOM,
  getMaxOutput,
  manufactureLoading,
  handleManufacture,
  bomError,
  token
}: ManufactureModalContentProps) {
  const [priceDetails, setPriceDetails] = React.useState<any>(null);
  const [loadingPrice, setLoadingPrice] = React.useState(false);
  React.useEffect(() => {
    if (!selectedBOM) return setPriceDetails(null);
    setLoadingPrice(true);
    apiFetch(`/manufacturing/bom/${selectedBOM.id}/price`, token, {
      method: 'GET'
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch price details'))
      .then(data => setPriceDetails(data.priceDetails))
      .catch(() => setPriceDetails(null))
      .finally(() => setLoadingPrice(false));
  }, [selectedBOM]);
  return (
    <form onSubmit={handleManufacture} className="space-y-6">
      {bomError && <div className="text-red-500">{bomError}</div>}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Select Finished Good (BOM)</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          value={manufactureForm.bomId}
          onChange={e => setManufactureForm((f: any) => ({ ...f, bomId: e.target.value }))}
          required
        >
          <option value="">Select...</option>
          {bomList.map((bom: any) => (
            <option key={bom.id} value={bom.id}>{bom.name || bom.product?.name || 'Unnamed BOM'}</option>
          ))}
        </select>
      </div>
      {selectedBOM && (
        <div className="p-4 mb-2 border rounded bg-gray-50">
          <div className="mb-2 font-semibold">BOM Breakdown:</div>
          <ul className="mb-2 text-sm">
            {selectedBOM.items.map((item: any) => {
              const raw = products.find((p: any) => p.id === item.rawMaterialId);
              return (
                <li key={item.id}>
                  {raw ? `${raw.name} (${raw.sku})` : 'Unknown'}: {item.quantity} {raw.measurementType} (Stock: {raw ? raw.stock : 'N/A'})
                </li>
              );
            })}
          </ul>
          <div className="text-xs text-gray-600">Max possible output: <span className="font-bold">{getMaxOutput()}</span></div>
          {/* {loadingPrice ? (
            <div className="text-xs text-gray-600">Loading price details...</div>
          ) : priceDetails ? (
            <>
              <div className="text-xs text-gray-600">Unit cost: <span className="font-bold">${priceDetails.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div className="text-xs text-gray-600">Selling price: <span className="font-bold">${priceDetails.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div className="text-xs text-gray-600">Formula: <span className="font-mono">{priceDetails.priceFormula}</span></div>
            </>
          ) : null} */}
        </div>
      )}
      {selectedBOM && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Quantity to Manufacture</label>
          <input
            type="number"
            min={1}
            max={getMaxOutput()}
            value={manufactureForm.quantity}
            onChange={e => setManufactureForm((f: any) => ({ ...f, quantity: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setManufactureForm((f: any) => { return { ...f, bomId: '', quantity: 1 }; })} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 text-white rounded-md bg-primary hover:bg-primary/90" disabled={manufactureLoading || !selectedBOM}>{manufactureLoading ? 'Manufacturing...' : 'Manufacture'}</button>
      </div>
    </form>
  );
}
