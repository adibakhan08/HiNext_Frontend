import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-base text-ink-primary">
      {/* Fixed-height Sidebar */}
      <Sidebar />

      {/* Independently Scrollable Right Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}