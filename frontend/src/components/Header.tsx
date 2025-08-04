import React from 'react';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../stores/authStore';
import { LogOut, Bell, Settings, Menu, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeRefresh } from '../hooks/useRealTimeRefresh';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
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
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">

          <NotificationBell className="p-2 text-gray-400 transition-colors hover:text-gray-600" />

          <button 
            onClick={handleRefresh} 
            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            title="Refresh All Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {canAccessSettings && (
            <button onClick={goToSett} className="p-2 text-gray-400 transition-colors hover:text-gray-600">
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
