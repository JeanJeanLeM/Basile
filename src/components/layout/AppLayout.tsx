import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileSheet from './MobileSheet';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../hooks/useAuth';
import { hasGuestData } from '../../services/guestStorage';
import { migrateGuestDataToServer } from '../../services/migrationService';

export default function AppLayout() {
  const { isMobile } = useSidebar();
  const { user, getToken } = useAuth();

  useEffect(() => {
    if (!user || !hasGuestData()) return;
    getToken()
      .then(migrateGuestDataToServer)
      .then((r: { success: boolean; cropsCount?: number; plansCount?: number }) => {
        if (r.success) console.log('[AppLayout] Données invité migrées:', r.cropsCount, 'crops', r.plansCount, 'plans');
      })
      .catch((err: unknown) => console.error('[AppLayout] Migration invité:', err));
  }, [user?.id]);

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile ? <MobileSheet /> : <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
