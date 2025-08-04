import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Users,
  Settings,
  Factory,
  Heart,
  Truck, // Import the shipping truck icon
  MapPin, // Import the map pin icon for off-site
  Bell // Import the bell icon for notifications
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user } = useAuthStore();
  
  // Define all navigation items
  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'employee'] },
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager'] }, 
    { name: 'Off-Site Inventory', href: '/offsite', icon: MapPin, roles: ['admin', 'manager', 'employee'] },
    { name: 'Sales Records', href: '/sales', icon: FileText, roles: ['admin', 'manager', 'employee'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Customers', href: '/customers', icon: Heart, roles: ['admin', 'manager'] },
    { name: 'Manufacturing', href: '/manufacturing', icon: Factory, roles: ['admin', 'manager'] },
    // { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin', 'manager', 'employee'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div
      className={`flex flex-col bg-white shadow-lg transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ minWidth: collapsed ? '5rem' : '16rem' }}
    >
      <div className="flex items-center h-16 px-4 bg-primary text-primary-foreground">
        <img src="/logo.svg" alt="Logo" className="object-contain w-8 h-8 ml-2" />
        {!collapsed && <h1 className="text-xl font-bold">&nbsp;Habicore POS</h1>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => (
          <div key={item.name} className="relative group">
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                collapsed
                  ? `flex items-center justify-center py-2 rounded-md ${isActive ? 'text-primary-foreground' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                  : `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      collapsed
                        ? `flex items-center justify-center w-10 h-10 ${isActive ? 'bg-primary text-primary-foreground rounded-md' : ''}`
                        : 'mr-3'
                    }
                  >
                    <item.icon className="w-5 h-5" />
                  </span>
                  {!collapsed && item.name}
                </>
              )}
            </NavLink>
            {/* Tooltip for collapsed sidebar */}
            {collapsed && (
              <div className="absolute z-50 px-2 py-1 ml-2 text-sm text-white transition-opacity duration-200 transform -translate-y-1/2 bg-gray-900 rounded opacity-0 pointer-events-none left-full top-1/2 group-hover:opacity-100 whitespace-nowrap">
                {item.name}
                <div className="absolute left-0 w-0 h-0 transform -translate-x-1 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent top-1/2 border-r-gray-900"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
              <span className="text-sm font-medium text-primary-foreground">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
