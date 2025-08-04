import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';
import LoginPage from './modules/auth/pages/LoginPage';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import POSPage from './modules/pos/pages/POSPage';
import InventoryPage from './modules/inventory/pages/InventoryPage';
import SalesPage from './modules/sales/pages/SalesPage';
import ReportsPage from './modules/reports/pages/ReportsPage';
import CustomersPage from './modules/crm/pages/CustomersPage';
import UsersPage from './modules/users/pages/UsersPage';
import ManufacturingPage from './modules/manufacturing/pages/ManufacturingPage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import SuppliersPage from './modules/suppliers/pages/SuppliersPage';
import SupplierDetailsPage from './modules/suppliers/pages/SupplierDetailsPage';
import OffsitePage from './modules/offsite/pages/OffsitePage';
import NotificationsPage from './modules/notifications/pages/NotificationsPage';
import NotificationSettingsPage from './modules/notifications/pages/NotificationSettingsPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  // Regular app access
  if (!isAuthenticated) {
    return <ToastProvider><LoginPage /></ToastProvider>;
  }

  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailsPage />} />
          <Route path="/offsite" element={<OffsitePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/manufacturing" element={<ManufacturingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;
