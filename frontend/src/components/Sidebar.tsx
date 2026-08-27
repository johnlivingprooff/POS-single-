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
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onCloseMobile }) => {
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
        'flex flex-col bg-card border-r border-[hsl(var(--card-border))] z-50',
        // Mobile: fixed off-canvas drawer
        'fixed inset-y-0 left-0 w-72 max-w-[85%] transform transition-transform duration-300',
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        // Desktop: static collapsible rail
        'lg:static lg:translate-x-0 lg:z-auto lg:shadow-none lg:transition-all lg:duration-300',
        collapsed ? 'lg:w-[68px] lg:min-w-[68px]' : 'lg:w-64 lg:min-w-[16rem]'
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-[hsl(var(--card-border))] justify-between px-4',
          collapsed && 'lg:justify-center lg:px-2'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0">
            <img src="/logo.svg" alt="Logo" className="w-5 h-5" />
          </div>
          <span className={cn('text-lg font-bold text-card-foreground', collapsed && 'lg:hidden')}>
            Habicore POS
          </span>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'hidden lg:flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            collapsed
              ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-[hsl(var(--card-border))] shadow-sm z-10'
              : 'p-1.5'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navigationGroups.map((group) => {
          const groupItems = group.items.filter(
            (item) => user?.role && item.roles.includes(user.role)
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-3">
              <h3
                className={cn(
                  'px-3 py-1.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider',
                  collapsed && 'lg:hidden'
                )}
              >
                {group.label}
              </h3>
              {collapsed && <div className="hidden lg:block my-2 border-t border-border mx-2" />}
              {groupItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center rounded-xl transition-all duration-200 group gap-3 px-3 py-2.5 text-sm font-medium',
                      // Desktop collapsed rail
                      'lg:justify-center lg:px-0 lg:py-2.5 lg:mx-1',
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
                      <span
                        className={cn(
                          'relative z-10 truncate flex-1',
                          collapsed && 'lg:hidden'
                        )}
                      >
                        {item.name}
                      </span>
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
          'border-t border-[hsl(var(--card-border))] p-3',
          collapsed && 'lg:p-2'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'lg:justify-center lg:gap-0'
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
          <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
            <p className="text-sm font-medium text-card-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
