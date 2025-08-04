import { QueryClient } from '@tanstack/react-query';

// Create a singleton query client with optimized settings for real-time updates
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Automatically refetch when window regains focus
      refetchOnWindowFocus: true,
      // Automatically refetch when reconnecting to the internet
      refetchOnReconnect: true,
      // Retry failed requests
      retry: 2,
      // Consider data stale after 30 seconds for real-time feel
      staleTime: 30 * 1000, // 30 seconds
      // Cache data for 5 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Global function to invalidate all inventory-related queries
export const invalidateInventoryQueries = () => {
  queryClient.invalidateQueries(['inventoryProducts']);
  queryClient.invalidateQueries(['posProducts']);
  queryClient.invalidateQueries(['manufacturingOrders']);
  queryClient.invalidateQueries(['bomList']);
  queryClient.invalidateQueries(['productDemand']);
  queryClient.invalidateQueries(['lowStockItems']);
};

// Global function to invalidate all sales-related queries
export const invalidateSalesQueries = () => {
  queryClient.invalidateQueries(['salesReports']);
  queryClient.invalidateQueries(['salesData']);
  queryClient.invalidateQueries(['salesAnalytics']);
  queryClient.invalidateQueries(['sales']);
};

// Global function to invalidate all customer-related queries
export const invalidateCustomerQueries = () => {
  queryClient.invalidateQueries(['crmCustomers']);
  queryClient.invalidateQueries(['posCustomers']);
  queryClient.invalidateQueries(['customers']);
};

// Global function to invalidate all supplier-related queries
export const invalidateSupplierQueries = () => {
  queryClient.invalidateQueries(['suppliers']);
  queryClient.invalidateQueries(['supplierDetails']);
};

// Global function to invalidate all user-related queries
export const invalidateUserQueries = () => {
  queryClient.invalidateQueries(['usersList']);
  queryClient.invalidateQueries(['users']);
};

// Global function to invalidate ALL queries (nuclear option)
export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};

// Function to force refetch specific query keys
export const refetchQueries = (queryKeys: string[]) => {
  queryKeys.forEach(key => {
    queryClient.refetchQueries([key]);
  });
};
