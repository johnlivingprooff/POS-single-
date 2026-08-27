import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  MapPin,
  FileText,
  BarChart3,
  Heart,
  Users,
  Bell,
  Settings,
  Factory,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuthStore();

  const navigationGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
        { name: 'POS Terminal', href: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'employee'] },
      ] as NavItem[],
    },
    {
      label: 'Inventory',
      items: [
        { name: 'Inventory', href: '/inventory', icon: Package, roles: ['admin', 'manager'] },
        { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
        { name: 'Off-Site Inventory', href: '/offsite', icon: MapPin, roles: ['admin', 'manager', 'employee'] },
      ] as NavItem[],
    },
    {
      label: 'Business',
      items: [
        { name: 'Sales Records', href: '/sales', icon: FileText, roles: ['admin', 'manager', 'employee'] },
        { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
        { name: 'Customers', href: '/customers', icon: Heart, roles: ['admin', 'manager'] },
      ] as NavItem[],
    },
    {
      label: 'Admin',
      items: [
        { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
        { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
      ] as NavItem[],
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col bg-card border-r border-[hsl(var(--card-border))] transition-all duration-300 relative',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
      style={{ minWidth: collapsed ? '68px' : '16rem' }}
    >
      {/* Logo + Toggle */}
      <div className={cn(
        'flex items-center h-16 border-b border-[hsl(var(--card-border))]',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary flex-shrink-0">
            <img src="/logo.svg" alt="Logo" className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-card-foreground">Habicore POS</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            collapsed
              ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-[hsl(var(--card-border))] shadow-sm z-10'
              : 'p-1.5'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group) => {
          const groupItems = group.items.filter(
            (item) => user?.role && item.roles.includes(user.role)
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={group.label} className={cn(!collapsed && 'mb-3')}>
              {!collapsed && (
                <h3 className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {group.label}
                </h3>
              )}
              {collapsed && <div className="my-2 border-t border-border mx-2" />}
              {groupItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center rounded-xl transition-all duration-200 group',
                      collapsed
                        ? 'justify-center px-0 py-2.5 mx-1'
                        : 'px-3 py-2.5 text-sm font-medium gap-3',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                  title={collapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {collapsed && isActive && (
                        <div className="absolute inset-x-0 inset-y-1 rounded-xl bg-primary/10" />
                      )}
                      <span
                        className={cn(
                          'relative z-10 flex items-center justify-center flex-shrink-0 rounded-lg transition-colors',
                          'w-10 h-10',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </span>
                      {!collapsed && (
                        <span className="relative z-10 truncate flex-1">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className={cn(
          'border-t border-[hsl(var(--card-border))]',
          collapsed ? 'p-2' : 'p-3'
        )}
      >
        <div
          className={cn(
            'flex items-center',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium flex-shrink-0',
              collapsed ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-base'
            )}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user?.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
