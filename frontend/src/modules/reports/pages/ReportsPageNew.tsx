import React, { useState } from 'react';
import InventoryReports from '../components/InventoryReports';
import SalesReportsPage from './EnhancedSalesReportsPage';

const ReportsPage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'sales' | 'inventory'>('sales');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {activeMainTab === 'sales' ? 'Sales Analytics Dashboard' : 'Inventory Reports Dashboard'}
        </h1>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveMainTab('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeMainTab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales Reports
          </button>
          <button
            onClick={() => setActiveMainTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeMainTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventory Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeMainTab === 'sales' && (
        <SalesReportsPage />
      )}

      {activeMainTab === 'inventory' && (
        <InventoryReports />
      )}
    </div>
  );
};

export default ReportsPage;
