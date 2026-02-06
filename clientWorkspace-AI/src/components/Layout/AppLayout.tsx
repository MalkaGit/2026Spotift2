import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { MIN_ARTISTS } from '@/constants';
import { LibraryProvider, useLibraryContext } from '@/context/LibraryContext';
import { getArtistCount } from '@/utils/library';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { Spinner } from '@/components/Common/Spinner';

function OnboardingGate({ children }: { children: ReactNode }) {
  const { items, isLoading } = useLibraryContext();
  const location = useLocation();
  const artistCount = getArtistCount(items);
  const isOnOnboarding = location.pathname.includes('onboarding/favorites');
  const blocked = !isLoading && artistCount < MIN_ARTISTS;

  if (isLoading) {
    return (
      <div className="layout-center" style={{ minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  if (blocked && !isOnOnboarding) {
    return <Navigate to="/onboarding/favorites" replace />;
  }
  if (blocked && isOnOnboarding) {
    return (
      <div className="app-layout app-layout-onboarding-only">
        <main className="app-content app-content-full">
          <Outlet />
        </main>
      </div>
    );
  }
  return <>{children}</>;
}

export function AppLayout() {
  return (
    <LibraryProvider>
      <OnboardingGate>
        <div className="app-layout">
          <SideNav />
          <div className="app-main">
            <TopBar />
            <main className="app-content">
              <Outlet />
            </main>
            <BottomNav />
          </div>
        </div>
      </OnboardingGate>
    </LibraryProvider>
  );
}
