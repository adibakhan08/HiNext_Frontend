import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Award,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import { StudentDriveDrawer } from './components/StudentDriveDrawer';

const STATUS_BADGE = {
  OPEN: 'bg-emerald-500/15 text-accent-emerald',
  ONGOING: 'bg-emerald-500/15 text-accent-emerald',
  UPCOMING: 'bg-indigo-500/15 text-indigo-400',
  CLOSED: 'bg-amber-500/15 text-accent-amber',
  COMPLETED: 'bg-ink-muted/15 text-ink-secondary',
};

const REGISTRATION_BADGE = {
  REGISTERED: 'bg-emerald-500/15 text-accent-emerald',
  APPLIED: 'bg-emerald-500/15 text-accent-emerald',
  SHORTLISTED: 'bg-indigo-500/15 text-indigo-400',
  SELECTED: 'bg-emerald-500/20 text-accent-emerald',
  REJECTED: 'bg-red-500/15 text-red-400',
};

function isDriveRegistered(drive) {
  if (!drive) return false;
  const regStatus = String(drive.registration_status || '').toUpperCase();
  return (
    (regStatus && regStatus !== 'NOT_REGISTERED' && regStatus !== 'NONE') ||
    Boolean(drive.has_applied) ||
    Boolean(drive.is_registered)
  );
}

