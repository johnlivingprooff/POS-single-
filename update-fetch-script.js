// Script to help update all fetch calls to use apiFetch
// Run this to get a list of files that need updating

const files = [
  'frontend/src/modules/users/pages/UsersPage.tsx',
  'frontend/src/modules/suppliers/pages/SuppliersPage.tsx',
  'frontend/src/modules/suppliers/components/ProcurementHistoryTable.tsx',
  'frontend/src/modules/settings/pages/TaxSettingsSection.tsx',
  'frontend/src/modules/settings/pages/SalesPricingConfiguration.tsx',
  'frontend/src/modules/settings/pages/InventorySettingsSection.tsx',
  'frontend/src/modules/settings/pages/InventorySettingsPage.tsx',
  'frontend/src/modules/settings/pages/GeneralSettingsSection.tsx',
  'frontend/src/modules/settings/pages/CategorySettingsSection.tsx',
  'frontend/src/modules/reports/pages/EnhancedSalesReportsPage.tsx',
  'frontend/src/modules/reports/pages/ReportsPageOld.tsx',
  'frontend/src/modules/reports/components/InventoryReports.tsx',
  'frontend/src/modules/offsite/pages/OffsitePage.tsx',
  'frontend/src/modules/offsite/components/RequisitionForm.tsx',
  'frontend/src/modules/notifications/pages/NotificationsPage.tsx',
  'frontend/src/modules/notifications/pages/NotificationSettingsPage.tsx',
  'frontend/src/modules/manufacturing/components/BOMTable.tsx',
  'frontend/src/modules/manufacturing/components/ProductionOrdersTable.tsx',
  'frontend/src/modules/manufacturing/components/FinishedGoodForm.tsx',
  'frontend/src/modules/inventory/pages/InventoryPage.tsx',
  'frontend/src/components/SupplierSelect.tsx',
  'frontend/src/components/PurchaseOrderForm.tsx',
  'frontend/src/components/ProductForm.tsx',
  'frontend/src/components/NotificationBell.tsx',
  'frontend/src/components/NotificationBadge.tsx'
];

console.log('Files to update:', files.length);
files.forEach(file => console.log(file));
