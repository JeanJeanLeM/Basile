import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const SIDEBAR_COOKIE = 'sidebarCollapsed';
const COOKIE_EXPIRY_DAYS = 365;

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = Cookies.get(SIDEBAR_COOKIE);
    return saved === 'true';
  });

  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    Cookies.set(SIDEBAR_COOKIE, String(newValue), {
      expires: COOKIE_EXPIRY_DAYS,
    });
  };

  return {
    isCollapsed,
    isMobile,
    toggle,
    setIsCollapsed,
  };
}
