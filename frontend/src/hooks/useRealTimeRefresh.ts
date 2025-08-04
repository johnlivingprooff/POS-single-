import React, { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  invalidateInventoryQueries, 
  invalidateSalesQueries, 
  invalidateCustomerQueries,
  invalidateSupplierQueries,
  invalidateUserQueries,
  invalidateAllQueries 
} from '../lib/queryClient';

export type RefreshScope = 
  | 'inventory' 
  | 'sales' 
  | 'customers' 
  | 'suppliers' 
  | 'users' 
  | 'manufacturing' 
  | 'all';

// Custom hook for real-time data management
export const useRealTimeRefresh = () => {
  const queryClient = useQueryClient();

  // Function to refresh specific data scopes
  const refreshData = useCallback((scope: RefreshScope | RefreshScope[]) => {
    const scopes = Array.isArray(scope) ? scope : [scope];
    
    scopes.forEach(s => {
      switch (s) {
        case 'inventory':
          invalidateInventoryQueries();
          break;
        case 'sales':
          invalidateSalesQueries();
          break;
        case 'customers':
          invalidateCustomerQueries();
          break;
        case 'suppliers':
          invalidateSupplierQueries();
          break;
        case 'users':
          invalidateUserQueries();
          break;
        case 'manufacturing':
          queryClient.invalidateQueries(['manufacturingOrders']);
          queryClient.invalidateQueries(['bomList']);
          queryClient.invalidateQueries(['productDemand']);
          break;
        case 'all':
          invalidateAllQueries();
          break;
      }
    });
  }, [queryClient]);

  // Auto-refresh interval (every 60 seconds for critical data)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh inventory and manufacturing data automatically
      // as these change frequently due to stock movements
      refreshData(['inventory', 'manufacturing']);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [refreshData]);

  // Listen for tab focus to refresh data
  useEffect(() => {
    const handleFocus = () => {
      refreshData('all');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  return { refreshData };
};

// Higher-order component to add real-time refresh to any component
export const withRealTimeRefresh = <P extends object>(
  Component: React.ComponentType<P>,
  scope: RefreshScope | RefreshScope[] = 'all'
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const { refreshData } = useRealTimeRefresh();
    
    // Refresh data when component mounts
    useEffect(() => {
      refreshData(scope);
    }, [refreshData]);

    return React.createElement(Component, props);
  };

  return WrappedComponent;
};

// Custom hook for post-mutation refresh
export const usePostMutationRefresh = () => {
  const { refreshData } = useRealTimeRefresh();

  const refreshAfterMutation = useCallback(
    (scope: RefreshScope | RefreshScope[], delay: number = 500) => {
      // Small delay to ensure backend has processed the change
      setTimeout(() => {
        refreshData(scope);
      }, delay);
    },
    [refreshData]
  );

  return { refreshAfterMutation };
};
