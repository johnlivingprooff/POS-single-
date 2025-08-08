import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { useAppToast } from '../../../hooks/useAppToast';
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
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
  CreditCardIcon
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import DatePicker from 'react-datepicker';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import 'react-datepicker/dist/react-datepicker.css';
import { apiFetch } from '../../../lib/api-utils';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface Filters {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateRange: DateRange;
  categoryId?: string;
  customerId?: string;
  paymentMethod?: string;
  productId?: string;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const SalesReportsPage: React.FC = () => {
  const { token } = useAuthStore();
  const { showToast } = useAppToast();
  
  const [filters, setFilters] = useState<Filters>({
    period: 'month',
    dateRange: { start: null, end: null }
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'products' | 'customers' | 'details'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [currency, setCurrency] = useState<string>(''); // State to hold currency symbol

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

  // Fetch sales analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['salesAnalytics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.period === 'custom' && filters.dateRange.start && filters.dateRange.end) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }
      
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.productId) params.append('productId', filters.productId);

      const res = await apiFetch(`/reports/sales/analytics?${params.toString()}`, token);
      if (!res.ok) throw new Error('Failed to fetch sales analytics');
      return res.json();
    }
  });

  // Fetch categories for filtering
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/products/categories', token); 
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  // Fetch customers for filtering
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiFetch('/customers?limit=100', token);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    }
  });

  // Process trends data for charts
  const trendsData = useMemo(() => {
    if (!analyticsData?.trends) return [];
    
    const dailyData: { [date: string]: { date: string, revenue: number, sales: number, profit: number } } = {};
    
    analyticsData.trends.forEach((sale: any) => {
      const date = format(new Date(sale.createdAt), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, sales: 0, profit: 0 };
      }
      dailyData[date].revenue += Number(sale.total);
      dailyData[date].sales += 1;
      dailyData[date].profit += Number(sale.total) - Number(sale.tax);
    });
    
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData]);

  // Handle period change
  const handlePeriodChange = (period: Filters['period']) => {
    const now = new Date();
    let newDateRange: DateRange = { start: null, end: null };
    
    switch (period) {
      case 'today':
        newDateRange = { start: now, end: now };
        break;
      case 'week':
        newDateRange = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case 'month':
        newDateRange = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        newDateRange = { start: quarterStart, end: quarterEnd };
        break;
      case 'year':
        newDateRange = { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
        break;
      case 'custom':
        // Keep existing date range for custom
        break;
    }
    
    setFilters(prev => ({ ...prev, period, dateRange: period === 'custom' ? prev.dateRange : newDateRange }));
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('sales-report-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
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

      pdf.save(`sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      showToast('PDF exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export PDF', 'error');
      console.error('PDF export error:', error);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.period === 'custom' && filters.dateRange.start && filters.dateRange.end) {
        params.append('startDate', filters.dateRange.start.toISOString());
        params.append('endDate', filters.dateRange.end.toISOString());
      }

      const res = await apiFetch(`/reports/sales/export/excel?${params.toString()}`, token);

      if (!res.ok) throw new Error('Failed to fetch export data');
      const data = await res.json();

      const workbook = XLSX.utils.book_new();
      
      // Sales Summary Sheet
      const summarySheet = XLSX.utils.json_to_sheet(data.salesSummary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sales Summary');
      
      // Sales Items Sheet
      const itemsSheet = XLSX.utils.json_to_sheet(data.salesItems);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Sales Items');
      
      // Analytics Summary Sheet
      if (analyticsData) {
        const analyticsSheet = XLSX.utils.json_to_sheet([
          {
            Metric: 'Total Sales',
            Value: analyticsData.summary.totalSales
          },
          {
            Metric: 'Total Revenue',
            Value: analyticsData.summary.totalRevenue
          },
          {
            Metric: 'Average Sale',
            Value: analyticsData.summary.averageSale
          },
          {
            Metric: 'Net Revenue',
            Value: analyticsData.summary.netRevenue
          }
        ]);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
      }

      XLSX.writeFile(workbook, `sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      showToast('Excel file exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export Excel file', 'error');
      console.error('Excel export error:', error);
    }
  };

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="w-1/3 h-8 mb-4 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded h-96"></div>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="mb-4 text-red-500">Failed to load sales analytics</p>
          <button
            onClick={() => refetchAnalytics()}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = analyticsData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">.</h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Excel
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-white border rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {/* Period Selection */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Period</label>
              <select
                value={filters.period}
                onChange={(e) => handlePeriodChange(e.target.value as Filters['period'])}
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

            {/* Custom Date Range */}
            {filters.period === 'custom' && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
                  <DatePicker
                    selected={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: date } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
                  <DatePicker
                    selected={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: date } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select end date"
                  />
                </div>
              </>
            )}

            {/* Category Filter */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categoriesData?.categories?.map((category: any) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={filters.paymentMethod || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div id="sales-report-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSignIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 w-0 ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {currency}{Number(summary.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 w-0 ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.totalSales || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 w-0 ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Sale</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {currency}{Number(summary.averageSale || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 w-0 ml-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {currency}{Number(summary.netRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'trends', name: 'Trends' },
                { id: 'products', name: 'Products' },
                { id: 'customers', name: 'Customers' },
                { id: 'details', name: 'Transaction Details' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Revenue Trend Chart */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Revenue Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Revenue']} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                {analyticsData?.paymentMethodBreakdown && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-4 text-lg font-medium text-gray-900">Payment Methods</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.paymentMethodBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ paymentMethod, percent }: any) => `${paymentMethod} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="_sum.total"
                            >
                              {analyticsData.paymentMethodBreakdown.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Total']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div>
                      <h3 className="mb-4 text-lg font-medium text-gray-900">Sales by Category</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.categoryBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, 'Revenue']} />
                            <Bar dataKey="totalRevenue" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Sales & Revenue Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name={`Revenue (${currency})`}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="sales"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          name="Sales Count"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Top Products by Revenue */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Top Products by Revenue</h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Category
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Quantity Sold
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analyticsData?.topProducts?.byRevenue?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {item.product?.name || 'Unknown Product'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {item.product?.category || 'Uncategorized'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {item.quantitySold}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {currency}{Number(item.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low Performing Products */}
                {analyticsData?.lowPerformingProducts?.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Low Performing Products</h3>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quantity Sold
                            </th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analyticsData.lowPerformingProducts.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                {item.product?.name || 'Unknown Product'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {item.product?.category || 'Uncategorized'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {item.quantitySold}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {currency}{Number(item.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Top Customers by Revenue</h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Transactions
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Total Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analyticsData?.customerAnalysis?.map((customer: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {customer.customer?.name || 'Walk-in Customer'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {customer.customer?.email || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {customer.transactionCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {currency}{Number(customer.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Transactions</h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Sale #
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Items
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analyticsData?.recentTransactions?.slice(0, 20).map((sale: any) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {sale.saleNumber}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {sale.customer?.name || 'Walk-in Customer'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {sale.items?.length || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {currency}{Number(sale.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReportsPage;
