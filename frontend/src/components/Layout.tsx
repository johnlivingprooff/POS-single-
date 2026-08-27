import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={handleToggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <Header onToggleSidebar={handleToggleSidebar} isSidebarCollapsed={collapsed} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
