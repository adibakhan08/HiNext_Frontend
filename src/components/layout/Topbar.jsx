import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Topbar({ title, subtitle }) {
  const { user, role } = useAuth();
  const label = role === 'ADMIN' ? 'Admin' : user?.username || 'Student';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle/60 px-7 py-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
          />
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-input text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-400" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600/30 text-[11px] font-bold text-teal-300">
            {label.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-ink-primary">{label}</span>
        </div>
      </div>
    </header>
  );
}