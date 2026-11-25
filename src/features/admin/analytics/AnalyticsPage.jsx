import { useEffect, useState } from 'react';
import {
  Filter,
  RotateCcw,
  TrendingUp,
  FileBarChart2,
  PieChart,
  Briefcase,
  Video,
  UserX,
  Building2,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Topbar } from '../../../components/layout/Topbar';
import { StatCard } from '../../../components/ui/StatCard';
import {
  DEFAULT_ANALYTICS_FILTERS,
  useAnalyticsData,
} from './hooks/useAnalyticsData';

function formatLpa(val) {
  const num = Number(val);
  if (!num || Number.isNaN(num)) return '0.0 LPA';
  return `${num.toFixed(1)} LPA`;
}

export function AnalyticsPage() {
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [companies, setCompanies] = useState([]);

  const {
    overview,
    placementTrends,
    applicationTrends,
    applicationStatus,
    departmentWise,
    companyWise,
    packageAnalysis,
    drivePerformance,
    interviewAnalysis,
    unplacedStudents,
    isLoading,
    failedEndpointsCount,
  } = useAnalyticsData(filters, { includeExtended: true });

  useEffect(() => {
    Promise.allSettled([
      axiosClient.get(API_ENDPOINTS.ACADEMICS.DEPARTMENTS),
      axiosClient.get(API_ENDPOINTS.ACADEMICS.COURSES),
      axiosClient.get(API_ENDPOINTS.ADMIN.COMPANIES),
    ]).then(([deptRes, courseRes, compRes]) => {
      if (deptRes.status === 'fulfilled') {
        const d = deptRes.value.data;
        setDepartments(Array.isArray(d) ? d : d?.results || []);
      }
      if (courseRes.status === 'fulfilled') {
        const cr = courseRes.value.data;
        setCourses(Array.isArray(cr) ? cr : cr?.results || []);
      }
      if (compRes.status === 'fulfilled') {
        const cp = compRes.value.data;
        setCompanies(Array.isArray(cp) ? cp : cp?.results || []);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      academic_session: '',
      department: '',
      course: '',
      company: '',
      year: '',
      start_date: '',
      end_date: '',
    });
  };

  const statusEntries = Object.entries(applicationStatus || {});
  const maxStatusCount = Math.max(
    1,
    ...statusEntries.map(([, v]) => Number(v) || 0)
  );

  const maxAppTrendCount = Math.max(
    1,
    ...applicationTrends.map(
      (t) => Number(t.total_applications ?? t.count ?? 0) || 0
    )
  );

  const maxPlacementTrendCount = Math.max(
    1,
    ...placementTrends.map((t) => Number(t.total_placements) || 0)
  );

  return (
    <div className="flex flex-1 flex-col">
      <Topbar
        title="Placement Analytics"
        subtitle="Comprehensive metrics across placements, applications, drives, interviews, and unplaced students"
      />

      <main className="flex-1 space-y-6 p-7">
        {/* Query Filters Bar */}
        <section className="rounded-xl border border-border-subtle bg-surface-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
              <Filter className="h-3.5 w-3.5 text-brand-400" />
              <span>Analytics Query Filters</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-input px-3 py-1 text-[11px] font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <input
              type="number"
              name="academic_session"
              min="1"
              value={filters.academic_session}
              onChange={handleChange}
              placeholder="Session ID"
              className="rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
            />

            <select
              name="department"
              value={filters.department}
              onChange={handleChange}
              className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface-card">
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="course"
              value={filters.course}
              onChange={handleChange}
              className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-card">
                  {c.name}
                </option>
              ))}
            </select>

            <select
              name="company"
              value={filters.company}
              onChange={handleChange}
              className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
            >
              <option value="">All Companies</option>
              {companies.map((cp) => (
                <option key={cp.id} value={cp.id} className="bg-surface-card">
                  {cp.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="year"
              min="2000"
              max="2100"
              value={filters.year}
              onChange={handleChange}
              placeholder="Year (2026)"
              className="rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none"
            />

            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
              aria-label="Start date"
              className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
            />

            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
              aria-label="End date"
              className="rounded-lg border border-border-subtle bg-surface-input px-2.5 py-1.5 text-xs text-ink-primary focus:border-border-focus focus:outline-none"
            />
          </div>
        </section>

        {failedEndpointsCount > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-xs text-amber-200">
            {failedEndpointsCount} of 10 analytics endpoints could not be loaded. Displaying available records.
          </div>
        )}

        {/* Overview Summary Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            value={isLoading ? '—' : `${Number(overview.placement_rate || 0).toFixed(1)}%`}
            label="Placement Rate"
            caption={`${overview.total_placed} placed of ${overview.total_candidates} candidates`}
            accent="emerald"
          />
          <StatCard
            icon={FileBarChart2}
            value={isLoading ? '—' : overview.total_applications}
            label="Total Applications"
            caption={`Across ${overview.total_drives} placement drives`}
            accent="indigo"
          />
          <StatCard
            icon={Video}
            value={isLoading ? '—' : interviewAnalysis.total_interviews}
            label="Total Interviews"
            caption={`${interviewAnalysis.completed} completed · ${interviewAnalysis.scheduled} scheduled`}
            accent="violet"
          />
          <StatCard
            icon={UserX}
            value={isLoading ? '—' : overview.total_unplaced || unplacedStudents.length}
            label="Unplaced Students"
            caption={`${unplacedStudents.length} listed in unplaced report`}
            accent="amber"
          />
        </div>

        {/* Placement Trends + Application Trends */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <TrendingUp className="h-4 w-4 text-brand-400" />
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Placement Trends
                </h2>
                <p className="text-[11px] text-ink-muted">
                  /api/analytics/placement-trends/
                </p>
              </div>
            </div>

            {placementTrends.length === 0 ? (
              <p className="py-10 text-center text-xs text-ink-muted">
                No placement trend data available.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {placementTrends.map((t, i) => {
                  const val = Number(t.total_placements) || 0;
                  const pct = Math.max(4, Math.round((val / maxPlacementTrendCount) * 100));
                  return (
                    <div key={`${t.month}-${t.year}-${i}`} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-secondary">
                          {t.month} {t.year || ''}
                        </span>
                        <span className="font-mono font-bold text-ink-primary">
                          {val}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-input">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <FileBarChart2 className="h-4 w-4 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Application Trends
                </h2>
                <p className="text-[11px] text-ink-muted">
                  /api/analytics/application-trends/
                </p>
              </div>
            </div>

            {applicationTrends.length === 0 ? (
              <p className="py-10 text-center text-xs text-ink-muted">
                No application trend data available.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {applicationTrends.map((t, i) => {
                  const val =
                    Number(t.total_applications ?? t.count ?? 0) || 0;
                  const pct = Math.max(4, Math.round((val / maxAppTrendCount) * 100));
                  return (
                    <div key={`${t.month}-${t.year}-${i}`} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-secondary">
                          {t.month || t.label || `Period ${i + 1}`} {t.year || ''}
                        </span>
                        <span className="font-mono font-bold text-ink-primary">
                          {val}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-input">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Application Status Distribution + Interview Analysis */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <PieChart className="h-4 w-4 text-accent-emerald" />
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Application Status Distribution
                </h2>
                <p className="text-[11px] text-ink-muted">
                  /api/analytics/application-status/
                </p>
              </div>
            </div>

            {statusEntries.length === 0 ? (
              <p className="py-10 text-center text-xs text-ink-muted">
                No application status breakdown available.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {statusEntries.map(([stage, count]) => {
                  const num = Number(count) || 0;
                  const pct = Math.max(4, Math.round((num / maxStatusCount) * 100));
                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-ink-secondary">
                          {stage.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-bold text-ink-primary">
                          {num}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-input">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6 xl:col-span-6">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
              <Video className="h-4 w-4 text-brand-400" />
              <div>
                <h2 className="text-sm font-bold text-ink-primary">
                  Interview &amp; Round Analysis
                </h2>
                <p className="text-[11px] text-ink-muted">
                  /api/analytics/interview-analysis/
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Scheduled', val: interviewAnalysis.scheduled },
                { label: 'Completed', val: interviewAnalysis.completed },
                { label: 'Passed', val: interviewAnalysis.passed },
                { label: 'Failed', val: interviewAnalysis.failed },
                { label: 'On Hold', val: interviewAnalysis.on_hold },
                { label: 'Pending', val: interviewAnalysis.pending },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="rounded-xl border border-border-subtle bg-surface-input/40 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                    {cell.label}
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-ink-primary">
                    {cell.val ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Department-wise + Company-wise + Package Analysis */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-ink-primary">
                Department-wise
              </h2>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              {departmentWise.length === 0 ? (
                <p className="py-8 text-center text-ink-muted">No data</p>
              ) : (
                departmentWise.map((d, i) => (
                  <div
                    key={`${d.department}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-input/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-ink-primary">{d.department}</p>
                      <p className="text-[11px] text-ink-muted">
                        {d.placed_students ?? 0}/{d.total_students ?? 0} placed
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-accent-emerald">
                        {Number(d.placement_percentage || 0).toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-ink-secondary">
                        Avg {formatLpa(d.average_package)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Building2 className="h-4 w-4 text-accent-amber" />
              <h2 className="text-sm font-bold text-ink-primary">
                Company-wise
              </h2>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              {companyWise.length === 0 ? (
                <p className="py-8 text-center text-ink-muted">No data</p>
              ) : (
                companyWise.map((c, i) => (
                  <div
                    key={`${c.company}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-input/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-ink-primary">{c.company}</p>
                      <p className="text-[11px] text-ink-muted">
                        Avg {formatLpa(c.average_package)}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-accent-emerald">
                        {c.total_placements ?? 0} placed
                      </p>
                      <p className="text-[11px] text-ink-secondary">
                        Max {formatLpa(c.highest_package)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Layers className="h-4 w-4 text-accent-emerald" />
              <h2 className="text-sm font-bold text-ink-primary">
                Package Distribution
              </h2>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              {(packageAnalysis.package_distribution || []).length === 0 ? (
                <p className="py-8 text-center text-ink-muted">No data</p>
              ) : (
                packageAnalysis.package_distribution.map((b, i) => (
                  <div
                    key={`${b.range}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-input/40 px-3 py-2"
                  >
                    <span className="font-medium text-ink-secondary">{b.range}</span>
                    <span className="font-mono font-bold text-ink-primary">
                      {b.count ?? 0}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Drive Performance Table (/api/analytics/drive-performance/) */}
        <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
            <Briefcase className="h-4 w-4 text-brand-400" />
            <div>
              <h2 className="text-sm font-bold text-ink-primary">
                Drive Performance
              </h2>
              <p className="text-[11px] text-ink-muted">
                /api/analytics/drive-performance/
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="py-2.5 pr-3">Drive</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5 text-right">Registered</th>
                  <th className="px-3 py-2.5 text-right">Applications</th>
                  <th className="px-3 py-2.5 text-right">Shortlisted</th>
                  <th className="px-3 py-2.5 text-right">Interviews</th>
                  <th className="px-3 py-2.5 text-right">Selected</th>
                  <th className="py-2.5 pl-3 text-right">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70 text-xs">
                {drivePerformance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No drive performance records available.
                    </td>
                  </tr>
                ) : (
                  drivePerformance.map((dr) => (
                    <tr key={dr.drive_id} className="hover:bg-surface-elevated/40">
                      <td className="py-3 pr-3 font-semibold text-ink-primary">
                        {dr.drive_title}
                      </td>
                      <td className="px-3 py-3 text-ink-secondary">{dr.company}</td>
                      <td className="px-3 py-3 text-right font-mono">{dr.total_registered ?? 0}</td>
                      <td className="px-3 py-3 text-right font-mono">{dr.total_applications ?? 0}</td>
                      <td className="px-3 py-3 text-right font-mono">{dr.total_shortlisted ?? 0}</td>
                      <td className="px-3 py-3 text-right font-mono">{dr.total_interviews ?? 0}</td>
                      <td className="px-3 py-3 text-right font-mono text-accent-amber">{dr.total_selected ?? 0}</td>
                      <td className="py-3 pl-3 text-right font-mono font-bold text-accent-emerald">{dr.total_placed ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Unplaced Students Table (/api/analytics/unplaced-students/) */}
        <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
            <UserX className="h-4 w-4 text-accent-amber" />
            <div>
              <h2 className="text-sm font-bold text-ink-primary">
                Unplaced Students ({unplacedStudents.length})
              </h2>
              <p className="text-[11px] text-ink-muted">
                /api/analytics/unplaced-students/
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="py-2.5 pr-3">Student</th>
                  <th className="px-3 py-2.5">Enrollment #</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5 text-right">CGPA</th>
                  <th className="px-3 py-2.5 text-right">Grad Year</th>
                  <th className="px-3 py-2.5 text-right">Applications</th>
                  <th className="py-2.5 pl-3">Latest Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70 text-xs">
                {unplacedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No unplaced students found for the current filters.
                    </td>
                  </tr>
                ) : (
                  unplacedStudents.map((st, idx) => (
                    <tr key={st.id ?? st.enrollment_number ?? idx} className="hover:bg-surface-elevated/40">
                      <td className="py-3 pr-3 font-semibold text-ink-primary">
                        {st.student_name || st.name || '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-secondary">
                        {st.enrollment_number || '—'}
                      </td>
                      <td className="px-3 py-3 text-ink-secondary">
                        {st.department || '—'}
                      </td>
                      <td className="px-3 py-3 text-ink-secondary">
                        {st.course || '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-ink-primary">
                        {st.cgpa ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-ink-secondary">
                        {st.graduation_year ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {st.applications_count ?? st.total_applications ?? 0}
                      </td>
                      <td className="py-3 pl-3">
                        <span className="rounded-full bg-surface-input px-2.5 py-0.5 text-[10px] font-semibold text-ink-secondary">
                          {st.latest_application_status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}