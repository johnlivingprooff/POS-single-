import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleCloseMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={handleCloseMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `mobile-sidebar ${sidebarOpen ? 'mobile-sidebar-open' : 'mobile-sidebar-closed'}`
            : `flex flex-col bg-white shadow-lg transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`
        }`}
        style={!isMobile ? { minWidth: collapsed ? '5rem' : '16rem' } : undefined}
      >
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          onClose={isMobile ? handleCloseMobileSidebar : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isMobile ? false : collapsed}
          isMobile={isMobile}
        />
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto bg-gray-100 lg:p-6">
          <div className="mobile-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
