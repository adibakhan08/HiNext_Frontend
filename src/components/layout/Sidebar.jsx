import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  Award,
  Calendar,
  FileText,
  GraduationCap,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_MENU = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: TrendingUp },
  { label: 'Candidates', path: '/admin/candidates', icon: Users },
  { label: 'Companies', path: '/admin/companies', icon: Building2 },
  { label: 'Drives', path: '/admin/drives', icon: Briefcase },
  { label: 'Applications', path: '/admin/applications', icon: ClipboardList },
  { label: 'Academics', path: '/admin/academics', icon: GraduationCap },
  { label: 'Analytics', path: '/admin/analytics', icon: Award },
  { label: 'Calendar', path: '/admin/calendar', icon: Calendar },
  { label: 'Reports', path: '/admin/reports', icon: FileText },
];

const STUDENT_MENU = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutGrid },
  { label: 'My Profile', path: '/student/profile', icon: UserCircle },
  { label: 'Placement Drives', path: '/student/drives', icon: Briefcase },
  { label: 'My Applications', path: '/student/applications', icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';
  const menuItems = role === 'ADMIN' ? ADMIN_MENU : STUDENT_MENU;

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.email?.split('@')[0] ||
    (role === 'ADMIN' ? 'Placement Admin' : 'Student User');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border-subtle bg-surface-sidebar">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-brand-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-ink-primary">
              CampusHire
            </p>
            <p className="text-[11px] font-medium text-ink-muted">
              {role === 'ADMIN' ? 'Placement Admin' : 'Student Portal'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {role === 'ADMIN' ? 'Placement Cell' : 'Student Menu'}
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-brand-900/45 text-brand-400 shadow-xs'
                        : 'text-ink-secondary hover:bg-surface-elevated/60 hover:text-ink-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-brand-400'
                            : 'text-ink-muted group-hover:text-ink-secondary'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="shrink-0 border-t border-border-subtle p-3.5">
        <div className="flex items-center gap-3 rounded-xl bg-surface-elevated/50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400 ring-1 ring-brand-500/40">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink-primary">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-ink-muted">
              {user?.email || (role === 'ADMIN' ? 'admin@campushire.edu' : 'student@campushire.edu')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-card hover:text-red-400 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}