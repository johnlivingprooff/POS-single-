import React, { useState } from 'react';
import InventorySettingsSection from './InventorySettingsSection';
import SalesPricingConfiguration from './SalesPricingConfiguration';
import CategorySettingsSection from './CategorySettingsSection';
import GeneralSettingsSection from './GeneralSettingsSection';
import TaxSettingsSection from './TaxSettingsSection';
import Skeleton from '../../../ui/Skeleton';  

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'sales' | 'tax' | 'categories'>('general');

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Settings</h1>
        <div className="flex pb-2 mb-8 space-x-4 border-b">
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'general' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'inventory' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'sales' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'tax' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('tax')}
          >
            Tax
          </button>
          <button
            className={`px-6 py-2 font-medium rounded-t-md ${activeTab === 'categories' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-8 min-h-[500px]">
          {activeTab === 'general' && (
            <GeneralSettingsSection />
          )}
          {activeTab === 'inventory' && <InventorySettingsSection />}
          {activeTab === 'sales' && <SalesPricingConfiguration />}
          {activeTab === 'tax' && <TaxSettingsSection />}
          {activeTab === 'categories' && <CategorySettingsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
