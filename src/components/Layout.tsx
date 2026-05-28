import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ThemeBackground from './ThemeBackground';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import FloatingSupportButton from './FloatingSupportButton';
import { usePopUnderAd } from './AdManager';

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav }) => {
  usePopUnderAd();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <ThemeBackground />

      {!hideNav && <AppSidebar />}

      <div className={`${!hideNav ? 'md:ml-16' : ''} transition-all duration-300`}>
        <main className="relative z-10 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
      </div>

      {!hideNav && <MobileBottomNav />}

      {/* Floating support button — only on Home */}
      {isHome && <FloatingSupportButton />}
    </div>
  );
};

export default Layout;
