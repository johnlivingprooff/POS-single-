import React from 'react';
import Skeleton from '../ui/Skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  headerWidths?: string[];
  cellWidths?: string[];
  actions?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  headerWidths = [],
  cellWidths = [],
  actions = false
}) => {
  const defaultHeaderWidths = ['w-32', 'w-24', 'w-20', 'w-16'];
  const defaultCellWidths = ['w-28', 'w-20', 'w-16', 'w-12'];
  
  const getHeaderWidth = (index: number) => 
    headerWidths[index] || defaultHeaderWidths[index % defaultHeaderWidths.length] || 'w-20';
  
  const getCellWidth = (index: number) => 
    cellWidths[index] || defaultCellWidths[index % defaultCellWidths.length] || 'w-16';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <Skeleton className={`h-4 ${getHeaderWidth(i)}`} />
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
              )}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  {colIndex === 0 ? (
                    // First column often has more complex content (name + details)
                    <div className="flex items-center">
                      <Skeleton variant="circular" className="w-8 h-8 mr-3" />
                      <div>
                        <Skeleton className={`h-4 ${getCellWidth(colIndex)} mb-1`} />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className={`h-4 ${getCellWidth(colIndex)}`} />
                  )}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Skeleton variant="circular" className="w-4 h-4" />
                    <Skeleton variant="circular" className="w-4 h-4" />
                    <Skeleton variant="circular" className="w-4 h-4" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
