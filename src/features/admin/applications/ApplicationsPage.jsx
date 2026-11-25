import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Award,
  MapPin,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import { DriveEnrollmentsDrawer } from './components/DriveEnrollmentsDrawer';

const STATUS_BADGE = {
  OPEN: 'bg-emerald-500/15 text-accent-emerald',
  ONGOING: 'bg-emerald-500/15 text-accent-emerald',
  UPCOMING: 'bg-indigo-500/15 text-indigo-400',
  CLOSED: 'bg-amber-500/15 text-accent-amber',
  COMPLETED: 'bg-ink-muted/15 text-ink-secondary',
};

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ApplicationsPage() {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDrive, setSelectedDrive] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [drivesRes, appsRes] = await Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ADMIN.DRIVES),
      axiosClient.get(API_ENDPOINTS.ADMIN.APPLICATIONS),
    ]);

    if (drivesRes.status === 'fulfilled') {
      const d = drivesRes.value.data;
      setDrives(Array.isArray(d) ? d : d.results || []);
    } else {
      setError('Failed to load placement drives.');
    }

    if (appsRes.status === 'fulfilled') {
      const a = appsRes.value.data;
      setApplications(Array.isArray(a) ? a : a.results || []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplicationUpdated = (updatedApp) => {
    setApplications((prev) =>
      prev.map((item) =>
        item.id === updatedApp.id ? { ...item, ...updatedApp } : item
      )
    );
  };

  const statsByDrive = useMemo(() => {
    const map = new Map();
    applications.forEach((app) => {
      const dId = Number(app.drive?.id ?? app.drive);
      if (!dId) return;

      const current = map.get(dId) || {
        total: 0,
        shortlisted: 0,
        interview: 0,
        selected: 0,
      };
      const st = String(app.status || 'REGISTERED').toUpperCase();
      current.total += 1;
      if (st === 'SHORTLISTED') current.shortlisted += 1;
      if (st === 'INTERVIEW') current.interview += 1;
      if (st === 'SELECTED') current.selected += 1;

      map.set(dId, current);
    });
    return map;
  }, [applications]);

  const filteredDrives = useMemo(() => {
    return drives.filter((drive) => {
      const driveStatus = String(drive.status || 'OPEN').toUpperCase();
      if (statusFilter !== 'ALL' && driveStatus !== statusFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const companyName = (
        drive.company_name ||
        drive.company?.name ||
        ''
      ).toLowerCase();

      return (
        (drive.title || '').toLowerCase().includes(q) ||
        (drive.job_role || '').toLowerCase().includes(q) ||
        companyName.includes(q) ||
        (drive.location || '').toLowerCase().includes(q)
      );
    });
  }, [drives, statusFilter, searchQuery]);

  const globalCounts = useMemo(() => {
    const counts = {
      total: applications.length,
      shortlisted: 0,
      interview: 0,
      selected: 0,
    };
    applications.forEach((a) => {
      const st = String(a.status || 'REGISTERED').toUpperCase();
      if (st === 'SHORTLISTED') counts.shortlisted += 1;
      if (st === 'INTERVIEW') counts.interview += 1;
      if (st === 'SELECTED') counts.selected += 1;
    });
    return counts;
  }, [applications]);

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Drive Applications"
        subtitle="Select any placement drive to view enrolled candidates, manage rounds, and schedule interviews"
      />

      <main className="space-y-6 p-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            value={globalCounts.total}
            label="Total Enrollments"
            caption={`Across ${drives.length} drives`}
            accent="indigo"
          />
          <StatCard
            icon={CheckCircle2}
            value={globalCounts.shortlisted}
            label="Shortlisted"
            caption="Cleared initial screening"
            accent="violet"
          />
          <StatCard
            icon={Clock}
            value={globalCounts.interview}
            label="In Interview"
            caption="Active interview rounds"
            accent="amber"
          />
          <StatCard
            icon={Award}
            value={globalCounts.selected}
            label="Selected / Offers"
            caption="Final placement offers"
            accent="emerald"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drive, company, or role..."
              className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1">
            {['ALL', 'OPEN', 'ONGOING', 'CLOSED'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {tab === 'ALL' ? `All Drives (${drives.length})` : tab}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-12 text-center text-xs text-ink-muted">
            Loading placement drives &amp; enrollments...
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-14 text-center">
            <Briefcase className="mx-auto h-7 w-7 text-ink-muted" />
            <p className="mt-2 text-sm font-medium text-ink-secondary">
              No placement drives match your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDrives.map((drive) => {
              const companyName =
                drive.company_name ||
                drive.company?.name ||
                `Company #${drive.company}`;
              const driveStatus = drive.status || 'OPEN';
              const stats = statsByDrive.get(drive.id) || {
                total: drive.applicants_count ?? 0,
                shortlisted: 0,
                interview: 0,
                selected: 0,
              };

              return (
                <div
                  key={drive.id}
                  onClick={() => setSelectedDrive(drive)}
                  className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card p-5 transition hover:border-brand-500/40 hover:bg-surface-elevated/30 cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/15 text-sm font-bold text-brand-400">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink-secondary">
                            {companyName}
                          </p>
                          <h3 className="truncate text-sm font-bold text-ink-primary">
                            {drive.title}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_BADGE[driveStatus] || STATUS_BADGE.OPEN
                        }`}
                      >
                        {driveStatus}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-ink-muted">{drive.job_role}</p>

                    <div className="mt-4 grid grid-cols-4 divide-x divide-border-subtle rounded-xl border border-border-subtle bg-surface-input/60 py-2.5 text-center">
                      <div>
                        <p className="text-[10px] text-ink-muted">Enrolled</p>
                        <p className="mt-0.5 text-xs font-bold text-ink-primary">
                          {stats.total}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-ink-muted">Shortlist</p>
                        <p className="mt-0.5 text-xs font-bold text-indigo-400">
                          {stats.shortlisted}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-ink-muted">Interview</p>
                        <p className="mt-0.5 text-xs font-bold text-accent-amber">
                          {stats.interview}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-ink-muted">Selected</p>
                        <p className="mt-0.5 text-xs font-bold text-accent-emerald">
                          {stats.selected}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle/80 pt-3.5 text-[11px] text-ink-muted">
                    <div className="flex items-center gap-3">
                      {drive.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-brand-400" />
                          {drive.location}
                        </span>
                      )}
                      {drive.drive_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-accent-emerald" />
                          {formatDate(drive.drive_date)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrive(drive);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-500/15 px-3 py-1.5 text-[11px] font-semibold text-brand-400 transition hover:bg-brand-500 hover:text-white cursor-pointer"
                    >
                      <span>View Students</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <DriveEnrollmentsDrawer
        drive={selectedDrive}
        onClose={() => setSelectedDrive(null)}
        onApplicationUpdated={handleApplicationUpdated}
      />
    </div>
  );
}