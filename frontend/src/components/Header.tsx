import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';
import {
  LogOut,
  Settings,
  Menu,
  RefreshCw,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Command,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeRefresh } from '../hooks/useRealTimeRefresh';
import NotificationBell from './NotificationBell';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { logout, user } = useAuthStore();
  const { refreshData } = useRealTimeRefresh();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    refreshData('all');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', String(!darkMode));
  };

  // Keyboard shortcut for command palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const canAccessSettings = user?.role === 'admin';

  const quickActions = [
    { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, description: 'Open POS terminal' },
    { label: 'Inventory', href: '/inventory', icon: Package, description: 'View inventory stock' },
    { label: 'Sales Records', href: '/sales', icon: FileText, description: 'View sales history' },
    { label: 'Reports', href: '/reports', icon: BarChart3, description: 'View sales & inventory reports' },
    { label: 'Customers', href: '/customers', icon: Users, description: 'Manage customer database' },
    ...(canAccessSettings
      ? [{ label: 'Settings', href: '/settings', icon: Settings, description: 'Configure application settings' }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-[hsl(var(--card-border))]">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={cn(
                'p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'lg:hidden'
              )}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Global Search / Command Palette */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                'flex items-center gap-2 w-full max-w-md sm:max-w-lg lg:max-w-xl',
                'px-3 py-2 rounded-lg text-sm text-muted-foreground',
                'hover:bg-accent transition-colors',
                'border border-transparent hover:border-[hsl(var(--card-border))]'
              )}
              aria-label="Search (⌘K)"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Search products, customers, orders...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-muted rounded">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
            </button>

            {/* Command Palette Overlay */}
            {searchOpen && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-in fade-in"
                  onClick={() => setSearchOpen(false)}
                />
                <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl animate-in zoom-in">
                  <div className="bg-card border border-[hsl(var(--card-border))] rounded-xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-[hsl(var(--card-border))]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search everything... (⌘K to close)"
                          className="w-full pl-10 pr-4 py-3 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-muted-foreground bg-muted rounded">
                          Esc
                        </kbd>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      <div className="mb-4">
                        <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Quick Actions
                        </h3>
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => {
                              navigate(action.href);
                              setSearchOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                              'hover:bg-accent transition-colors text-sm'
                            )}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                              <action.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-foreground">{action.label}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={cn(
              'p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <NotificationBell className="p-2 text-muted-foreground transition-colors hover:text-foreground" />

          {/* Dark Mode Toggle (hidden on small screens; available in user menu) */}
          <button
            onClick={toggleDarkMode}
            className={cn(
              'hidden sm:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Settings (admin only, hidden on small screens; available in user menu) */}
          {canAccessSettings && (
            <button
              onClick={() => navigate('/settings')}
              className={cn(
                'hidden sm:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'hover:bg-accent transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="User menu"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user?.name}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 border-b border-[hsl(var(--card-border))]">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              {canAccessSettings && (
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