function formatPackageRange(minVal, maxVal) {
  const minNum = parseFloat(minVal);
  const maxNum = parseFloat(maxVal);
  if (!minNum && !maxNum) return 'CTC TBD';

  const toLpa = (val) => (val >= 10000 ? `${(val / 100000).toFixed(1)}` : `${val}`);
  if (minNum && maxNum && minNum !== maxNum) {
    return `${toLpa(minNum)} – ${toLpa(maxNum)} LPA`;
  }
  return `${toLpa(maxNum || minNum)} LPA`;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentDrivesPage() {
  const [drives, setDrives] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'OPEN' | 'REGISTERED' | 'CLOSED'
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [error, setError] = useState(null);

  const [selectedDrive, setSelectedDrive] = useState(null);

  const loadDrives = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axiosClient.get(API_ENDPOINTS.STUDENT.DRIVES);
      setDrives(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to load placement drives.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrives();
  }, [loadDrives]);

  const handleDriveRegistered = (driveId, registrationData) => {
    const updatedStatus = registrationData?.status || 'REGISTERED';
    setDrives((prev) =>
      prev.map((d) =>
        d.id === driveId
          ? { ...d, registration_status: updatedStatus }
          : d
      )
    );
    setSelectedDrive((prev) =>
      prev?.id === driveId
        ? { ...prev, registration_status: updatedStatus }
        : prev
    );
  };

  const handleQuickRegister = async (e, drive) => {
    e.stopPropagation();
    setError(null);
    setRegisteringId(drive.id);

    try {
      const { data } = await axiosClient.post(
        API_ENDPOINTS.STUDENT.DRIVE_REGISTRATIONS,
        {
          drive: Number(drive.id),
        }
      );
      handleDriveRegistered(drive.id, data);
    } catch (err) {
      const resData = err.response?.data;
      setError(
        resData?.detail ||
          resData?.message ||
          resData?.non_field_errors?.[0] ||
          resData?.drive?.[0] ||
          'Unable to register for this drive.'
      );
    } finally {
      setRegisteringId(null);
    }
  };

  const registeredCount = useMemo(
    () => drives.filter((d) => isDriveRegistered(d)).length,
    [drives]
  );

  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const registered = isDriveRegistered(d);
      const isOpen = d.status === 'OPEN' || d.status === 'ONGOING';

      if (filterTab === 'OPEN' && !isOpen) return false;
      if (filterTab === 'REGISTERED' && !registered) return false;
      if (filterTab === 'CLOSED' && isOpen) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const companyName = (
        d.company_name ||
        d.company?.name ||
        ''
      ).toLowerCase();

      return (
        (d.title || '').toLowerCase().includes(q) ||
        (d.job_role || '').toLowerCase().includes(q) ||
        companyName.includes(q) ||
        (d.location || '').toLowerCase().includes(q)
      );
    });
  }, [drives, filterTab, searchQuery]);

  const openDrivesCount = drives.filter(
    (d) => d.status === 'OPEN' || d.status === 'ONGOING'
  ).length;

  const totalOpenings = drives.reduce(
    (sum, d) => sum + (Number(d.openings) || 0),
    0
  );

  const highestMaxPkg = drives.reduce((max, d) => {
    const val = parseFloat(d.package_max || d.package_min) || 0;
    return val > max ? val : max;
  }, 0);

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Placement Drives"
        subtitle="Browse active campus recruitment openings, review details, and register"
      />

      <main className="space-y-6 p-7">
        {/* Top KPI Strip */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Briefcase}
            badgeText="Live"
            value={openDrivesCount}
            label="Open Drives"
            caption="Accepting registrations now"
            accent="emerald"
          />

          <StatCard
            icon={CheckCircle2}
            badgeText="Registered"
            value={registeredCount}
            label="Registered Drives"
            caption="Your active drive sign-ups"
            accent="indigo"
          />

          <StatCard
            icon={Users}
            badgeText="Seats"
            value={totalOpenings}
            label="Total Openings"
            caption="Positions across listed drives"
            accent="amber"
          />

          <StatCard
            icon={Award}
            badgeText="Top CTC"
            value={
              highestMaxPkg > 0
                ? highestMaxPkg >= 10000
                  ? `${(highestMaxPkg / 100000).toFixed(1)} LPA`
                  : `${highestMaxPkg} LPA`
                : '—'
            }
            label="Highest Package"
            caption="Across current drives"
            accent="violet"
          />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role, location..."
              className="w-full rounded-lg border border-border-subtle bg-surface-input py-2 pl-9 pr-3.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border-subtle bg-surface-input p-1">
            {[
              { key: 'ALL', label: `All (${drives.length})` },
              { key: 'OPEN', label: 'Open to Register' },
              { key: 'REGISTERED', label: `Registered (${registeredCount})` },
              { key: 'CLOSED', label: 'Closed / Past' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                  filterTab === tab.key
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Drives Card Grid */}
        {isLoading ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-12 text-center text-xs text-ink-muted">
            Loading placement drives...
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-14 text-center">
            <Briefcase className="mx-auto h-7 w-7 text-ink-muted" />
            <p className="mt-2 text-sm font-medium text-ink-secondary">
              No placement drives match your filter
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Check back soon for new campus recruitment announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDrives.map((drive) => {
              const companyName =
                drive.company_name ||
                drive.company?.name ||
                (drive.company ? `Company #${drive.company}` : 'Recruiting Partner');
              const driveStatus = drive.status || 'OPEN';
              const isOpen = driveStatus === 'OPEN' || driveStatus === 'ONGOING';
              const registered = isDriveRegistered(drive);
              const regStatusKey = String(drive.registration_status || 'REGISTERED').toUpperCase();
              const regLabel = regStatusKey.replace(/_/g, ' ');

              return (
                <div
                  key={drive.id}
                  onClick={() => setSelectedDrive(drive)}
                  className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card p-5 transition hover:border-brand-500/40 hover:bg-surface-elevated/30 cursor-pointer"
                >
                  <div>
                    {/* Top Row: Company Avatar + Status / Registration Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/12 text-sm font-bold text-accent-amber">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink-secondary">
                            {companyName}
                          </p>
                          <h3 className="truncate text-sm font-bold text-ink-primary">
                            {drive.job_role || drive.title}
                          </h3>
                        </div>
                      </div>

                      {registered ? (
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            REGISTRATION_BADGE[regStatusKey] || REGISTRATION_BADGE.REGISTERED
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {regLabel.toLowerCase()}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            STATUS_BADGE[driveStatus] || STATUS_BADGE.OPEN
                          }`}
                        >
                          {driveStatus}
                        </span>
                      )}
                    </div>

                    {/* Title & Description Snippet */}
                    <p className="mt-3 text-xs font-medium text-ink-primary">
                      {drive.title}
                    </p>
                    {drive.job_description && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                        {drive.job_description}
                      </p>
                    )}

                    {/* Package & Job Type Pills */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-accent-emerald">
                        {formatPackageRange(drive.package_min, drive.package_max)}
                      </span>
                      {drive.job_type && (
                        <span className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1 text-[11px] font-medium text-ink-secondary">
                          {drive.job_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {drive.openings != null && (
                        <span className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1 text-[11px] font-medium text-ink-secondary">
                          {drive.openings} openings
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Metadata & Register Action */}
                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle/80 pt-3.5 text-[11px] text-ink-muted">
                    <div className="space-y-1">
                      {drive.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-brand-400" />
                          <span>{drive.location}</span>
                        </div>
                      )}
                      {drive.application_deadline && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-accent-amber" />
                          <span>Register by {formatDate(drive.application_deadline)}</span>
                        </div>
                      )}
                      {!drive.application_deadline && drive.drive_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-brand-400" />
                          <span>Drive: {formatDate(drive.drive_date)}</span>
                        </div>
                      )}
                    </div>

                    {registered || !isOpen ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrive(drive);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-[11px] font-semibold text-ink-secondary transition hover:text-ink-primary cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={registeringId === drive.id}
                        onClick={(e) => handleQuickRegister(e, drive)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
                      >
                        <span>
                          {registeringId === drive.id ? 'Registering...' : 'Register'}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StudentDriveDrawer
        drive={selectedDrive}
        onClose={() => setSelectedDrive(null)}
        onApplied={handleDriveRegistered}
      />
    </div>
  );
}