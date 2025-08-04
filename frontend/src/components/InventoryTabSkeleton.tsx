import React from 'react';
import Skeleton from '../ui/Skeleton';
import TableSkeleton from './TableSkeleton';

interface InventoryTabSkeletonProps {
  activeTab: 'raw_material' | 'asset_equipment' | 'finished_goods';
}

const InventoryTabSkeleton: React.FC<InventoryTabSkeletonProps> = ({ activeTab }) => {
  const getTableConfig = () => {
    switch (activeTab) {
      case 'raw_material':
        return {
          columns: 6,
          headerWidths: ['w-48', 'w-24', 'w-20', 'w-32', 'w-32', 'w-20'],
          cellWidths: ['w-40', 'w-20', 'w-16', 'w-28', 'w-28', 'w-16']
        };
      case 'asset_equipment':
        return {
          columns: 6,
          headerWidths: ['w-48', 'w-24', 'w-20', 'w-24', 'w-32', 'w-20'],
          cellWidths: ['w-40', 'w-20', 'w-16', 'w-20', 'w-28', 'w-16']
        };
      case 'finished_goods':
        return {
          columns: 5,
          headerWidths: ['w-48', 'w-24', 'w-20', 'w-24', 'w-20'],
          cellWidths: ['w-40', 'w-20', 'w-16', 'w-20', 'w-16']
        };
      default:
        return {
          columns: 6,
          headerWidths: ['w-48', 'w-24', 'w-20', 'w-24', 'w-32', 'w-20'],
          cellWidths: ['w-40', 'w-20', 'w-16', 'w-20', 'w-28', 'w-16']
        };
    }
  };

  const config = getTableConfig();

  return (
    <div className="bg-white rounded-lg shadow p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" variant="rectangular" />
          {activeTab === 'finished_goods' && (
            <Skeleton className="h-10 w-24" variant="rectangular" />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" variant="rectangular" />
      </div>

      {/* Table */}
      <TableSkeleton 
        rows={8} 
        columns={config.columns}
        actions={true}
        headerWidths={config.headerWidths}
        cellWidths={config.cellWidths}
      />
    </div>
  );
};

export default InventoryTabSkeleton;
