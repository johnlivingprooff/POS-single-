import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleToggleSidebar = () => setCollapsed((prev) => !prev);
  const handleToggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={handleToggleMobile} isSidebarCollapsed={mobileOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
