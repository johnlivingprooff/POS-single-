import React from 'react';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../stores/authStore';
import { LogOut, Bell, Settings, Menu, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeRefresh } from '../hooks/useRealTimeRefresh';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed, isMobile = false }) => {
  const { logout, user } = useAuthStore();
  const { refreshData } = useRealTimeRefresh();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const goToSett = () => {
    navigate('/settings');
  };

  const handleRefresh = () => {
    refreshData('all');
  };

  // Check if user can access settings (only admin)
  const canAccessSettings = user?.role === 'admin';

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isMobile ? 'Open menu' : (isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* Mobile logo - only show on mobile when sidebar is closed */}
          {isMobile && (
            <div className="flex items-center lg:hidden">
              <img src="/logo.svg" alt="Logo" className="object-contain w-8 h-8" />
              <h1 className="text-lg font-bold ml-2 text-gray-900">Habicore POS</h1>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <NotificationBell className="p-2 text-gray-400 transition-colors hover:text-gray-600" />

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Refresh All Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {canAccessSettings && (
            <button
              onClick={goToSett}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center px-3 py-2 text-sm text-gray-700 transition-colors hover:text-gray-900 ${
              isMobile ? 'hidden sm:flex' : ''
            }`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile logout button */}
          {isMobile && (
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600 sm:hidden"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;