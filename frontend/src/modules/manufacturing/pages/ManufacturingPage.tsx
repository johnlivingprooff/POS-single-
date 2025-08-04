import React, { useState } from 'react';
import ProductionOrdersTable from '../components/ProductionOrdersTable';
import BOMTable from '../components/BOMTable';
// import ProductionHistoryTable from '../components/ProductionHistoryTable'; // Optional: for future

const TABS = [
  { key: 'orders', label: 'Production Orders' },
  { key: 'bom', label: 'Bill of Materials (BOM)' },
  // { key: 'history', label: 'Production History' },
];

const ManufacturingPage: React.FC = () => {
  const [tab, setTab] = useState('orders');

  return (
    <div className="max-w-6xl py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Manufacturing</h1>
      <div className="flex mb-6 space-x-4 border-b">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-6 py-2 font-medium rounded-t-md ${tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
        {/* Add key to force remount on tab switch for real-time update */}
        {tab === 'orders' && <ProductionOrdersTable key="orders-table" />}
        {tab === 'bom' && <BOMTable key="bom-table" />}
        {/* {tab === 'history' && <ProductionHistoryTable />} */}
      </div>
    </div>
  );
};

export default ManufacturingPage;
