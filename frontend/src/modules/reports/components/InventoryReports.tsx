import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';
import { useCurrency } from '../../../utils/setCurrency';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PackageIcon,
  AlertTriangleIcon,
  BarChart3Icon
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import DatePicker from 'react-datepicker';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../../lib/api-utils';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface InventoryFilters {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateRange: DateRange;
  categoryId?: string;
  stockType?: string;
  userId?: string;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const InventoryReports: React.FC = () => {
  const { token } = useAuthStore();
  const { showToast } = useAppToast();
  
  const [filters, setFilters] = useState<InventoryFilters>({
    period: 'month',
    dateRange: { start: null, end: null }
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'lowstock' | 'valuation' | 'offsite'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Set Currency
  const currency = useCurrency(token);
  const formatCurrency = (amount: any): string => {
    const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
    return numAmount.toLocaleString(undefined, { 
      style: 'currency', 
      currency: currency.currencyValue || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Fetch inventory reports data
  const {
    data: inventoryData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['inventoryReports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.period === 'custom' && filters.dateRange.start && filters.dateRange.end) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
      
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.stockType) params.append('stockType', filters.stockType);
      if (filters.userId) params.append('userId', filters.userId);

      const res = await apiFetch(`/reports/inventory?${params.toString()}`, token);
      if (!res.ok) throw new Error('Failed to fetch inventory reports');
      return res.json();
    }
  });

  // Fetch categories for filtering
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/categories', token);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  // Handle period change
  const handlePeriodChange = (period: InventoryFilters['period']) => {
    const now = new Date();
    let newDateRange: DateRange = { start: null, end: null };
    
    switch (period) {
      case 'today':
        newDateRange = { start: now, end: now };
        break;
      case 'week':
        newDateRange = { start: subDays(now, 7), end: now };
        break;
      case 'month':
        newDateRange = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'custom':
        // Keep existing custom range or reset
        break;
      default:
        newDateRange = { start: null, end: null };
    }
    
    setFilters(prev => ({ ...prev, period, dateRange: newDateRange }));
  };

  // Export functions
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('inventory-reports-container');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      showToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Failed to export PDF', 'error');
    }
  };

  const exportToExcel = async () => {
    try {
      if (!inventoryData) return;

      const workbook = XLSX.utils.book_new();
      
      // Current Stock sheet
      const stockSheet = XLSX.utils.json_to_sheet(
        inventoryData.currentStock.map((item: any) => ({
          'Product Name': item.name,
          'SKU': item.sku,
          'Category': item.category?.name || 'N/A',
          'Stock Type': item.stockType,
          'Current Stock': item.stock,
          'Reorder Level': item.reorderLevel,
          'Cost Price': item.costPrice,
          'Total Value': (item.stock * Number(item.costPrice)).toFixed(2),
          'Supplier': item.supplier?.name || 'N/A'
        }))
      );
      XLSX.utils.book_append_sheet(workbook, stockSheet, 'Current Stock');

      // Low Stock sheet
      if (inventoryData.lowStockItems?.length > 0) {
        const lowStockSheet = XLSX.utils.json_to_sheet(
          inventoryData.lowStockItems.map((item: any) => ({
            'Product Name': item.name,
            'SKU': item.sku,
            'Current Stock': item.stock,
            'Reorder Level': item.reorderLevel,
            'Category': item.category?.name || 'N/A'
          }))
        );
        XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Low Stock Items');
      }

      // Inventory Adjustments sheet
      if (inventoryData.inventoryAdjustments?.length > 0) {
        const adjustmentsSheet = XLSX.utils.json_to_sheet(
          inventoryData.inventoryAdjustments.map((adj: any) => ({
            'Date': format(new Date(adj.createdAt), 'yyyy-MM-dd HH:mm'),
            'Product': adj.product.name,
            'SKU': adj.product.sku,
            'Quantity Changed': adj.quantity,
            'Previous Stock': adj.previousStock,
            'New Stock': adj.newStock,
            'Reason': adj.reason || 'N/A'
          }))
        );
        XLSX.utils.book_append_sheet(workbook, adjustmentsSheet, 'Adjustments');
      }

      XLSX.writeFile(workbook, `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      showToast('Excel file exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showToast('Failed to export Excel file', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">Error Loading Inventory Reports</h3>
        <p className="mb-4 text-gray-500">We couldn't load your inventory data. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-white rounded-md bg-primary hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  const summary = inventoryData?.summary || {};

  return (
    <div id="inventory-reports-container" className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export PDF
        </button>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export Excel
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-white border rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Period Selection */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Period</label>
              <select
                value={filters.period}
                onChange={(e) => handlePeriodChange(e.target.value as InventoryFilters['period'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categoriesData?.map((category: any) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Type Filter */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Stock Type</label>
              <select
                value={filters.stockType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, stockType: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="raw_material">Raw Materials</option>
                <option value="finished_good">Finished Goods</option>
                <option value="asset_equipment">Assets/Equipment</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.period === 'custom' && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
                  <DatePicker
                    selected={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: date }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
                  <DatePicker
                    selected={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: date }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select end date"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PackageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.totalProducts || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3Icon className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Valuation</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.lowStockCount || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 w-0 ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Off-site Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.offsiteItemsCount || 0}</dd>
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
              { id: 'overview', name: 'Stock Overview' },
              { id: 'movements', name: 'Stock Movements' },
              { id: 'lowstock', name: 'Low Stock Alerts' },
              { id: 'valuation', name: 'Inventory Valuation' }
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
            <div className="space-y-6">
              {/* Stock Movement Chart */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900">Stock Movement Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={inventoryData?.stockMovementChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="inflow" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Inflow" />
                      <Area type="monotone" dataKey="outflow" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" name="Outflow" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900">Stock by Category</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryData?.categoryBreakdown || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="_sum.stock"
                        label={({ categoryId, _sum }) => `${categoryId}: ${_sum.stock}`}
                      >
                        {(inventoryData?.categoryBreakdown || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'movements' && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Inventory Adjustments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Previous</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">New Stock</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(inventoryData?.inventoryAdjustments || []).map((adj: any) => (
                      <tr key={adj.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {format(new Date(adj.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {adj.product.name} <span className="text-gray-500">({adj.product.sku})</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            adj.type === 'stock_in' ? 'bg-green-100 text-green-800' :
                            adj.type === 'stock_out' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {adj.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{adj.previousStock}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{adj.newStock}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{adj.reason || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lowstock' && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">Items Requiring Restock</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(inventoryData?.lowStockItems || []).map((item: any) => (
                  <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.category?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">{item.stock} in stock</p>
                        <p className="text-xs text-gray-500">Reorder at {item.reorderLevel}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 bg-red-200 rounded-full">
                        <div 
                          className="h-2 bg-red-600 rounded-full" 
                          style={{ 
                            width: `${Math.min((item.stock / item.reorderLevel) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'valuation' && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">Current Inventory Valuation</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cost Price</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(inventoryData?.currentStock || []).map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.name} <span className="text-gray-500">({item.sku})</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.category?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.stock}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">${Number(item.costPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          ${(item.stock * Number(item.costPrice)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;
