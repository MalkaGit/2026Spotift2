import { Outlet } from 'react-router-dom';
import { LibraryProvider } from '@/context/LibraryContext';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <LibraryProvider>
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
    </LibraryProvider>
  );
}
