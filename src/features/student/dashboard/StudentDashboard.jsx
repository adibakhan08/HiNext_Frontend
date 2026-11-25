
import { useEffect, useState } from 'react';
import {
  Briefcase,
  FileText,
  Calendar,
  Award,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';

const STATUS_STYLES = {
  SHORTLISTED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  INTERVIEW_SCHEDULED:
    'bg-amber-500/15 text-accent-amber border-amber-500/25',
  OFFERED: 'bg-emerald-500/15 text-accent-emerald border-emerald-500/25',
  APPLIED: 'bg-brand-500/15 text-brand-400 border-brand-500/25',
};

const formatPackage = (min, max) => {
  const minLpa = Number(min) / 100000;
  const maxLpa = Number(max) / 100000;

  if (!min && !max) return 'Package not specified';

  if (minLpa === maxLpa) {
    return `${minLpa.toFixed(1)} LPA`;
  }

  return `${minLpa.toFixed(1)} - ${maxLpa.toFixed(1)} LPA`;
};

const formatDate = (date) => {
  if (!date) return 'Not specified';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function StudentDashboard() {
  const [profile, setProfile] = useState({
    department: '',
    is_placed: false,
  });

  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [profileRes, drivesRes, appsRes] = await Promise.allSettled([
        axiosClient.get(API_ENDPOINTS.STUDENT.PROFILE),
        axiosClient.get(API_ENDPOINTS.STUDENT.DRIVES),
        axiosClient.get(API_ENDPOINTS.STUDENT.APPLICATIONS),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }

      if (drivesRes.status === 'fulfilled') {
        const response = drivesRes.value.data;

        // Handle paginated and non-paginated API responses
        const driveList = Array.isArray(response)
          ? response
          : response.results || [];

        setDrives(driveList);
      }

      if (appsRes.status === 'fulfilled') {
        const response = appsRes.value.data;

        setApplications(
          Array.isArray(response)
            ? response
            : response.results || []
        );
      }
    };

    fetchDashboardData();
  }, []);

  const eligibleDrives = drives
  .filter((drive) => drive.status === 'OPEN')
  .sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )
  .slice(0, 2);

  const upcomingInterviews = applications.filter(
    (app) => app.status === 'INTERVIEW_SCHEDULED'
  ).length;

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title={profile.user || 'Student Dashboard'}
        subtitle={`${profile.department || 'Department'} · CGPA ${
          profile.current_cgpa || 'N/A'
        }`}
      />

      <main className="flex-1 space-y-6 p-7">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Briefcase}
            badgeText="Open"
            value={eligibleDrives.length}
            label="Open Placement Drives"
            caption="Currently accepting applications"
            accent="indigo"
          />

          <StatCard
            icon={FileText}
            badgeText="Active"
            value={applications.length}
            label="My Applications"
            caption="Track your application progress"
            accent="emerald"
          />

          <StatCard
            icon={Calendar}
            badgeText="Upcoming"
            value={upcomingInterviews}
            label="Scheduled Interviews"
            caption="Your upcoming interview rounds"
            accent="amber"
          />

          <StatCard
            icon={Award}
            badgeText={profile.is_placed ? 'Placed' : 'In Progress'}
            value={profile.is_placed ? '1 Offer' : 'Active'}
            label="Placement Status"
            caption="Your placement journey"
            accent="violet"
          />

        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">

          {/* Eligible Placement Drives */}
          <div className="rounded-xl border border-border-subtle bg-surface-card p-5">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">
                Open Placement Drives
              </h2>

              <Link
                to="/student/drives"
                className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:underline"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">

              {eligibleDrives.length > 0 ? (
                eligibleDrives.slice(0, 4).map((drive) => (
                  <div
                    key={drive.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle/80 bg-surface-input/70 p-4 transition hover:border-brand-500/40"
                  >

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-primary">
                          {drive.company_name || 'Company'}
                        </span>

                        <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-accent-emerald">
                          {formatPackage(
                            drive.package_min,
                            drive.package_max
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-medium text-ink-secondary">
                        {drive.title}
                      </p>

                      <p className="mt-0.5 text-xs text-ink-secondary">
                        {drive.job_role}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">

                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {drive.location || 'Location not specified'}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Apply before {formatDate(
                            drive.application_deadline
                          )}
                        </span>

                      </div>

                      <p className="mt-1 text-[11px] text-ink-muted">
                        {drive.openings || 0} openings · {drive.job_type?.replace('_', ' ')}
                      </p>

                    </div>

                    <Link
                      to="/student/drives"
                      className="rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600"
                    >
                      Apply Now
                    </Link>

                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
                  <Briefcase className="mx-auto mb-2 h-8 w-8 text-ink-muted" />

                  <p className="text-sm font-medium text-ink-primary">
                    No open placement drives
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    New placement opportunities will appear here.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Application Pipeline */}
          <div className="rounded-xl border border-border-subtle bg-surface-card p-5">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">
                Application Pipeline
              </h2>

              <Link
                to="/student/applications"
                className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:underline"
              >
                Track all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">

              {applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-border-subtle/80 bg-surface-input/70 p-4"
                  >

                    <div className="flex items-center justify-between gap-2">

                      <span className="text-sm font-semibold text-ink-primary">
                        {app.company_name}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                          STATUS_STYLES[app.status] ||
                          STATUS_STYLES.APPLIED
                        }`}
                      >
                        {app.status?.replaceAll('_', ' ')}
                      </span>

                    </div>

                    <p className="mt-0.5 text-xs text-ink-secondary">
                      {app.role || app.job_role}
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                      {app.round || 'Application submitted'}
                    </p>

                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-ink-muted" />

                  <p className="text-sm font-medium text-ink-primary">
                    No applications yet
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    Apply to an open placement drive to get started.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
